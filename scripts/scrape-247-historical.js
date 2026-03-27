#!/usr/bin/env node
/**
 * Scrape 247Sports recruiting data for historical years.
 * Runs inline (not via child process) for reliability.
 *
 * Usage: node scripts/scrape-247-historical.js [startYear] [endYear]
 * Default: 2000 to 2025
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const START_YEAR = parseInt(process.argv[2]) || 2000;
const END_YEAR = parseInt(process.argv[3]) || 2025;
const ITEMS_PER_PAGE = 300;
const MAX_PAGES = 5;
const DELAY_BETWEEN_PAGES_MS = 2000; // 2 seconds between pages
const DELAY_BETWEEN_YEARS_MS = 5000; // 5 seconds between years
const SCRAPED_DIR = path.join(__dirname, '../public/data/scraped');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchJSON(url, headers) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers, timeout: 60000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Parse error: ' + data.slice(0, 100)));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
  });
}

function mapRecruit(r, year) {
  return {
    id: r.Key || r.PlayerId || 0,
    name: r.Player?.FullName || (r.Player?.FirstName + ' ' + r.Player?.LastName) || '',
    firstName: r.Player?.FirstName || '',
    lastName: r.Player?.LastName || '',
    position: r.Player?.Position?.Abbreviation || r.Position || '',
    city: r.Player?.Hometown?.City || '',
    state: r.Player?.Hometown?.State || '',
    height: r.Player?.Height || '',
    weight: r.Player?.Weight || 0,
    highSchool: r.Player?.PlayerHighSchool?.Name || r.Player?.HighSchool || '',
    classYear: r.Year || year,
    stars: r.Stars || r.Rating?.Stars || 0,
    rating: r.CompositeRating || r.Rating?.CompositeRating || 0,
    rating247Raw: r.Rating?.Rating247 || r.Stars ? (80 + (r.Stars * 4)) : 0,
    nationalRank: r.Ranking?.NationalRank || r.NationalRank || 0,
    positionRank: r.Ranking?.PositionRank || r.PositionRank || 0,
    stateRank: r.Ranking?.StateRank || r.StateRank || 0,
    imageUrl: r.Player?.PlayerImage?.ImageUrl || '',
    profileUrl: r.Player?.Url ? 'https://247sports.com' + r.Player.Url : '',
    committedSchoolLogo: r.CommittedSchool?.ImageUrl || '',
    committedInstitutionId: r.CommittedInstitution?.Key || null,
    signedInstitutionId: r.SignedInstitution?.Key || null,
    status: r.Status || '',
    commitStatus: r.CommittedInstitution ? 'committed' : 'uncommitted',
    source: '247sports',
  };
}

async function scrapeYear(year) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'X-Requested-With': 'XMLHttpRequest',
    'Referer': `https://247sports.com/season/${year}-football/recruits/`,
  };

  const allRecruits = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `https://247sports.com/Season/${year}-Football/Recruits.json?Items=${ITEMS_PER_PAGE}&Page=${page}`;

    try {
      const data = await fetchJSON(url, headers);

      if (!Array.isArray(data) || data.length === 0) {
        break;
      }

      const recruits = data.map(r => mapRecruit(r, year));
      allRecruits.push(...recruits);

      process.stdout.write(`  Page ${page}: ${data.length} recruits\n`);

      if (data.length < ITEMS_PER_PAGE) break; // Last page

      if (page < MAX_PAGES) {
        await sleep(DELAY_BETWEEN_PAGES_MS);
      }
    } catch (err) {
      console.log(`  Page ${page}: Error - ${err.message}`);
      break;
    }
  }

  return allRecruits;
}

async function main() {
  console.log(`Scraping 247Sports: ${START_YEAR} to ${END_YEAR}`);
  console.log(`${DELAY_BETWEEN_PAGES_MS/1000}s between pages, ${DELAY_BETWEEN_YEARS_MS/1000}s between years\n`);

  if (!fs.existsSync(SCRAPED_DIR)) {
    fs.mkdirSync(SCRAPED_DIR, { recursive: true });
  }

  let completed = 0, skipped = 0, failed = 0;

  for (let year = END_YEAR; year >= START_YEAR; year--) {
    const outputFile = path.join(SCRAPED_DIR, `247-recruits-${year}.json`);

    if (fs.existsSync(outputFile)) {
      const stats = fs.statSync(outputFile);
      if (stats.size > 1000) {
        console.log(`[${year}] Already exists (${(stats.size / 1024).toFixed(0)}KB) - skipping`);
        skipped++;
        continue;
      }
    }

    console.log(`[${year}] Scraping...`);

    try {
      const recruits = await scrapeYear(year);

      if (recruits.length > 0) {
        const output = {
          recruits,
          metadata: { year, source: '247sports', scrapedAt: new Date().toISOString(), totalRecruits: recruits.length },
        };
        fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
        console.log(`[${year}] ✓ ${recruits.length} recruits saved`);
        completed++;
      } else {
        console.log(`[${year}] ✗ No recruits found`);
        failed++;
      }
    } catch (err) {
      console.log(`[${year}] ✗ Error: ${err.message}`);
      failed++;
    }

    if (year > START_YEAR) {
      await sleep(DELAY_BETWEEN_YEARS_MS);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Completed: ${completed}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
}

main().catch(console.error);
