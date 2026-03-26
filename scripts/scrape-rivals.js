#!/usr/bin/env node
/**
 * Rivals/On3 Recruiting Rankings Scraper
 * Rivals now redirects to On3. This scraper fetches from On3's Rivals rankings
 * page which includes __NEXT_DATA__ with structured JSON data.
 *
 * Usage: node scripts/scrape-rivals.js [year] [maxPages]
 * Example: node scripts/scrape-rivals.js 2026 10
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const YEAR = parseInt(process.argv[2]) || 2026;
const MAX_PAGES = parseInt(process.argv[3]) || 10; // 50 per page
const BASE_URL = 'https://www.on3.com/rivals/rankings/industry-player/football/' + YEAR + '/';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data', 'scraped');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache'
};

function fetchPage(url) {
  return new Promise(function(resolve, reject) {
    var mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: HEADERS }, function(res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchPage(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error('HTTP ' + res.statusCode + ' for ' + url));
      }
      var chunks = [];
      res.on('data', function(c) { chunks.push(c); });
      res.on('end', function() { resolve(Buffer.concat(chunks).toString('utf-8')); });
      res.on('error', reject);
    }).on('error', reject);
  });
}

function extractNextData(html) {
  var match = html.match(/<script\s+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) return null;
  try { return JSON.parse(match[1]); }
  catch(e) { return null; }
}

function parseRecruits(nextData) {
  try {
    var pageProps = nextData.props && nextData.props.pageProps;
    if (!pageProps) return { recruits: [], pagination: null };

    // Data lives at pageProps.playerData.list[] with pagination at pageProps.playerData.pagination
    var playerData = pageProps.playerData;
    if (!playerData) return { recruits: [], pagination: null };

    var rankingsData = playerData.list || [];
    var pag = playerData.pagination || {};
    var pagination = pag.count ? { total: pag.count, pageCount: pag.pageCount, perPage: pag.limit || 50 } : null;

    if (!Array.isArray(rankingsData)) return { recruits: [], pagination: pagination };

    var recruits = rankingsData.map(function(p) {
      var person = p.person || p.athlete || p.player || p;

      // Multi-service ratings
      var ratings = {};
      var ratingsArr = p.ratings || person.ratings || [];
      if (Array.isArray(ratingsArr)) {
        ratingsArr.forEach(function(r) {
          var type = (r.type || r.organizationName || r.source || '').toLowerCase();
          var entry = {
            rating: r.rating || null,
            stars: r.stars || null,
            rank: r.overallRank || null,
            positionRank: r.positionRank || null,
            stateRank: r.stateRank || null,
            fiveStarPlus: r.fiveStarPlus || false
          };

          if (type === 'industry' || type === 'consensus') {
            ratings.composite = entry;
          } else if (type === 'on3') {
            ratings.on3 = entry;
          } else if (type === '247' || type === '247sports') {
            ratings['247'] = entry;
          } else if (type === 'espn') {
            ratings.espn = entry;
          } else if (type === 'rivals') {
            ratings.rivals = entry;
          }
        });
      }

      // Commitment
      var status = person.status || p.status || {};
      var commitment = null;
      if (status.isCommitted || status.isSigned || status.isEnrolled || status.committedOrganizationSlug || p.committedOrganizationSlug) {
        commitment = {
          school: status.committedOrganizationSlug || p.committedOrganizationSlug || null,
          schoolName: status.committedOrganizationName || p.committedOrganizationName || null,
          signed: !!(status.isSigned),
          enrolled: !!(status.isEnrolled),
          date: status.commitmentDate || p.commitmentDate || null
        };
      }

      // Predictions
      var predictions = [];
      var preds = person.predictions || p.predictions || [];
      if (Array.isArray(preds)) {
        predictions = preds.map(function(pred) {
          return {
            school: pred.organizationSlug || pred.school || null,
            confidence: pred.confidence || null
          };
        });
      }

      // High school info
      var hs = person.highSchool || {};

      // Headshot image
      var imageUrl = null;
      if (person.defaultAsset && person.defaultAsset.source) {
        var domain = person.defaultAsset.domain || 'on3static.com';
        imageUrl = 'https://' + domain + person.defaultAsset.source;
      } else if (person.defaultAssetUrl) {
        imageUrl = person.defaultAssetUrl;
      }

      return {
        name: person.name || person.fullName || 'Unknown',
        slug: person.slug || null,
        position: p.positionAbbreviation || person.positionAbbreviation || null,
        city: person.homeTownName || person.city || null,
        state: p.stateAbbreviation || person.stateAbbreviation || null,
        height: person.formattedHeight || person.height || null,
        weight: person.weight || null,
        age: person.age || null,
        classYear: person.classYear || YEAR,
        highSchool: hs.name || null,
        highSchoolMascot: hs.mascot || null,
        overallRank: p.overallRank || p.consensusOverallRank || null,
        positionRank: p.positionRank || null,
        stateRank: p.stateRank || null,
        ratings: ratings,
        nilValue: p.nilValue || null,
        commitment: commitment,
        predictions: predictions.length > 0 ? predictions : null,
        fiveStarPlus: p.fiveStarPlus || false,
        athleteVerified: p.athleteVerified || false,
        imageUrl: imageUrl,
        source: 'rivals-on3'
      };
    });

    return { recruits: recruits, pagination: pagination };
  } catch(e) {
    console.error('Parse error:', e.message);
    return { recruits: [], pagination: null };
  }
}

async function scrape() {
  console.log('=== Rivals (via On3) Recruiting Rankings Scraper ===');
  console.log('Year:', YEAR, '| Max pages:', MAX_PAGES);
  console.log('URL pattern:', BASE_URL + '?page=N');
  console.log('');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  var allRecruits = [];
  var totalPages = MAX_PAGES;

  for (var page = 1; page <= totalPages; page++) {
    var url = BASE_URL + '?page=' + page;
    console.log('Fetching page ' + page + '/' + totalPages + '...');

    try {
      var html = await fetchPage(url);
      var nextData = extractNextData(html);

      if (!nextData) {
        console.log('  WARNING: No __NEXT_DATA__ found');
        if (page === 1) {
          console.log('  Page may be client-rendered. Saving raw HTML for debugging...');
          if (process.env.DEBUG) {
            fs.writeFileSync(path.join(OUTPUT_DIR, 'rivals-debug.html'), html.substring(0, 50000));
          }
          break;
        }
        continue;
      }

      if (page === 1) {
        console.log('  __NEXT_DATA__ found. pageProps keys:', Object.keys(nextData.props.pageProps || {}).join(', '));
      }

      var result = parseRecruits(nextData);

      if (page === 1 && result.pagination) {
        totalPages = Math.min(result.pagination.pageCount, MAX_PAGES);
        console.log('  Total: ' + result.pagination.total + ' recruits across ' + result.pagination.pageCount + ' pages');
        console.log('  Scraping ' + totalPages + ' pages');
      }

      console.log('  Parsed ' + result.recruits.length + ' recruits');
      allRecruits = allRecruits.concat(result.recruits);

      if (result.recruits.length === 0 && page > 1) {
        console.log('  Empty page, stopping');
        break;
      }

      // Rate limit
      if (page < totalPages) {
        await new Promise(function(r) { setTimeout(r, 1500); });
      }
    } catch(e) {
      console.error('  ERROR:', e.message);
      if (page === 1) break;
    }
  }

  console.log('\n=== Results ===');
  console.log('Total recruits scraped:', allRecruits.length);

  if (allRecruits.length > 0) {
    // Rating coverage stats
    var hasCoverage = { composite: 0, on3: 0, '247': 0, espn: 0, rivals: 0 };
    allRecruits.forEach(function(r) {
      Object.keys(r.ratings).forEach(function(k) { hasCoverage[k] = (hasCoverage[k] || 0) + 1; });
    });
    console.log('Rating coverage:', JSON.stringify(hasCoverage));

    var outFile = path.join(OUTPUT_DIR, 'rivals-recruits-' + YEAR + '.json');
    fs.writeFileSync(outFile, JSON.stringify({
      source: 'rivals-on3',
      year: YEAR,
      scrapedAt: new Date().toISOString(),
      count: allRecruits.length,
      recruits: allRecruits
    }, null, 2));
    console.log('Saved to:', outFile);

    console.log('\nSample recruit:');
    console.log(JSON.stringify(allRecruits[0], null, 2));
  } else {
    console.log('No recruits found. Run with DEBUG=1 for more info.');
  }
}

scrape().catch(function(e) {
  console.error('Fatal error:', e);
  process.exit(1);
});
