#!/usr/bin/env node
/**
 * On3 Industry Comparison Scraper
 * Uses Puppeteer to scrape the On3 industry comparison page (client-rendered).
 * Falls back to On3's __NEXT_DATA__ endpoint if Puppeteer fails.
 *
 * Usage: node scripts/scrape-on3.js [year] [maxPages]
 * Example: node scripts/scrape-on3.js 2026 6
 */

const puppeteer = require('puppeteer');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const YEAR = parseInt(process.argv[2]) || 2026;
const MAX_PAGES = parseInt(process.argv[3]) || 6; // 50 per page
const BASE_URL = 'https://www.on3.com/db/rankings/industry-comparison/football/' + YEAR + '/';
const FALLBACK_URL = 'https://www.on3.com/rivals/rankings/industry-player/football/' + YEAR + '/';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data', 'scraped');

/**
 * Scrape with Puppeteer (headless browser)
 */
async function scrapeWithPuppeteer(totalPages) {
  console.log('Launching Puppeteer...');
  var browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  var allRecruits = [];

  try {
    var page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    for (var pageNum = 1; pageNum <= totalPages; pageNum++) {
      var url = BASE_URL + '?page=' + pageNum;
      console.log('Fetching page ' + pageNum + '/' + totalPages + '...');

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait for the ranking list to render
      await page.waitForSelector('ul.RankingsList_rankingsList__Z2wMw, ul[class*="rankingsList"], .ranking-list, table, ul li', { timeout: 10000 }).catch(function() {
        console.log('  Warning: Could not find ranking list selector, trying anyway...');
      });

      // Extract recruit data from the rendered DOM
      var recruits = await page.evaluate(function(year) {
        var results = [];

        // Find all player list items
        var items = document.querySelectorAll('li[class*="RankingItem"], li[class*="rankingItem"], .ranking-item');
        if (items.length === 0) {
          // Try broader selectors
          items = document.querySelectorAll('ul li');
        }

        items.forEach(function(item) {
          var text = item.textContent || '';
          // Skip navigation/non-player items
          if (text.length < 20 || text.length > 2000) return;

          // Try to extract structured data
          var nameEl = item.querySelector('a[href*="/db/"] span, a[class*="name"], h3, .player-name');
          var posEl = item.querySelector('[class*="position"], .pos');
          var stateEl = item.querySelector('[class*="state"], .hometown');

          if (!nameEl) return;

          var name = nameEl.textContent.trim();
          if (!name || name.length < 3) return;

          // Extract ratings - look for rating number elements
          var ratingEls = item.querySelectorAll('[class*="rating"], [class*="Rating"], td');
          var ratings = {};
          var ratingLabels = ['composite', 'on3', '247', 'espn', 'rivals'];

          // Find numeric ratings
          var ratingValues = [];
          ratingEls.forEach(function(el) {
            var val = parseFloat(el.textContent);
            if (val >= 50 && val <= 110) {
              ratingValues.push(val);
            }
          });

          // Map rating values to services (typically displayed in order: On3, 247, ESPN, Rivals)
          if (ratingValues.length >= 4) {
            ratings.on3 = { rating: ratingValues[0] };
            ratings['247'] = { rating: ratingValues[1] };
            ratings.espn = { rating: ratingValues[2] };
            ratings.rivals = { rating: ratingValues[3] };
          }

          // Extract position
          var position = posEl ? posEl.textContent.trim() : null;

          // Extract location
          var location = stateEl ? stateEl.textContent.trim() : null;
          var city = null, state = null;
          if (location) {
            var parts = location.split(',').map(function(s) { return s.trim(); });
            city = parts[0] || null;
            state = parts[1] || null;
          }

          // Extract height/weight
          var htWtMatch = text.match(/(\d-\d+(?:\.\d+)?)\s*\/?\s*(\d{2,3})\s*lbs?/i) || text.match(/(\d-\d+(?:\.\d+)?)\s+(\d{2,3})/);
          var height = htWtMatch ? htWtMatch[1] : null;
          var weight = htWtMatch ? parseInt(htWtMatch[2]) : null;

          // Extract NIL value
          var nilMatch = text.match(/\$[\d,.]+[KMB]?/);
          var nilValue = null;
          if (nilMatch) {
            var nilStr = nilMatch[0].replace(/[$,]/g, '');
            if (nilStr.endsWith('M')) nilValue = parseFloat(nilStr) * 1000000;
            else if (nilStr.endsWith('K')) nilValue = parseFloat(nilStr) * 1000;
            else nilValue = parseFloat(nilStr);
          }

          // Extract stars
          var starsMatch = text.match(/(\d)\s*(?:star|★)/i);
          var stars = starsMatch ? parseInt(starsMatch[1]) : null;

          // Extract rank
          var rankMatch = item.querySelector('[class*="rank"], .rank-number');
          var rank = rankMatch ? parseInt(rankMatch.textContent) : null;

          // Extract link/slug
          var linkEl = item.querySelector('a[href*="/db/"]');
          var slug = linkEl ? linkEl.getAttribute('href').split('/').filter(Boolean).pop() : null;

          results.push({
            name: name,
            position: position,
            city: city,
            state: state,
            height: height,
            weight: weight,
            classYear: year,
            overallRank: rank,
            ratings: ratings,
            nilValue: nilValue,
            stars: stars,
            slug: slug,
            source: 'on3-industry'
          });
        });

        return results;
      }, YEAR);

      console.log('  Found ' + recruits.length + ' recruits');
      allRecruits = allRecruits.concat(recruits);

      if (recruits.length === 0 && pageNum === 1) {
        console.log('  No recruits found on first page, Puppeteer parsing may need updating');
        break;
      }

      // Rate limit
      if (pageNum < totalPages) {
        await new Promise(function(r) { setTimeout(r, 2000); });
      }
    }
  } finally {
    await browser.close();
  }

  return allRecruits;
}

