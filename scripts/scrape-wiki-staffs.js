#!/usr/bin/env node
'use strict';

/**
 * Scrape Wikipedia season pages to extract coaching staff for every FBS team.
 * Output: public/data/coaching/wiki-staffs/{team-slug}/{year}.json
 *
 * Usage:
 *   node scripts/scrape-wiki-staffs.js
 *   node scripts/scrape-wiki-staffs.js --start=2010 --end=2024
 *   node scripts/scrape-wiki-staffs.js --team=alabama
 *   node scripts/scrape-wiki-staffs.js --skip-existing
 *   node scripts/scrape-wiki-staffs.js --delay=600
 */

const fs   = require('fs');
const path = require('path');

// ── CLI args ───────────────────────────────────────────────────────────────────
const arg = k => process.argv.find(a => a.startsWith(`--${k}=`))?.split('=').slice(1).join('=');
const flag = k => process.argv.includes(`--${k}`);

const START_YEAR    = parseInt(arg('start') ?? '2000');
const END_YEAR      = parseInt(arg('end')   ?? '2024');
const TEAM_FILTER   = arg('team') ?? null;
const SKIP_EXISTING = flag('skip-existing');
const DELAY_MS      = parseInt(arg('delay') ?? '1200');

const OUT_DIR = path.join(__dirname, '..', 'public', 'data', 'coaching', 'wiki-staffs');

