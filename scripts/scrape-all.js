#!/usr/bin/env node
/**
 * Master Scraper - Runs all recruiting data scrapers
 *
 * Usage: node scripts/scrape-all.js [year]
 * Example: node scripts/scrape-all.js 2026
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const YEAR = process.argv[2] || '2026';
const SCRIPTS_DIR = __dirname;
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data', 'scraped');

var scrapers = [
  { name: '247Sports', script: 'scrape-247.js', args: [YEAR, '5'] },
  { name: 'On3', script: 'scrape-on3.js', args: [YEAR, '10'] },
  { name: 'Rivals (On3)', script: 'scrape-rivals.js', args: [YEAR, '10'] },
  { name: 'ESPN', script: 'scrape-espn.js', args: [YEAR] }
];

console.log('========================================');
console.log('  CFB Recruiting Sim - Master Scraper');
console.log('  Year: ' + YEAR);
console.log('========================================\n');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

var results = [];

scrapers.forEach(function(s) {
  console.log('\n' + '='.repeat(50));
  console.log('Running: ' + s.name);
  console.log('='.repeat(50) + '\n');

  var cmd = 'node "' + path.join(SCRIPTS_DIR, s.script) + '" ' + s.args.join(' ');
  var startTime = Date.now();

  try {
    execSync(cmd, { stdio: 'inherit', timeout: 300000 }); // 5 min timeout per scraper
    var elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    results.push({ name: s.name, status: 'OK', time: elapsed + 's' });
  } catch(e) {
    var elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    results.push({ name: s.name, status: 'FAILED', time: elapsed + 's', error: e.message.split('\n')[0] });
  }
});

console.log('\n\n========================================');
console.log('  Summary');
console.log('========================================');
results.forEach(function(r) {
  var icon = r.status === 'OK' ? '[OK]' : '[FAIL]';
  console.log('  ' + icon + ' ' + r.name + ' (' + r.time + ')' + (r.error ? ' - ' + r.error : ''));
});

// List output files
console.log('\nOutput files:');
try {
  var files = fs.readdirSync(OUTPUT_DIR).filter(function(f) { return f.endsWith('.json'); });
  files.forEach(function(f) {
    var stats = fs.statSync(path.join(OUTPUT_DIR, f));
    var size = stats.size > 1048576 ? (stats.size / 1048576).toFixed(1) + 'MB' : (stats.size / 1024).toFixed(0) + 'KB';
    console.log('  ' + f + ' (' + size + ')');
  });
} catch(e) {}

console.log('\nDone!');
