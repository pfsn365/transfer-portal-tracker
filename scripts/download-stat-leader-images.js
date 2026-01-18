const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'player-images');

// Create slug from name
function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Check if image already exists
function imageExists(slug) {
  return fs.existsSync(path.join(IMAGES_DIR, `${slug}.png`));
}

// Download image
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);

    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect
        downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        fs.unlinkSync(filepath);
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(true);
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

// Fetch JSON from URL
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CFB-HQ/1.0)'
      }
    };

    protocol.get(url, options, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching stat leaders from ESPN...');

  // Fetch leaders - use 2025 season (current 2025-26 season)
  const leadersUrl = 'https://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/2025/types/2/leaders?limit=100';
  const leadersData = await fetchJson(leadersUrl);

  // Collect all unique athlete refs
  const athleteRefs = new Set();

  for (const category of leadersData.categories || []) {
    for (const leader of category.leaders || []) {
      if (leader.athlete?.$ref) {
        athleteRefs.add(leader.athlete.$ref);
      }
    }
  }

  console.log(`Found ${athleteRefs.size} unique athletes across all categories`);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const ref of athleteRefs) {
    try {
      const athlete = await fetchJson(ref);
      const name = athlete.displayName || athlete.fullName;

      if (!name) continue;

      const slug = createSlug(name);

      if (imageExists(slug)) {
        skipped++;
        continue;
      }

      // Try to get headshot
      const headshotUrl = athlete.headshot?.href;

      if (headshotUrl) {
        const filepath = path.join(IMAGES_DIR, `${slug}.png`);
        try {
          await downloadImage(headshotUrl, filepath);
          console.log(`Downloaded: ${name} -> ${slug}.png`);
          downloaded++;
        } catch (err) {
          console.log(`Failed to download ${name}: ${err.message}`);
          failed++;
        }
      } else {
        console.log(`No headshot for: ${name}`);
        failed++;
      }

      // Small delay to be nice to the API
      await new Promise(r => setTimeout(r, 100));

    } catch (err) {
      failed++;
    }
  }

  console.log(`\nComplete!`);
  console.log(`Downloaded: ${downloaded}`);
  console.log(`Already had: ${skipped}`);
  console.log(`Failed/No image: ${failed}`);
}

main().catch(console.error);