// ── Team → Wikipedia article name ──────────────────────────────────────────────
// Page title format: "{year} {WIKI_NAME} football season"
// Wikipedia uses redirects=1 so minor variations resolve automatically.
const WIKI_NAMES = {
  // SEC
  'alabama':              'Alabama Crimson Tide',
  'arkansas':             'Arkansas Razorbacks',
  'auburn':               'Auburn Tigers',
  'florida':              'Florida Gators',
  'georgia':              'Georgia Bulldogs',
  'kentucky':             'Kentucky Wildcats',
  'lsu':                  'LSU Tigers',
  'ole miss':             'Ole Miss Rebels',
  'mississippi state':    'Mississippi State Bulldogs',
  'missouri':             'Missouri Tigers',
  'oklahoma':             'Oklahoma Sooners',
  'south carolina':       'South Carolina Gamecocks',
  'tennessee':            'Tennessee Volunteers',
  'texas':                'Texas Longhorns',
  'texas a&m':            'Texas A&M Aggies',
  'vanderbilt':           'Vanderbilt Commodores',
  // Big Ten
  'illinois':             'Illinois Fighting Illini',
  'indiana':              'Indiana Hoosiers',
  'iowa':                 'Iowa Hawkeyes',
  'maryland':             'Maryland Terrapins',
  'michigan':             'Michigan Wolverines',
  'michigan state':       'Michigan State Spartans',
  'minnesota':            'Minnesota Golden Gophers',
  'nebraska':             'Nebraska Cornhuskers',
  'northwestern':         'Northwestern Wildcats',
  'ohio state':           'Ohio State Buckeyes',
  'oregon':               'Oregon Ducks',
  'penn state':           'Penn State Nittany Lions',
  'purdue':               'Purdue Boilermakers',
  'rutgers':              'Rutgers Scarlet Knights',
  'ucla':                 'UCLA Bruins',
  'usc':                  'USC Trojans',
  'washington':           'Washington Huskies',
  'wisconsin':            'Wisconsin Badgers',
  // Big 12
  'arizona':              'Arizona Wildcats',
  'arizona state':        'Arizona State Sun Devils',
  'baylor':               'Baylor Bears',
  'byu':                  'BYU Cougars',
  'cincinnati':           'Cincinnati Bearcats',
  'colorado':             'Colorado Buffaloes',
  'houston':              'Houston Cougars',
  'iowa state':           'Iowa State Cyclones',
  'kansas':               'Kansas Jayhawks',
  'kansas state':         'Kansas State Wildcats',
  'oklahoma state':       'Oklahoma State Cowboys',
  'tcu':                  'TCU Horned Frogs',
  'texas tech':           'Texas Tech Red Raiders',
  'ucf':                  'UCF Knights',
  'utah':                 'Utah Utes',
  'west virginia':        'West Virginia Mountaineers',
  // ACC
  'boston college':       'Boston College Eagles',
  'california':           'California Golden Bears',
  'clemson':              'Clemson Tigers',
  'duke':                 'Duke Blue Devils',
  'florida state':        'Florida State Seminoles',
  'georgia tech':         'Georgia Tech Yellow Jackets',
  'louisville':           'Louisville Cardinals',
  'miami':                'Miami Hurricanes',
  'north carolina':       'North Carolina Tar Heels',
  'north carolina state': 'NC State Wolfpack',
  'pittsburgh':           'Pittsburgh Panthers',
  'smu':                  'SMU Mustangs',
  'stanford':             'Stanford Cardinal',
  'syracuse':             'Syracuse Orange',
  'virginia':             'Virginia Cavaliers',
  'virginia tech':        'Virginia Tech Hokies',
  'wake forest':          'Wake Forest Demon Deacons',
  // American / Group of 5
  'army':                 'Army Black Knights',
  'east carolina':        'East Carolina Pirates',
  'fau':                  'Florida Atlantic Owls',
  'memphis':              'Memphis Tigers',
  'navy':                 'Navy Midshipmen',
  'north texas':          'North Texas Mean Green',
  'usf':                  'South Florida Bulls',
  'temple':               'Temple Owls',
  'tulane':               'Tulane Green Wave',
  'tulsa':                'Tulsa Golden Hurricane',
  'uab':                  'UAB Blazers',
  'utsa':                 'UTSA Roadrunners',
  'charlotte':            'Charlotte 49ers',
  'rice':                 'Rice Owls',
  // Pac-12 remnants
  'washington state':     'Washington State Cougars',
  'oregon state':         'Oregon State Beavers',
  // Mountain West
  'air force':            'Air Force Falcons',
  'boise state':          'Boise State Broncos',
  'colorado state':       'Colorado State Rams',
  'fresno state':         'Fresno State Bulldogs',
  'hawaii':               "Hawai'i Rainbow Warriors",
  'nevada':               'Nevada Wolf Pack',
  'new mexico':           'New Mexico Lobos',
  'san diego state':      'San Diego State Aztecs',
  'san jose state':       'San José State Spartans',
  'unlv':                 'UNLV Rebels',
  'utah state':           'Utah State Aggies',
  'wyoming':              'Wyoming Cowboys',
  // Sun Belt
  'old dominion':         'Old Dominion Monarchs',
  'appalachian state':    'Appalachian State Mountaineers',
  'arkansas state':       'Arkansas State Red Wolves',
  'coastal carolina':     'Coastal Carolina Chanticleers',
  'georgia southern':     'Georgia Southern Eagles',
  'georgia state':        'Georgia State Panthers',
  'louisiana':            "Louisiana Ragin' Cajuns",
  'louisiana-monroe':     'Louisiana–Monroe Warhawks',
  'marshall':             'Marshall Thundering Herd',
  'south alabama':        'South Alabama Jaguars',
  'southern miss':        'Southern Miss Golden Eagles',
  'texas state':          'Texas State Bobcats',
  'troy':                 'Troy Trojans',
  'james madison':        'James Madison Dukes',
  // Conference USA
  'missouri state':        'Missouri State Bears',
  'delaware':              'Delaware Fightin Blue Hens',
  'jacksonville state':    'Jacksonville State Gamecocks',
  'kennesaw state':        'Kennesaw State Owls',
  'sam houston':           'Sam Houston Bearkats',
  'florida international': 'FIU Panthers',
  'liberty':              'Liberty Flames',
  'louisiana tech':       'Louisiana Tech Bulldogs',
  'middle tennessee state':'Middle Tennessee Blue Raiders',
  'new mexico state':     'New Mexico State Aggies',
  'utep':                 'UTEP Miners',
  'western kentucky':     'Western Kentucky Hilltoppers',
  // MAC
  'akron':                'Akron Zips',
  'ball state':           'Ball State Cardinals',
  'bowling green':        'Bowling Green Falcons',
  'buffalo':              'Buffalo Bulls',
  'central michigan':     'Central Michigan Chippewas',
  'eastern michigan':     'Eastern Michigan Eagles',
  'kent state':           'Kent State Golden Flashes',
  'massachusetts':        'UMass Minutemen',
  'miami (oh)':           'Miami RedHawks',
  'northern illinois':    'Northern Illinois Huskies',
  'ohio':                 'Ohio Bobcats',
  'toledo':               'Toledo Rockets',
  'western michigan':     'Western Michigan Broncos',
  // Independent
  'notre dame':           'Notre Dame Fighting Irish',
  'connecticut':          'UConn Huskies',
};

// ── Wikitext parser ────────────────────────────────────────────────────────────

