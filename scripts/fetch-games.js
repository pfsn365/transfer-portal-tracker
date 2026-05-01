#!/usr/bin/env node
/**
 * CFBD Game History Fetcher - Downloads all games year by year for H2H tool
 *
 * Fetches /games?year={year}&seasonType=both for each year from START_YEAR to current.
 * Saves minimal game fields to /public/data/cfbd/games-{year}.json
 *
 * Usage:
 *   node scripts/fetch-games.js                   # fetch all years
 *   node scripts/fetch-games.js --skip-existing   # skip already-downloaded years
 *   node scripts/fetch-games.js --start=1950      # override start year
 *
 * Request count: ~126 (1900–2025). Well within the 1,000/month free tier.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load .env / .env.local
['.env', '.env.local'].forEach(function (name) {
  var envPath = path.join(__dirname, '..', name);
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(function (line) {
      var match = line.match(/^([^#=]+)=(.*)$/);
      if (match) process.env[match[1].trim()] = match[2].trim();
    });
  }
});

var API_KEY = process.env.CFBD_API_KEY;
if (!API_KEY) {
  console.error('ERROR: CFBD_API_KEY not found in .env or .env.local');
  process.exit(1);
}

var OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data', 'cfbd');
var SKIP_EXISTING = process.argv.includes('--skip-existing');
var DELAY_MS = 700;

var startArg = process.argv.find(function (a) { return a.startsWith('--start='); });
var START_YEAR = startArg ? parseInt(startArg.split('=')[1]) : 1950;
var END_YEAR = new Date().getFullYear();

function cfbdFetch(apiPath) {
  return new Promise(function (resolve, reject) {
    var options = {
      hostname: 'api.collegefootballdata.com',
      path: apiPath,
      headers: {
        Authorization: 'Bearer ' + API_KEY,
        Accept: 'application/json',
      },
    };
    https.get(options, function (resp) {
      if (resp.statusCode === 429) return reject(new Error('Rate limited (429)'));
      if (resp.statusCode !== 200) return reject(new Error('HTTP ' + resp.statusCode));
      var data = '';
      resp.on('data', function (c) { data += c; });
      resp.on('end', function () {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Invalid JSON: ' + data.substring(0, 200))); }
      });
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(function (r) { setTimeout(r, ms); });
}

// Only keep fields needed by the H2H route
// CFBD API v2 uses camelCase; we normalise to snake_case for the route layer
function slim(games) {
  if (!Array.isArray(games)) return [];
  return games
    .filter(function (g) { return g.homeTeam && g.awayTeam; })
    .map(function (g) {
      return {
        season:       g.season,
        week:         g.week,
        season_type:  g.seasonType   || g.season_type   || 'regular',
        neutral_site: g.neutralSite  ?? g.neutral_site  ?? false,
        venue:        g.venue        || null,
        notes:        g.notes        || null,
        home_team:    g.homeTeam     || g.home_team,
        home_points:  g.homePoints   != null ? g.homePoints   : (g.home_points  != null ? g.home_points  : null),
        away_team:    g.awayTeam     || g.away_team,
        away_points:  g.awayPoints   != null ? g.awayPoints   : (g.away_points  != null ? g.away_points  : null),
      };
    });
}

async function main() {
  console.log('========================================');
  console.log('  CFBD Game History Fetcher');
  console.log('  Years: ' + START_YEAR + '–' + END_YEAR);
  if (SKIP_EXISTING) console.log('  Mode: Skip existing files');
  console.log('========================================\n');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  var errors = [];
  var stats = { requests: 0, games: 0, skipped: 0 };

  for (var year = END_YEAR; year >= START_YEAR; year--) {
    var outFile = path.join(OUTPUT_DIR, 'games-' + year + '.json');

    if (SKIP_EXISTING && fs.existsSync(outFile)) {
      process.stdout.write(year + '... SKIPPED\n');
      stats.skipped++;
      continue;
    }

    process.stdout.write(year + '... ');

    try {
      var data = await cfbdFetch('/games?year=' + year + '&seasonType=both');
      var slimmed = slim(data);
      fs.writeFileSync(outFile, JSON.stringify(slimmed));
      console.log(slimmed.length + ' games');
      stats.requests++;
      stats.games += slimmed.length;
    } catch (err) {
      console.log('FAILED – ' + err.message);
      errors.push(year + ': ' + err.message);
      stats.requests++;
      if (err.message.includes('429')) {
        console.log('\nRate limited. Re-run with --skip-existing to resume.');
        break;
      }
    }

    await sleep(DELAY_MS);
  }

  console.log('\n========================================');
  console.log('  Done');
  console.log('  Requests: ' + stats.requests + '  |  Skipped: ' + stats.skipped);
  console.log('  Total games: ' + stats.games.toLocaleString());
  if (errors.length) {
    console.log('  Errors (' + errors.length + '):');
    errors.forEach(function (e) { console.log('    - ' + e); });
  }

  // Show total disk usage
  try {
    var files = fs.readdirSync(OUTPUT_DIR).filter(function (f) { return f.startsWith('games-'); });
    var totalBytes = files.reduce(function (acc, f) {
      return acc + fs.statSync(path.join(OUTPUT_DIR, f)).size;
    }, 0);
    console.log('  Disk: ' + files.length + ' files, ' + (totalBytes / 1048576).toFixed(1) + ' MB');
  } catch (_) {}

  console.log('========================================');
}

main().catch(function (err) {
  console.error('Fatal:', err);
  process.exit(1);
});
