#!/usr/bin/env node
/**
 * ESPN Recruiting Rankings Scraper
 * Fetches from ESPN Core API which returns $ref links, then resolves each recruit.
 *
 * Usage: node scripts/scrape-espn.js [year] [maxRecruits]
 * Example: node scripts/scrape-espn.js 2026 300
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const YEAR = parseInt(process.argv[2]) || 2026;
const MAX_RECRUITS = parseInt(process.argv[3]) || 300;
const BATCH_SIZE = 10; // Concurrent requests per batch
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data', 'scraped');

function fetchJSON(url) {
  return new Promise(function(resolve, reject) {
    // ESPN core API uses http in $ref links, upgrade to https
    url = url.replace('http://', 'https://');
    var mod = url.startsWith('https') ? https : http;
    mod.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CFBRecruitingSim/1.0)',
        'Accept': 'application/json'
      }
    }, function(res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJSON(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      var chunks = [];
      res.on('data', function(c) { chunks.push(c); });
      res.on('end', function() {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch(e) { reject(new Error('Invalid JSON')); }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

function normalizeRecruit(data, index, resolvedSchools) {
  var athlete = data.athlete || {};
  var hometown = athlete.hometown || {};
  var position = athlete.position || {};
  var highSchool = athlete.highSchool || {};
  var hsAddress = highSchool.address || {};

  // Extract attributes (speed, agility, etc.)
  var attributes = {};
  (data.attributes || []).forEach(function(attr) {
    attributes[attr.abbreviation || attr.name] = attr.value;
  });

  // Extract school interests with resolved names
  var schools = [];
  (data.schools || []).forEach(function(s) {
    var school = { status: s.status ? s.status.description : null };
    if (s.team && s.team.$ref) {
      var teamId = s.team.$ref.match(/teams\/(\d+)/);
      if (teamId && resolvedSchools[teamId[1]]) {
        var t = resolvedSchools[teamId[1]];
        school.name = t.displayName || t.name || null;
        school.abbreviation = t.abbreviation || null;
        school.id = t.id || null;
      }
      school.ref = s.team.$ref;
    }
    schools.push(school);
  });

  // Determine commitment from school statuses
  var committedSchool = null;
  schools.forEach(function(s) {
    if (s.status === 'Committed' || s.status === 'Signed') {
      committedSchool = { name: s.name, abbreviation: s.abbreviation, status: s.status };
    }
  });

  // Height: ESPN returns inches, convert to readable format
  var heightInches = athlete.height || 0;
  var heightFt = Math.floor(heightInches / 12);
  var heightIn = Math.round(heightInches % 12);
  var height = heightInches ? (heightFt + '-' + heightIn) : null;

  return {
    rank: index + 1,
    name: athlete.displayName || athlete.fullName || 'Unknown',
    firstName: athlete.firstName || null,
    lastName: athlete.lastName || null,
    espnId: athlete.id || null,
    position: position.abbreviation || null,
    positionName: position.displayName || null,
    city: hometown.city || null,
    state: hometown.stateAbbreviation || hometown.state || null,
    stateFull: hometown.state || null,
    height: height,
    heightInches: heightInches || null,
    weight: athlete.weight || null,
    highSchool: highSchool.name || null,
    highSchoolCity: hsAddress.city || null,
    highSchoolState: hsAddress.state || null,
    classYear: data.recruitingClass || YEAR,
    grade: data.grade || null,
    status: data.status || null,
    attributes: Object.keys(attributes).length > 0 ? attributes : null,
    committedSchool: committedSchool,
    schools: schools.length > 0 ? schools.map(function(s) { return { name: s.name || null, abbreviation: s.abbreviation || null, status: s.status || null }; }) : null,
    schoolInterests: schools.length,
    source: 'espn'
  };
}

async function scrape() {
  console.log('=== ESPN Recruiting Rankings Scraper ===');
  console.log('Year:', YEAR, '| Max recruits:', MAX_RECRUITS);
  console.log('');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Step 1: Get the list of recruit $ref URLs
  var pageSize = Math.min(MAX_RECRUITS, 100); // ESPN caps at some limit per page
  var allRefs = [];
  var pageIndex = 1;

  console.log('Step 1: Fetching recruit list...');
  while (allRefs.length < MAX_RECRUITS) {
    var listUrl = 'https://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/' + YEAR + '/recruits?limit=' + pageSize + '&page=' + pageIndex;
    try {
      var listData = await fetchJSON(listUrl);
      var items = listData.items || [];
      if (items.length === 0) break;

      items.forEach(function(item) {
        if (item.$ref && allRefs.length < MAX_RECRUITS) {
          allRefs.push(item.$ref);
        }
      });

      console.log('  Page ' + pageIndex + ': got ' + items.length + ' refs (total: ' + allRefs.length + '/' + (listData.count || '?') + ')');

      if (!listData.pageCount || pageIndex >= listData.pageCount) break;
      pageIndex++;
    } catch(e) {
      console.error('  Error fetching list page ' + pageIndex + ':', e.message);
      break;
    }
  }

  console.log('  Total refs collected: ' + allRefs.length);

  if (allRefs.length === 0) {
    console.log('No recruit references found.');
    return;
  }

  // Step 2: Batch-fetch individual recruit records and resolve school teams
  console.log('\nStep 2: Fetching individual recruit records (' + BATCH_SIZE + ' concurrent)...');
  var allRecruits = [];
  var errors = 0;
  var resolvedSchools = {}; // Cache of team ID → team data

  for (var i = 0; i < allRefs.length; i += BATCH_SIZE) {
    var batch = allRefs.slice(i, i + BATCH_SIZE);
    var batchNum = Math.floor(i / BATCH_SIZE) + 1;
    var totalBatches = Math.ceil(allRefs.length / BATCH_SIZE);

    process.stdout.write('  Batch ' + batchNum + '/' + totalBatches + '... ');

    var results = await Promise.allSettled(batch.map(function(ref) {
      return fetchJSON(ref);
    }));

    // Collect team refs that need resolving
    var teamRefsToResolve = [];
    results.forEach(function(result) {
      if (result.status === 'fulfilled' && result.value.schools) {
        result.value.schools.forEach(function(s) {
          if (s.team && s.team.$ref) {
            var teamId = s.team.$ref.match(/teams\/(\d+)/);
            if (teamId && !resolvedSchools[teamId[1]]) {
              teamRefsToResolve.push({ id: teamId[1], ref: s.team.$ref });
            }
          }
        });
      }
    });

    // Resolve unique team refs (batch)
    if (teamRefsToResolve.length > 0) {
      var uniqueRefs = {};
      teamRefsToResolve.forEach(function(t) { uniqueRefs[t.id] = t.ref; });
      var teamResults = await Promise.allSettled(Object.values(uniqueRefs).map(function(ref) { return fetchJSON(ref); }));
      teamResults.forEach(function(r) {
        if (r.status === 'fulfilled' && r.value.id) {
          resolvedSchools[r.value.id] = r.value;
        }
      });
    }

    var batchRecruits = [];
    results.forEach(function(result, idx) {
      if (result.status === 'fulfilled') {
        batchRecruits.push(normalizeRecruit(result.value, i + idx, resolvedSchools));
      } else {
        errors++;
      }
    });

    console.log(batchRecruits.length + ' OK' + (errors > 0 ? ', ' + errors + ' errors' : '') + ' (' + Object.keys(resolvedSchools).length + ' teams cached)');
    allRecruits = allRecruits.concat(batchRecruits);

    // Rate limit between batches
    if (i + BATCH_SIZE < allRefs.length) {
      await new Promise(function(r) { setTimeout(r, 500); });
    }
  }

  console.log('\n=== Results ===');
  console.log('Total recruits scraped:', allRecruits.length, '(' + errors + ' errors)');

  if (allRecruits.length > 0) {
    // Position distribution
    var positions = {};
    allRecruits.forEach(function(r) {
      positions[r.position || 'N/A'] = (positions[r.position || 'N/A'] || 0) + 1;
    });
    console.log('Positions:', JSON.stringify(positions));

    // Grade range
    var grades = allRecruits.filter(function(r) { return r.grade; }).map(function(r) { return r.grade; });
    if (grades.length > 0) {
      console.log('Grade range:', Math.min.apply(null, grades), '-', Math.max.apply(null, grades));
    }

    var outFile = path.join(OUTPUT_DIR, 'espn-recruits-' + YEAR + '.json');
    fs.writeFileSync(outFile, JSON.stringify({
      source: 'espn',
      year: YEAR,
      scrapedAt: new Date().toISOString(),
      count: allRecruits.length,
      recruits: allRecruits
    }, null, 2));
    console.log('Saved to:', outFile);

    console.log('\nSample recruit:');
    console.log(JSON.stringify(allRecruits[0], null, 2));
  }
}

scrape().catch(function(e) {
  console.error('Fatal error:', e);
  process.exit(1);
});