function cleanWiki(text) {
  if (!text) return '';
  return text
    .replace(/\{\{(?:ill|link-interwiki)\|([^|}\n]*)[^}]*\}\}/gi, '$1')
    .replace(/\{\{sortname\|([^|}\n]*)\|([^|}\n]*)[^}]*\}\}/gi, '$1 $2')
    .replace(/\{\{[^{}\n]*\}\}/g, '')
    .replace(/\[\[(?:[^\]|\n]*\|)?([^\]|\n]*)\]\]/g, '$1')
    .replace(/\[https?:\/\/\S+\s+([^\]]*)\]/g, '$1')
    .replace(/'{2,}/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
    .replace(/&ndash;|–/g, '–').replace(/&mdash;/g, '—')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Matches explicit coaching titles AND football position group labels
const ROLE_KEYWORDS = /\b(?:coach|coordinator|director|analyst|strength|conditioning|recruiting|consultant|assistant|trainer|advisor|specialist|receivers?|backs?|linebackers?|linema[nh]|linemen|secondary|safeties|safety|cornerbacks?|corners?|quarterbacks?|special\s+teams?|tight\s+ends?|kickers?|punters?|graduate|inside\s+line|outside\s+line|defensive\s+backs?|offensive\s+line|defensive\s+line|running\s+backs?|wide\s+receiv|pass\s+game|run\s+game|passing\s+game)\b/i;

// Heuristic: "First Last" or "First M. Last" — title-cased, 2–4 words, no digits
function looksLikeName(s) {
  const words = s.trim().split(/\s+/);
  if (words.length < 2 || words.length > 4) return false;
  if (s.length > 45) return false;
  return words.every(w => /^[A-Z][a-zA-Z'\-\.]{0,}$/.test(w));
}

// Heuristic: looks like a football position/role (but doesn't match ROLE_KEYWORDS)
const POSITION_WORDS = /\b(?:offense|defence|defense|offens|quarter|receiver|linebacker|lineman|linemen|secondary|safety|safeties|corner|kicker|punter|snapper|returner|blocker|rush|pass|run|tackle|guard|center|end|back)\b/i;

function looksLikeRole(s) {
  return ROLE_KEYWORDS.test(s) || POSITION_WORDS.test(s);
}

function parseCoachingStaff(wikitext) {
  const staff = [];

  // Locate the coaching staff section — handles many naming variants
  const secRe = /={2,3}\s*(?:(?:Head\s+)?Coaching\s+)?[Ss]taff\s*={2,3}|={2,3}\s*[Cc]oachin?g\s*={2,3}|={2,3}\s*[Cc]oaches?\s*={2,3}/;
  const secMatch = secRe.exec(wikitext);
  let section = wikitext;
  if (secMatch) {
    const afterSec = wikitext.slice(secMatch.index + secMatch[0].length);
    const nextSec  = afterSec.search(/\n={2,3}[^=]/);
    section = afterSec.slice(0, nextSec !== -1 ? nextSec : 10000);
  }

  // Find wikitables
  const tableRe = /\{\|[\s\S]*?\|\}/g;
  let tm;
  while ((tm = tableRe.exec(section)) !== null) {
    const table = tm[0];
    // Only process tables that contain coaching-related text
    if (!/coach|coordinator|staff|position|title|receivers?|backs?|linebacker/i.test(table)) continue;

    const rows = table.split(/\n\s*\|-\s*(?:\n|$)/);

    // Detect column order from header row (! Name !! Position or ! Position !! Name)
    let nameFirst = null; // null = unknown, true = name col is 0, false = role col is 0
    for (const row of rows) {
      if (!row.trim().startsWith('!')) continue;
      const headers = row.replace(/^[!\s]+/, '').split(/!!|\n!/).map(h => cleanWiki(h).toLowerCase());
      if (headers[0].includes('name') || headers[0].includes('coach')) nameFirst = true;
      else if (headers[0].includes('position') || headers[0].includes('title') || headers[0].includes('role')) nameFirst = false;
      break;
    }

    for (const row of rows) {
      const t = row.trim();
      if (!t || t.startsWith('{|') || t.startsWith('|}') || t.startsWith('|+')) continue;
      if (t.startsWith('!')) continue; // header row

      // Extract cells — two formats:
      //   single-line:  | Role || Name
      //   multi-line:   | Role\n| Name
      let cells;
      if (t.includes('||')) {
        cells = t.replace(/^\s*\|/, '').split('||');
      } else {
        cells = t.split(/\n\s*\|(?!\|)/).filter(Boolean);
      }

      cells = cells
        .map(c => cleanWiki(c.replace(/^[|\s]+/, '')))
        .filter(c => c.length > 1 && c.length < 120);

      if (cells.length < 2) continue;

      const [a, b] = cells;
      const aIsRole = looksLikeRole(a);
      const bIsRole = looksLikeRole(b);
      const aIsName = looksLikeName(a);
      const bIsName = looksLikeName(b);

      if (nameFirst === true) {
        // Header told us: col 0 = name, col 1 = role
        if (aIsName && b.length > 1) staff.push({ role: b, name: a });
      } else if (nameFirst === false) {
        // Header told us: col 0 = role, col 1 = name
        if (bIsName && a.length > 1) staff.push({ role: a, name: b });
      } else if (aIsRole && !bIsRole && bIsName) {
        staff.push({ role: a, name: b });
      } else if (bIsRole && !aIsRole && aIsName) {
        staff.push({ role: b, name: a });
      } else if (aIsRole && bIsName) {
        staff.push({ role: a, name: b });
      } else if (bIsRole && aIsName) {
        staff.push({ role: b, name: a });
      }
    }

    if (staff.length > 0) break; // stop after first matching table
  }

  return staff;
}

// ── Wikipedia API ──────────────────────────────────────────────────────────────

async function fetchWikitext(pageTitle, attempt = 0) {
  const params = new URLSearchParams({
    action:        'parse',
    page:          pageTitle,
    prop:          'wikitext',
    format:        'json',
    redirects:     '1',
    formatversion: '2',
  });
  const res = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
    headers: { 'User-Agent': 'CFB-HQ-CoachingTree/1.0 (data-collection; non-commercial)' },
  });

  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get('retry-after') ?? '0');
    const backoff = retryAfter > 0 ? retryAfter * 1000 : Math.min(5000 * Math.pow(2, attempt), 60000);
    if (attempt >= 4) throw new Error('HTTP 429 — rate limited after 4 retries');
    process.stdout.write(` [429, wait ${Math.round(backoff/1000)}s]`);
    await sleep(backoff);
    return fetchWikitext(pageTitle, attempt + 1);
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) return null;
  return json.parse?.wikitext ?? null;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function toSlug(teamId) {
  return teamId.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const teams = Object.entries(WIKI_NAMES)
    .filter(([id]) => !TEAM_FILTER || id === TEAM_FILTER);

  const totalRequests = teams.length * (END_YEAR - START_YEAR + 1);
  console.log(`Teams: ${teams.length}  Years: ${START_YEAR}–${END_YEAR}  Total requests: ~${totalRequests}`);
  console.log(`Estimated time: ~${Math.ceil(totalRequests * DELAY_MS / 60000)} min at ${DELAY_MS}ms/req\n`);

  let nFound = 0, nMissing = 0, nSkipped = 0;

  for (let ti = 0; ti < teams.length; ti++) {
    const [teamId, wikiName] = teams[ti];
    const slug    = toSlug(teamId);
    const teamDir = path.join(OUT_DIR, slug);
    fs.mkdirSync(teamDir, { recursive: true });

    process.stdout.write(`[${String(ti + 1).padStart(3)}/${teams.length}] ${teamId.padEnd(25)}`);

    let teamFound = 0;
    for (let year = START_YEAR; year <= END_YEAR; year++) {
      const outFile = path.join(teamDir, `${year}.json`);

      if (SKIP_EXISTING && fs.existsSync(outFile)) {
        nSkipped++;
        continue;
      }

      const pageTitle = `${year} ${wikiName} football season`;

      try {
        let wikitext = await fetchWikitext(pageTitle);
        // Fallback: try without "season" suffix
        if (!wikitext) wikitext = await fetchWikitext(`${year} ${wikiName} football`);

        if (!wikitext) {
          fs.writeFileSync(outFile, JSON.stringify({ team: teamId, year, staff: [], found: false }));
          nMissing++;
        } else {
          const staff = parseCoachingStaff(wikitext);
          fs.writeFileSync(outFile, JSON.stringify({ team: teamId, year, staff, found: true }, null, 2));
          if (staff.length > 0) { nFound++; teamFound++; }
          else nMissing++;
        }
      } catch (err) {
        fs.writeFileSync(outFile, JSON.stringify({ team: teamId, year, staff: [], found: false, error: err.message }));
        nMissing++;
      }

      await sleep(DELAY_MS);
    }

    console.log(`${teamFound}/${END_YEAR - START_YEAR + 1} years with staff`);
  }

  console.log(`\n✓ Done. ${nFound} year-files with staff, ${nMissing} missing/empty, ${nSkipped} skipped`);
}

main().catch(err => { console.error(err); process.exit(1); });
