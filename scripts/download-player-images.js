#!/usr/bin/env node

/**
 * Script to download missing player images from ESPN
 * Run with: node scripts/download-player-images.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const PLAYER_IMAGES_DIR = path.join(__dirname, '../public/player-images');
const TRANSFER_PORTAL_API = 'https://transfer-portal-tracker.vercel.app/cfb-hq/api/transfer-portal';

// Create slug from player name (same as in PlayerTable.tsx)
function createPlayerSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Fetch JSON from URL
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
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

// Search ESPN for player and get their ID
async function searchESPNPlayer(playerName, teamName) {
  try {
    const query = encodeURIComponent(playerName);
    const url = `https://site.web.api.espn.com/apis/common/v3/search?query=${query}&limit=10&type=player`;
    const data = await fetchJSON(url);

    if (!data.items || data.items.length === 0) {
      return null;
    }

    // Find college football player (prefer exact name match)
    const cfbPlayers = data.items.filter(p => p.league === 'college-football');

    if (cfbPlayers.length === 0) {
      return null;
    }

    // Try to find exact match first
    const exactMatch = cfbPlayers.find(p =>
      p.displayName.toLowerCase() === playerName.toLowerCase()
    );

    if (exactMatch) {
      return exactMatch.id;
    }

    // Otherwise return first CFB result
    return cfbPlayers[0].id;
  } catch (e) {
    return null;
  }
}

// Get headshot URL from ESPN player ID
function getHeadshotURL(playerId) {
  return `https://a.espncdn.com/i/headshots/college-football/players/full/${playerId}.png`;
}

// Main function
async function main() {
  console.log('Fetching transfer portal data...');

  // Get all players from transfer portal
  let players;
  try {
    const data = await fetchJSON(TRANSFER_PORTAL_API);
    players = data.players || [];
  } catch (e) {
    console.error('Failed to fetch transfer portal data:', e.message);
    process.exit(1);
  }

  console.log(`Found ${players.length} players in transfer portal`);

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

  // Find players missing images
  const missingPlayers = players.filter(p => {
    const slug = createPlayerSlug(p.name);
    return !existingImages.has(slug);
  });

  console.log(`${missingPlayers.length} players missing images`);

  if (missingPlayers.length === 0) {
    console.log('All players have images!');
    return;
  }

  // Process in batches to avoid rate limiting
  const BATCH_SIZE = 10;
  const DELAY_MS = 500;

  let downloaded = 0;
  let notFound = 0;
  let errors = 0;

  for (let i = 0; i < missingPlayers.length; i += BATCH_SIZE) {
    const batch = missingPlayers.slice(i, i + BATCH_SIZE);

    console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(missingPlayers.length / BATCH_SIZE)}...`);

    for (const player of batch) {
      const slug = createPlayerSlug(player.name);
      const filepath = path.join(PLAYER_IMAGES_DIR, `${slug}.png`);

      process.stdout.write(`  ${player.name}... `);

      try {
        // Search for player on ESPN
        const espnId = await searchESPNPlayer(player.name, player.formerSchool);

        if (!espnId) {
          console.log('not found on ESPN');
          notFound++;
          continue;
        }

        // Download headshot
        const headshotUrl = getHeadshotURL(espnId);
        const success = await downloadImage(headshotUrl, filepath);

        if (success) {
          console.log(`downloaded (ID: ${espnId})`);
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
    if (i + BATCH_SIZE < missingPlayers.length) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Downloaded: ${downloaded}`);
  console.log(`Not found: ${notFound}`);
  console.log(`Errors: ${errors}`);
}

main().catch(console.error);