/**
 * Fallback: fetch from On3 Rivals endpoint with __NEXT_DATA__
 */
function fetchPage(url) {
  return new Promise(function(resolve, reject) {
    var mod = url.startsWith('https') ? https : http;
    mod.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html'
      }
    }, function(res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchPage(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      var chunks = [];
      res.on('data', function(c) { chunks.push(c); });
      res.on('end', function() { resolve(Buffer.concat(chunks).toString('utf-8')); });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function scrapeWithFallback(totalPages) {
  console.log('Using __NEXT_DATA__ fallback (On3 Rivals endpoint)...');
  var allRecruits = [];

  for (var pageNum = 1; pageNum <= totalPages; pageNum++) {
    var url = FALLBACK_URL + '?page=' + pageNum;
    console.log('Fetching page ' + pageNum + '/' + totalPages + '...');

    try {
      var html = await fetchPage(url);
      var match = html.match(/<script\s+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if (!match) { console.log('  No __NEXT_DATA__'); break; }

      var nextData = JSON.parse(match[1]);
      var playerData = nextData.props && nextData.props.pageProps && nextData.props.pageProps.playerData;
      if (!playerData || !playerData.list) { console.log('  No playerData.list'); break; }

      if (pageNum === 1 && playerData.pagination) {
        var pag = playerData.pagination;
        totalPages = Math.min(pag.pageCount, totalPages);
        console.log('  Total: ' + pag.count + ' recruits (' + pag.pageCount + ' pages), scraping ' + totalPages);
      }

      var recruits = playerData.list.map(function(p) {
        var person = p.person || {};
        var ratings = {};
        (p.ratings || []).forEach(function(r) {
          var type = (r.type || '').toLowerCase();
          var entry = { rating: r.rating, stars: r.stars, rank: r.overallRank, positionRank: r.positionRank, stateRank: r.stateRank };
          if (type === 'industry' || type === 'consensus') ratings.composite = entry;
          else if (type === 'on3') ratings.on3 = entry;
          else if (type === '247') ratings['247'] = entry;
          else if (type === 'espn') ratings.espn = entry;
          else if (type === 'rivals') ratings.rivals = entry;
        });

        var status = person.status || {};
        var commitment = null;
        if (status.isCommitted || status.isSigned || status.isEnrolled || status.committedOrganizationSlug) {
          commitment = {
            school: status.committedOrganizationSlug || null,
            schoolName: status.committedOrganizationName || null,
            signed: !!status.isSigned,
            enrolled: !!status.isEnrolled,
            date: status.commitmentDate || null
          };
        }

        // Headshot image
        var imageUrl = null;
        if (person.defaultAsset && person.defaultAsset.source) {
          var domain = person.defaultAsset.domain || 'on3static.com';
          imageUrl = 'https://' + domain + person.defaultAsset.source;
        } else if (person.defaultAssetUrl) {
          imageUrl = person.defaultAssetUrl;
        }

        return {
          name: person.name || 'Unknown',
          slug: person.slug || null,
          position: p.positionAbbreviation || null,
          city: person.homeTownName || null,
          state: p.stateAbbreviation || null,
          height: person.formattedHeight || null,
          weight: person.weight || null,
          age: person.age || null,
          classYear: person.classYear || YEAR,
          highSchool: (person.highSchool && person.highSchool.name) || null,
          overallRank: p.overallRank || null,
          positionRank: p.positionRank || null,
          stateRank: p.stateRank || null,
          ratings: ratings,
          nilValue: p.nilValue || null,
          commitment: commitment,
          fiveStarPlus: p.fiveStarPlus || false,
          imageUrl: imageUrl,
          source: 'on3'
        };
      });

      console.log('  Parsed ' + recruits.length + ' recruits');
      allRecruits = allRecruits.concat(recruits);

      if (recruits.length === 0) break;
      if (pageNum < totalPages) await new Promise(function(r) { setTimeout(r, 1500); });
    } catch(e) {
      console.error('  ERROR:', e.message);
      if (pageNum === 1) break;
    }
  }

  return allRecruits;
}

async function scrape() {
  console.log('=== On3 Industry Comparison Scraper ===');
  console.log('Year:', YEAR, '| Max pages:', MAX_PAGES);
  console.log('');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  var allRecruits = [];

  // Try Puppeteer first for industry comparison page
  try {
    allRecruits = await scrapeWithPuppeteer(MAX_PAGES);
  } catch(e) {
    console.log('\nPuppeteer failed: ' + e.message);
  }

  // If Puppeteer got nothing, use __NEXT_DATA__ fallback
  if (allRecruits.length === 0) {
    console.log('\nFalling back to __NEXT_DATA__ method...');
    allRecruits = await scrapeWithFallback(MAX_PAGES);
  }

  console.log('\n=== Results ===');
  console.log('Total recruits scraped:', allRecruits.length);

  if (allRecruits.length > 0) {
    var outFile = path.join(OUTPUT_DIR, 'on3-recruits-' + YEAR + '.json');
    fs.writeFileSync(outFile, JSON.stringify({
      source: 'on3',
      type: 'industry-comparison',
      year: YEAR,
      scrapedAt: new Date().toISOString(),
      count: allRecruits.length,
      recruits: allRecruits
    }, null, 2));
    console.log('Saved to:', outFile);

    // Rating coverage
    var coverage = {};
    allRecruits.forEach(function(r) {
      Object.keys(r.ratings || {}).forEach(function(k) { coverage[k] = (coverage[k] || 0) + 1; });
    });
    console.log('Rating coverage:', JSON.stringify(coverage));

    console.log('\nSample recruit:');
    console.log(JSON.stringify(allRecruits[0], null, 2));
  } else {
    console.log('No recruits found from either method.');
  }
}

scrape().catch(function(e) {
  console.error('Fatal error:', e);
  process.exit(1);
});
