#!/usr/bin/env node
/**
 * CFBD Portal Ratings Fetcher
 *
 * Fetches transfer portal entries for a given year from CFBD API.
 * Saves star ratings + composite ratings to public/data/cfbd/portal-{year}.json
 *
 * Used by the transfer portal API route to augment PFSN player data with
 * 247Sports star ratings (since PFSN ImpactGrade has sparse coverage).
 *
 * Usage:
 *   node scripts/fetch-portal-ratings.js           # current year
 *   node scripts/fetch-portal-ratings.js --year=2026
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

var yearArg = process.argv.find(function (a) { return a.startsWith('--year='); });
var YEAR = yearArg ? parseInt(yearArg.split('=')[1]) : new Date().getFullYear();

var OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data', 'cfbd');
var OUT_FILE = path.join(OUTPUT_DIR, 'portal-' + YEAR + '.json');

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

async function main() {
  console.log('========================================');
  console.log('  CFBD Portal Ratings Fetcher');
  console.log('  Year: ' + YEAR);
  console.log('========================================\n');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  process.stdout.write('Fetching portal entries for ' + YEAR + '... ');

  var raw;
  try {
    raw = await cfbdFetch('/portal?year=' + YEAR);
  } catch (err) {
    console.log('FAILED – ' + err.message);
    process.exit(1);
  }

  if (!Array.isArray(raw)) {
    console.log('FAILED – unexpected response format');
    process.exit(1);
  }

  // Keep only fields needed for the rating augmentation
  var slim = raw
    .filter(function (p) { return p.firstName && p.lastName; })
    .map(function (p) {
      return {
        firstName:   (p.firstName || '').trim(),
        lastName:    (p.lastName  || '').trim(),
        position:    p.position   || null,
        origin:      p.origin     || p.originSchool || null,
        destination: p.destination || p.destinationSchool || null,
        stars:       (p.stars   != null && p.stars   > 0) ? p.stars   : null,
        rating:      (p.rating  != null && p.rating  > 0) ? p.rating  : null,
      };
    })
    .filter(function (p) { return p.stars !== null || p.rating !== null; });

  fs.writeFileSync(OUT_FILE, JSON.stringify(slim));

  var rated  = slim.filter(function (p) { return p.stars; }).length;
  var total  = raw.length;
  console.log(total + ' entries, ' + slim.length + ' with ratings (' + rated + ' starred)');
  console.log('Saved → ' + OUT_FILE);
  console.log('\n========================================');
  console.log('  Done');
  console.log('========================================');
}

main().catch(function (err) {
  console.error('Fatal:', err);
  process.exit(1);
});
