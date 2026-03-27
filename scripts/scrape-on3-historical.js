#!/usr/bin/env node
/**
 * Run On3 recruit scraper for historical years.
 * Usage: node scripts/scrape-on3-historical.js [startYear] [endYear] [pagesPerYear]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const START_YEAR = parseInt(process.argv[2]) || 2010;
const END_YEAR = parseInt(process.argv[3]) || 2025;
const PAGES = parseInt(process.argv[4]) || 6; // 6 pages * ~50 = ~300 recruits
const DELAY_MS = 15000; // 15 seconds between years (On3 is heavier)
const SCRAPED_DIR = path.join(__dirname, '../public/data/scraped');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log(`Scraping On3 recruits: ${START_YEAR} to ${END_YEAR} (${PAGES} pages each)`);
  console.log(`${DELAY_MS/1000}s between years\n`);

  let completed = 0, skipped = 0, failed = 0;

  for (let year = END_YEAR; year >= START_YEAR; year--) {
    const outputFile = path.join(SCRAPED_DIR, `on3-recruits-${year}.json`);

    if (fs.existsSync(outputFile) && fs.statSync(outputFile).size > 1000) {
      console.log(`[${year}] Already exists - skipping`);
      skipped++;
      continue;
    }

    console.log(`[${year}] Scraping...`);
    try {
      const output = execSync(`node scripts/scrape-on3.js ${year} ${PAGES}`, {
        cwd: path.join(__dirname, '..'),
        timeout: 180000, // 3 min timeout
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      if (fs.existsSync(outputFile) && fs.statSync(outputFile).size > 1000) {
        const data = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
        const count = (data.recruits || data).length;
        console.log(`[${year}] ✓ ${count} recruits`);
        completed++;
      } else {
        console.log(`[${year}] ✗ No output`);
        failed++;
      }
    } catch (err) {
      console.log(`[${year}] ✗ Error: ${err.message?.slice(0, 80)}`);
      failed++;
    }

    if (year > START_YEAR) await sleep(DELAY_MS);
  }

  console.log(`\n=== Summary ===`);
  console.log(`Completed: ${completed} | Skipped: ${skipped} | Failed: ${failed}`);
}

main().catch(console.error);
