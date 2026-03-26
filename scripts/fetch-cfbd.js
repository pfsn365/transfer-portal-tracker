#!/usr/bin/env node
/**
 * CFBD Bulk Fetcher - Downloads all available recruiting data from CollegeFootballData.com
 *
 * Fetches all available data for every year (2000-2026):
 *   - Recruiting: players, team rankings, position groups
 *   - Ratings: SP+, Elo, SRS, FPI, talent composite
 *   - Rankings: AP/Coaches polls
 *   - Reference: teams, conferences, venues, coaches
 *
 * Saves to /public/data/cfbd/ as cached data.
 *
 * Usage: node scripts/fetch-cfbd.js [--skip-existing]
 *
 * Note: Free tier = 1,000 requests/month. Full run uses ~195 requests.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load .env
var envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(function(line) {
    var match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  });
}

var API_KEY = process.env.CFBD_API_KEY;
if (!API_KEY) {
  console.error('ERROR: CFBD_API_KEY not found in .env');
  process.exit(1);
}

var OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data', 'cfbd');
var START_YEAR = 2000;
var END_YEAR = 2026;
var DELAY_MS = 500; // Be nice to the API
var SKIP_EXISTING = process.argv.includes('--skip-existing');

// Position mapping (same as api/cfbd/recruits.js)
var POS_MAP = {
  'PRO': 'QB', 'DUAL': 'QB', 'QB': 'QB',
  'RB': 'RB', 'APB': 'RB',
  'WR': 'WR', 'SLOT': 'WR',
  'TE': 'TE',
  'OT': 'OL', 'OG': 'OL', 'OC': 'OL', 'IOL': 'OL',
  'SDE': 'EDGE', 'WDE': 'EDGE', 'EDGE': 'EDGE', 'OLB': 'EDGE',
  'DT': 'DL', 'DL': 'DL', 'NT': 'DL',
  'ILB': 'LB', 'LB': 'LB', 'MLB': 'LB',
  'CB': 'CB',
  'S': 'S', 'FS': 'S', 'SS': 'S',
  'ATH': 'ATH', 'K': 'K', 'P': 'P', 'LS': 'LS', 'RET': 'ATH'
};

function mapPosition(pos) {
  if (!pos) return 'ATH';
  return POS_MAP[pos.toUpperCase()] || 'ATH';
}

function formatHeight(inches) {
  if (!inches) return '';
  if (typeof inches === 'string' && inches.includes('-')) return inches;
  var ft = Math.floor(inches / 12);
  var inn = inches % 12;
  return ft + '-' + inn;
}

function cfbdFetch(apiPath) {
  return new Promise(function(resolve, reject) {
    var options = {
      hostname: 'api.collegefootballdata.com',
      path: apiPath,
      headers: {
        'Authorization': 'Bearer ' + API_KEY,
        'Accept': 'application/json'
      }
    };
    https.get(options, function(resp) {
      if (resp.statusCode === 429) {
        return reject(new Error('Rate limited (429) - try again later'));
      }
      if (resp.statusCode !== 200) {
        return reject(new Error('HTTP ' + resp.statusCode));
      }
      var data = '';
      resp.on('data', function(chunk) { data += chunk; });
      resp.on('end', function() {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Invalid JSON: ' + data.substring(0, 200))); }
      });
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
}

function normalizeRecruits(data, year) {
  if (!Array.isArray(data)) return [];
  return data.map(function(r, i) {
    return {
      id: 'cfbd_' + (r.id || year + '_' + i),
      name: r.name || 'Unknown',
      position: mapPosition(r.position),
      positionRaw: r.position || null,
      stars: r.stars || 3,
      rating: r.rating || 0.85,
      ranking: r.ranking || i + 1,
      classYear: year,
      hometown: r.city || '',
      state: r.stateProvince || '',
      country: r.country || 'USA',
      height: r.height ? formatHeight(r.height) : '',
      weight: r.weight || 0,
      lat: r.hometownInfo ? r.hometownInfo.latitude : null,
      lng: r.hometownInfo ? r.hometownInfo.longitude : null,
      school: r.school || null,
      committedTo: r.committedTo || null,
      status: r.committedTo ? 'committed' : 'uncommitted',
      source: 'cfbd'
    };
  });
}

// Generic yearly fetcher - loops START_YEAR to END_YEAR for a given endpoint
async function fetchYearly(label, pathTemplate, filename, errors, stats) {
  for (var year = START_YEAR; year <= END_YEAR; year++) {
    var outFile = path.join(OUTPUT_DIR, filename.replace('{year}', year));
    if (SKIP_EXISTING && fs.existsSync(outFile)) {
      process.stdout.write(label + ' ' + year + '... SKIPPED (exists)\n');
      continue;
    }
    process.stdout.write(label + ' ' + year + '... ');
    try {
      var apiPath = pathTemplate.replace('{year}', year);
      var data = await cfbdFetch(apiPath);
      if (label === 'Recruits') {
        data = normalizeRecruits(data, year);
      }
      fs.writeFileSync(outFile, JSON.stringify(data, null, 2));
      var count = Array.isArray(data) ? data.length : 1;
      console.log(count + ' records');
      stats.requests++;
      stats.records += count;
    } catch (err) {
      console.log('FAILED - ' + err.message);
      errors.push(filename.replace('{year}', year) + ': ' + err.message);
      stats.requests++;
      if (err.message.includes('429')) {
        console.log('Rate limited, stopping this category...');
        return false;
      }
    }
    await sleep(DELAY_MS);
  }
  return true;
}

// Single-request fetcher for non-yearly endpoints
async function fetchOnce(label, apiPath, filename, errors, stats) {
  var outFile = path.join(OUTPUT_DIR, filename);
  if (SKIP_EXISTING && fs.existsSync(outFile)) {
    console.log(label + '... SKIPPED (exists)');
    return true;
  }
  process.stdout.write(label + '... ');
  try {
    var data = await cfbdFetch(apiPath);
    fs.writeFileSync(outFile, JSON.stringify(data, null, 2));
    var count = Array.isArray(data) ? data.length : 1;
    console.log(count + ' records');
    stats.requests++;
    stats.records += count;
  } catch (err) {
    console.log('FAILED - ' + err.message);
    errors.push(filename + ': ' + err.message);
    stats.requests++;
    if (err.message.includes('429')) return false;
  }
  await sleep(DELAY_MS);
  return true;
}

async function main() {
  console.log('========================================');
  console.log('  CFBD Bulk Fetcher (Full)');
  console.log('  Years: ' + START_YEAR + '-' + END_YEAR);
  if (SKIP_EXISTING) console.log('  Mode: Skip existing files');
  console.log('========================================\n');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  var errors = [];
  var stats = { requests: 0, records: 0 };

  // ── Reference data (one-time fetches) ──────────────────────
  console.log('── Reference Data ──');
  if (!(await fetchOnce('Teams', '/teams', 'teams.json', errors, stats))) return;
  if (!(await fetchOnce('FBS Teams', '/teams/fbs', 'teams-fbs.json', errors, stats))) return;
  if (!(await fetchOnce('Conferences', '/conferences', 'conferences.json', errors, stats))) return;
  if (!(await fetchOnce('Venues', '/venues', 'venues.json', errors, stats))) return;
  console.log('');

  // ── Coaches (single request, all history) ──────────────────
  console.log('── Coaches ──');
  if (!(await fetchOnce('Coaches', '/coaches', 'coaches.json', errors, stats))) return;
  console.log('');

  // ── Recruiting (yearly) ────────────────────────────────────
  console.log('── Recruiting: Players ──');
  if (!(await fetchYearly('Recruits', '/recruiting/players?year={year}', 'recruits-{year}.json', errors, stats))) return;
  console.log('');

  console.log('── Recruiting: Team Rankings ──');
  if (!(await fetchYearly('Team rankings', '/recruiting/teams?year={year}', 'team-rankings-{year}.json', errors, stats))) return;
  console.log('');

  console.log('── Recruiting: Position Groups ──');
  if (!(await fetchYearly('Position groups', '/recruiting/groups?startYear={year}&endYear={year}', 'recruiting-groups-{year}.json', errors, stats))) return;
  console.log('');

  // ── Talent Composite (yearly) ──────────────────────────────
  console.log('── Talent Composite ──');
  if (!(await fetchYearly('Talent', '/talent?year={year}', 'talent-{year}.json', errors, stats))) return;
  console.log('');

  // ── Ratings (yearly) ──────────────────────────────────────
  console.log('── SP+ Ratings ──');
  if (!(await fetchYearly('SP+', '/ratings/sp?year={year}', 'ratings-sp-{year}.json', errors, stats))) return;
  console.log('');

  console.log('── Elo Ratings ──');
  if (!(await fetchYearly('Elo', '/ratings/elo?year={year}', 'ratings-elo-{year}.json', errors, stats))) return;
  console.log('');

  console.log('── SRS Ratings ──');
  if (!(await fetchYearly('SRS', '/ratings/srs?year={year}', 'ratings-srs-{year}.json', errors, stats))) return;
  console.log('');

  console.log('── FPI Ratings ──');
  if (!(await fetchYearly('FPI', '/ratings/fpi?year={year}', 'ratings-fpi-{year}.json', errors, stats))) return;
  console.log('');

  // ── Rankings / Polls (yearly) ──────────────────────────────
  console.log('── AP/Coaches Poll Rankings ──');
  if (!(await fetchYearly('Rankings', '/rankings?year={year}', 'rankings-{year}.json', errors, stats))) return;
  console.log('');

  // ── Summary ────────────────────────────────────────────────
  console.log('========================================');
  console.log('  Summary');
  console.log('========================================');
  console.log('  Total API requests: ' + stats.requests);
  console.log('  Total records fetched: ' + stats.records);
  if (errors.length > 0) {
    console.log('  Errors: ' + errors.length);
    errors.forEach(function(e) { console.log('    - ' + e); });
  }

  // File sizes
  console.log('\nOutput files:');
  try {
    var files = fs.readdirSync(OUTPUT_DIR).filter(function(f) { return f.endsWith('.json'); }).sort();
    var totalSize = 0;
    files.forEach(function(f) {
      var fstats = fs.statSync(path.join(OUTPUT_DIR, f));
      totalSize += fstats.size;
      var size = fstats.size > 1048576 ? (fstats.size / 1048576).toFixed(1) + 'MB' : (fstats.size / 1024).toFixed(0) + 'KB';
      console.log('  ' + f + ' (' + size + ')');
    });
    var totalMB = (totalSize / 1048576).toFixed(1);
    console.log('\n  Total: ' + files.length + ' files, ' + totalMB + 'MB');
  } catch(e) {}

  console.log('\nDone! Data saved to: ' + OUTPUT_DIR);
}

main().catch(function(err) {
  console.error('Fatal error:', err);
  process.exit(1);
});
