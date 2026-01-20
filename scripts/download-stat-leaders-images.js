#!/usr/bin/env node

/**
 * Script to download player images for CFB stat leaders from ESPN
 * Run with: node scripts/download-stat-leaders-images.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const PLAYER_IMAGES_DIR = path.join(__dirname, '../public/player-images');

// Create slug from player name
function createPlayerSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Fetch JSON from URL with proper headers
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    // Convert http to https
    const httpsUrl = url.replace('http://', 'https://');

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CFB-HQ/1.0)',
      }
    };

    https.get(httpsUrl, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON from ${httpsUrl}: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

// Download image to file
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(true);
        });
      } else {
        file.close();
        fs.unlink(filepath, () => {});
        resolve(false);
      }
    }).on('error', (err) => {
      file.close();
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

// Get headshot URL from ESPN player ID
function getHeadshotURL(playerId) {
  return `https://a.espncdn.com/i/headshots/college-football/players/full/${playerId}.png`;
}

// Main function
async function main() {
  console.log('Fetching CFB stat leaders from ESPN...');

  // Ensure directory exists
  if (!fs.existsSync(PLAYER_IMAGES_DIR)) {
    fs.mkdirSync(PLAYER_IMAGES_DIR, { recursive: true });
  }

  // Get existing images
  const existingImages = new Set(
    fs.readdirSync(PLAYER_IMAGES_DIR)
      .filter(f => f.endsWith('.png'))
      .map(f => f.replace('.png', ''))
  );

  console.log(`Found ${existingImages.size} existing images`);

  // Try different years
  const yearsToTry = [2025, 2024];
  let data = null;
  let usedYear = null;

  for (const year of yearsToTry) {
    try {
      console.log(`Trying year ${year}...`);
      const url = `https://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/${year}/types/2/leaders?limit=100`;
      data = await fetchJSON(url);
      if (data.categories && data.categories.length > 0) {
        usedYear = year;
        console.log(`Using data from ${year} season`);
        break;
      }
    } catch (e) {
      console.log(`Year ${year} failed: ${e.message}`);
    }
  }

  if (!data || !data.categories) {
    console.error('Failed to fetch stat leaders data');
    process.exit(1);
  }

  console.log(`Found ${data.categories.length} stat categories`);

  // Collect all unique players from all categories
  const playersMap = new Map(); // Use map to dedupe by player ID

  for (const category of data.categories) {
    const categoryName = category.displayName || category.name || 'Unknown';
    const leaders = category.leaders || [];

    console.log(`\nCategory: ${categoryName} (${leaders.length} leaders)`);

    // Process top 50 leaders
    let processed = 0;
    for (const leader of leaders.slice(0, 50)) {
      // The leader object has athlete.$ref which we need to fetch
      const athleteRef = leader.athlete?.$ref;

      if (athleteRef) {
        try {
          const athleteData = await fetchJSON(athleteRef);

          if (athleteData && athleteData.id && athleteData.displayName) {
            const playerId = athleteData.id;
            const playerName = athleteData.displayName;

            if (!playersMap.has(playerId)) {
              playersMap.set(playerId, {
                id: playerId,
                name: playerName,
                slug: createPlayerSlug(playerName)
              });
              processed++;
            }
          }
        } catch (e) {
          // Skip if athlete fetch fails
        }
      }

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 50));
    }

    console.log(`  Processed ${processed} new players`);
  }

  console.log(`\n=== Total unique players: ${playersMap.size} ===`);

  // Filter to players missing images
  const playersToDownload = Array.from(playersMap.values()).filter(p => !existingImages.has(p.slug));

  console.log(`${playersToDownload.length} players missing images`);

  if (playersToDownload.length === 0) {
    console.log('All stat leaders have images!');
    return;
  }

  // Process downloads
  const BATCH_SIZE = 10;
  const DELAY_MS = 300;

  let downloaded = 0;
  let notFound = 0;
  let errors = 0;

  for (let i = 0; i < playersToDownload.length; i += BATCH_SIZE) {
    const batch = playersToDownload.slice(i, i + BATCH_SIZE);

    console.log(`\nDownloading batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(playersToDownload.length / BATCH_SIZE)}...`);

    for (const player of batch) {
      const filepath = path.join(PLAYER_IMAGES_DIR, `${player.slug}.png`);

      process.stdout.write(`  ${player.name}... `);

      try {
        // Download headshot using ESPN player ID directly
        const headshotUrl = getHeadshotURL(player.id);
        const success = await downloadImage(headshotUrl, filepath);

        if (success) {
          console.log(`downloaded (ID: ${player.id})`);
          downloaded++;
        } else {
          console.log('no headshot available');
          notFound++;
        }
      } catch (e) {
        console.log(`error: ${e.message}`);
        errors++;
      }
    }

    // Delay between batches
    if (i + BATCH_SIZE < playersToDownload.length) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Downloaded: ${downloaded}`);
  console.log(`Not found: ${notFound}`);
  console.log(`Errors: ${errors}`);
  console.log(`Total images now: ${existingImages.size + downloaded}`);
}

main().catch(console.error);
