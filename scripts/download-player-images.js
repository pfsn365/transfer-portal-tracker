const fs = require('fs');
const path = require('path');
const https = require('https');

// Output directory for images
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'player-images');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Helper to create a slug from player name
function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Search ESPN for a college football player
async function searchESPNPlayer(name, school) {
  try {
    const searchUrl = `https://site.api.espn.com/apis/common/v3/search?query=${encodeURIComponent(name)}&limit=10&mode=prefix&type=player&sport=football`;

    const response = await fetch(searchUrl);
    if (!response.ok) return null;

    const data = await response.json();
    const items = data?.items || [];

    for (const item of items) {
      const isCollegeFootball = item?.league === 'college-football' ||
                                item?.league?.slug === 'college-football' ||
                                item?.league?.abbreviation === 'NCAAF';

      if (isCollegeFootball && item?.id) {
        if (school) {
          const teamName = item?.teamRelationships?.[0]?.displayName?.toLowerCase() ||
                          item?.team?.displayName?.toLowerCase() || '';
          const schoolLower = school.toLowerCase();
          if (teamName.includes(schoolLower) || schoolLower.includes(teamName.split(' ')[0])) {
            return item.id;
          }
        } else {
          return item.id;
        }
      }
    }

    // Fallback: return first college player found
    for (const item of items) {
      if (item?.id && (item?.league === 'college-football' || item?.league?.slug === 'college-football')) {
        return item.id;
      }
    }

    return null;
  } catch (error) {
    console.error(`Error searching ESPN for ${name}:`, error.message);
    return null;
  }
}

// Get player headshot URL from ESPN
async function getESPNHeadshot(espnId) {
  try {
    const url = `https://site.api.espn.com/apis/common/v3/sports/football/college-football/athletes/${espnId}`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    return data?.athlete?.headshot?.href || null;
  } catch (error) {
    return null;
  }
}

// Download image from URL
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);

    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          file.close();
          downloadImage(redirectUrl, filepath).then(resolve).catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        file.close();
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(true);
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      reject(err);
    });
  });
}

// Fetch stat leaders from ESPN API
async function fetchStatLeaders(group = '80') {
  const currentYear = new Date().getFullYear();
  const yearsToTry = [currentYear, currentYear - 1];

  const players = [];
  const seenIds = new Set();

  for (const year of yearsToTry) {
    try {
      const url = `https://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/${year}/types/2/leaders?groups=${group}`;

      console.log(`Fetching stat leaders for ${year} (group ${group})...`);
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CFB-HQ/1.0)',
        },
      });

      if (!response.ok) continue;

      const data = await response.json();

      if (data.categories) {
        for (const category of data.categories) {
          const leaders = category.leaders || [];

          for (const leader of leaders.slice(0, 25)) {
            const athlete = leader.athlete;
            if (!athlete) continue;

            // Fetch athlete details if needed
            let athleteData = athlete;
            if (athlete.$ref) {
              try {
                const athleteResponse = await fetch(athlete.$ref, {
                  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CFB-HQ/1.0)' },
                });
                if (athleteResponse.ok) {
                  athleteData = await athleteResponse.json();
                }
              } catch {
                // Use whatever data we have
              }
            }

            // Get team info
            let teamData = athleteData.team || {};
            if (teamData.$ref) {
              try {
                const teamResponse = await fetch(teamData.$ref, {
                  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CFB-HQ/1.0)' },
                });
                if (teamResponse.ok) {
                  teamData = await teamResponse.json();
                }
              } catch {
                // Use whatever data we have
              }
            }

            const playerId = athleteData.id;
            if (playerId && !seenIds.has(playerId)) {
              seenIds.add(playerId);
              players.push({
                id: playerId,
                name: athleteData.displayName || athleteData.fullName || 'Unknown',
                school: teamData.displayName || teamData.name || 'Unknown',
                headshot: athleteData.headshot?.href,
              });
            }
          }
        }
      }

      // If we got data, break the loop
      if (players.length > 0) break;
    } catch (error) {
      console.error(`Failed to fetch leaders for year ${year}:`, error.message);
    }
  }

  return players;
}

// Main function
async function main() {
  console.log('Fetching stat leaders from ESPN...\n');

  // Fetch both FBS and FCS leaders
  const fbsPlayers = await fetchStatLeaders('80');
  const fcsPlayers = await fetchStatLeaders('81');

  const allPlayers = [...fbsPlayers, ...fcsPlayers];

  // Remove duplicates by ID
  const uniquePlayers = Array.from(
    new Map(allPlayers.map(p => [p.id, p])).values()
  );

  if (uniquePlayers.length === 0) {
    console.error('No players found from ESPN API.');
    process.exit(1);
  }

  console.log(`Found ${uniquePlayers.length} unique players\n`);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < uniquePlayers.length; i++) {
    const player = uniquePlayers[i];
    const slug = createSlug(player.name);
    const filepath = path.join(OUTPUT_DIR, `${slug}.png`);

    // Skip if image already exists
    if (fs.existsSync(filepath)) {
      console.log(`[${i + 1}/${uniquePlayers.length}] Skipping ${player.name} (already exists)`);
      skipped++;
      continue;
    }

    console.log(`[${i + 1}/${uniquePlayers.length}] Processing ${player.name} (${player.school})...`);

    // First try the headshot we already have
    let headshotUrl = player.headshot;

    // If no headshot from initial data, search for it
    if (!headshotUrl) {
      const espnId = await searchESPNPlayer(player.name, player.school);
      if (espnId) {
        headshotUrl = await getESPNHeadshot(espnId);
      }
    }

    if (!headshotUrl) {
      console.log(`  ❌ No headshot available`);
      failed++;
      continue;
    }

    // Download the image
    try {
      await downloadImage(headshotUrl, filepath);
      console.log(`  ✅ Downloaded`);
      downloaded++;
    } catch (error) {
      console.log(`  ❌ Download failed: ${error.message}`);
      failed++;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n=== Summary ===');
  console.log(`Downloaded: ${downloaded}`);
  console.log(`Skipped (existing): ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${uniquePlayers.length}`);
}

main().catch(console.error);
