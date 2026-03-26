#!/usr/bin/env node
/**
 * 247Sports Recruit Scraper
 * Fetches recruit rankings from 247Sports public JSON API.
 *
 * Usage: node scripts/scrape-247.js [year] [maxPages]
 * Example: node scripts/scrape-247.js 2026 5
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const YEAR = parseInt(process.argv[2]) || 2026;
const MAX_PAGES = parseInt(process.argv[3]) || 5; // 300 per page, 5 pages = 1500 recruits
const ITEMS_PER_PAGE = 300;
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data', 'scraped');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://247sports.com/season/' + YEAR + '-football/recruits/'
};

function fetchJSON(url) {
  return new Promise(function(resolve, reject) {
    https.get(url, { headers: HEADERS }, function(res) {
      if (res.statusCode !== 200) {
        return reject(new Error('HTTP ' + res.statusCode + ' for ' + url));
      }
      var chunks = [];
      res.on('data', function(c) { chunks.push(c); });
      res.on('end', function() {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8')));
        } catch(e) {
          reject(new Error('Invalid JSON response'));
        }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

function normalizeRecruit(r) {
  var player = r.Player || {};
  var hometown = player.Hometown || {};
  var position = player.PrimaryPlayerPosition || {};
  var highSchool = player.PlayerHighSchool || {};

  // Convert 247 rating (80-101 scale) to 0-1.0 scale
  var rating247 = player.Rating || 0;
  var ratingNormalized = rating247 > 1 ? rating247 / 100 : rating247;

  return {
    id: r.Key || null,
    name: player.FullName || 'Unknown',
    firstName: player.FirstName || null,
    lastName: player.LastName || null,
    position: position.Abbreviation || null,
    city: hometown.City || null,
    state: hometown.State || null,
    height: player.Height || null,
    weight: player.Weight || null,
    highSchool: highSchool.Name || null,
    classYear: r.Year || YEAR,
    stars: player.StarRating || 0,
    rating: ratingNormalized,
    rating247Raw: rating247,
    nationalRank: player.NationalRank || null,
    positionRank: player.PositionRank || null,
    stateRank: player.StateRank || null,
    imageUrl: player.DefaultAssetUrl || null,
    profileUrl: player.Url || null,
    committedSchoolLogo: r.CommitedInstitutionTeamImage || null,
    committedInstitutionId: r.CommittedInstitution || null,
    signedInstitutionId: r.SignedInstitution || null,
    status: r.HighestRecruitInterestEventType || null,
    commitStatus: (r.HighestRecruitInterestEventType === 'Committed' || r.HighestRecruitInterestEventType === 'Enrolled' || r.HighestRecruitInterestEventType === 'Signed') ? 'committed' : 'uncommitted',
    announcementDate: r.AnnouncementDate || null,
    birthdate: player.Birthdate || null,
    twitterId: player.TwitterContact || null,
    interestCount: r.RecruitInterestCount || 0,
    interestsUrl: r.RecruitInterestsUrl || null,
    source: '247sports'
  };
}

async function scrape() {
  console.log('=== 247Sports Recruit Scraper ===');
  console.log('Year:', YEAR, '| Max pages:', MAX_PAGES, '(' + (MAX_PAGES * ITEMS_PER_PAGE) + ' max recruits)');
  console.log('');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  var allRecruits = [];

  for (var page = 1; page <= MAX_PAGES; page++) {
    var url = 'https://247sports.com/Season/' + YEAR + '-Football/Recruits.json?Items=' + ITEMS_PER_PAGE + '&Page=' + page;
    console.log('Fetching page ' + page + '/' + MAX_PAGES + '...');

    try {
      var data = await fetchJSON(url);

      if (!Array.isArray(data) || data.length === 0) {
        console.log('  No more results (page ' + page + ' empty)');
        break;
      }

      var recruits = data.map(normalizeRecruit);
      console.log('  Found ' + recruits.length + ' recruits');
      allRecruits = allRecruits.concat(recruits);

      // If we got fewer than expected, we've reached the end
      if (data.length < ITEMS_PER_PAGE) {
        console.log('  Last page (fewer than ' + ITEMS_PER_PAGE + ' results)');
        break;
      }

      // Rate limiting
      if (page < MAX_PAGES) {
        await new Promise(function(r) { setTimeout(r, 1000); });
      }
    } catch(e) {
      console.error('  ERROR on page ' + page + ':', e.message);
      if (page === 1) break;
    }
  }

  console.log('\n=== Results ===');
  console.log('Total recruits scraped:', allRecruits.length);

  if (allRecruits.length > 0) {
    // Star distribution
    var stars = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0 };
    allRecruits.forEach(function(r) { stars[r.stars] = (stars[r.stars] || 0) + 1; });
    console.log('Star distribution:', JSON.stringify(stars));

    // Save full data
    var outFile = path.join(OUTPUT_DIR, '247-recruits-' + YEAR + '.json');
    fs.writeFileSync(outFile, JSON.stringify({
      source: '247sports',
      year: YEAR,
      scrapedAt: new Date().toISOString(),
      count: allRecruits.length,
      recruits: allRecruits
    }, null, 2));
    console.log('Saved to:', outFile);

    // Print sample
    console.log('\nSample recruit:');
    console.log(JSON.stringify(allRecruits[0], null, 2));
  }
}

scrape().catch(function(e) {
  console.error('Fatal error:', e);
  process.exit(1);
});
