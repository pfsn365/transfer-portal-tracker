/**
 * Fetches rounds 2 & 3 (picks 33–100) from the PFN live tracking sheet and
 * injects them into the appropriate team draft JSON files.
 *
 * Usage:
 *   npx tsx tools/injectLivePicks2026.ts [--round=2] [--round=3] [--dry-run]
 *
 * Defaults to both rounds 2 and 3.
 */

import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';

interface DraftPick {
  year: number;
  round: number;
  pick: number;
  name: string;
  position: string;
  nflTeam: string;
}

interface TeamDraftFile {
  teamId: string;
  teamSlug: string;
  teamName: string;
  draftPicks: DraftPick[];
}

const PFN_URL =
  'https://staticd.profootballnetwork.com/assets/sheets/tools/nfl-draft-tracking-and-grades/draftTrackingAndGradesData.json';

const TEAM_NAMES: Record<string, string> = {
  ARI: 'Arizona Cardinals', ATL: 'Atlanta Falcons', BAL: 'Baltimore Ravens',
  BUF: 'Buffalo Bills',   CAR: 'Carolina Panthers', CHI: 'Chicago Bears',
  CIN: 'Cincinnati Bengals', CLE: 'Cleveland Browns', DAL: 'Dallas Cowboys',
  DEN: 'Denver Broncos',  DET: 'Detroit Lions',   GB:  'Green Bay Packers',
  HOU: 'Houston Texans',  IND: 'Indianapolis Colts', JAX: 'Jacksonville Jaguars',
  KC:  'Kansas City Chiefs', LAC: 'Los Angeles Chargers', LAR: 'Los Angeles Rams',
  LV:  'Las Vegas Raiders', MIA: 'Miami Dolphins', MIN: 'Minnesota Vikings',
  NE:  'New England Patriots', NO: 'New Orleans Saints', NYG: 'New York Giants',
  NYJ: 'New York Jets',   PHI: 'Philadelphia Eagles', PIT: 'Pittsburgh Steelers',
  SEA: 'Seattle Seahawks', SF: 'San Francisco 49ers', TB: 'Tampa Bay Buccaneers',
  TEN: 'Tennessee Titans', WAS: 'Washington Commanders',
};

const ABBR_NORMALIZE: Record<string, string> = {
  GNB: 'GB', KCC: 'KC', LVR: 'LV', NOR: 'NO',
  NWE: 'NE', SFO: 'SF', TAM: 'TB', JAC: 'JAX',
  LAX: 'LAR', CLV: 'CLE', ARZ: 'ARI',
};

// Maps PFN/master-DB school name → our team JSON slug
const SCHOOL_TO_SLUG: Record<string, string> = {
  'Air Force':              'air-force-falcons',
  'Akron':                  'akron-zips',
  'Alabama':                'alabama-crimson-tide',
  'Appalachian State':      'appalachian-state-mountaineers',
  'Arizona':                'arizona-wildcats',
  'Arizona State':          'arizona-state-sun-devils',
  'Arkansas':               'arkansas-razorbacks',
  'Arkansas State':         'arkansas-state-red-wolves',
  'Army':                   'army-black-knights',
  'Auburn':                 'auburn-tigers',
  'Ball State':             'ball-state-cardinals',
  'Baylor':                 'baylor-bears',
  'Boise State':            'boise-state-broncos',
  'Boston College':         'boston-college-eagles',
  'Bowling Green':          'bowling-green-falcons',
  'BYU':                    'byu-cougars',
  'California':             'california-golden-bears',
  'Central Michigan':       'central-michigan-chippewas',
  'Charlotte':              'charlotte-49ers',
  'Cincinnati':             'cincinnati-bearcats',
  'Clemson':                'clemson-tigers',
  'Coastal Carolina':       'coastal-carolina-chanticleers',
  'Colorado':               'colorado-buffaloes',
  'Colorado State':         'colorado-state-rams',
  'Duke':                   'duke-blue-devils',
  'East Carolina':          'east-carolina-pirates',
  'Eastern Michigan':       'eastern-michigan-eagles',
  'FAU':                    'fau-owls',
  'FIU':                    'fiu-panthers',
  'Florida':                'florida-gators',
  'Florida State':          'florida-state-seminoles',
  'Fresno State':           'fresno-state-bulldogs',
  'Georgia':                'georgia-bulldogs',
  'Georgia Southern':       'georgia-southern-eagles',
  'Georgia State':          'georgia-state-panthers',
  'Georgia Tech':           'georgia-tech-yellow-jackets',
  'Hawaii':                 'hawaii-rainbow-warriors',
  'Houston':                'houston-cougars',
  'Illinois':               'illinois-fighting-illini',
  'Indiana':                'indiana-hoosiers',
  'Iowa':                   'iowa-hawkeyes',
  'Iowa State':             'iowa-state-cyclones',
  'Jacksonville State':     'jacksonville-state-gamecocks',
  'James Madison':          'james-madison-dukes',
  'Kansas':                 'kansas-jayhawks',
  'Kansas State':           'kansas-state-wildcats',
  'Kennesaw State':         'kennesaw-state-owls',
  'Kent State':             'kent-state-golden-flashes',
  'Kentucky':               'kentucky-wildcats',
  'Liberty':                'liberty-flames',
  'Louisiana':              'louisiana-ragin-cajuns',
  "Louisiana-Lafayette":    'louisiana-ragin-cajuns',
  'Louisiana Tech':         'louisiana-tech-bulldogs',
  'Louisville':             'louisville-cardinals',
  'LSU':                    'lsu-tigers',
  'Marshall':               'marshall-thundering-herd',
  'Maryland':               'maryland-terrapins',
  'Memphis':                'memphis-tigers',
  'Miami (FL)':             'miami-hurricanes',
  'Miami (OH)':             'miami-oh-redhawks',
  'Michigan':               'michigan-wolverines',
  'Michigan State':         'michigan-state-spartans',
  'Middle Tennessee':       'middle-tennessee-blue-raiders',
  'Minnesota':              'minnesota-golden-gophers',
  'Mississippi State':      'mississippi-state-bulldogs',
  'Missouri':               'missouri-tigers',
  'Navy':                   'navy-midshipmen',
  'Nebraska':               'nebraska-cornhuskers',
  'Nevada':                 'nevada-wolf-pack',
  'New Mexico':             'new-mexico-lobos',
  'New Mexico State':       'new-mexico-state-aggies',
  'North Carolina':         'north-carolina-tar-heels',
  'North Texas':            'north-texas-mean-green',
  'Northern Illinois':      'northern-illinois-huskies',
  'Northwestern':           'northwestern-wildcats',
  'Notre Dame':             'notre-dame-fighting-irish',
  'NC State':               'nc-state-wolfpack',
  'Ohio':                   'ohio-bobcats',
  'Ohio State':             'ohio-state-buckeyes',
  'Oklahoma':               'oklahoma-sooners',
  'Oklahoma State':         'oklahoma-state-cowboys',
  'Ole Miss':               'ole-miss-rebels',
  'Old Dominion':           'old-dominion-monarchs',
  'Oregon':                 'oregon-ducks',
  'Oregon State':           'oregon-state-beavers',
  'Penn State':             'penn-state-nittany-lions',
  'Pittsburgh':             'pittsburgh-panthers',
  'Purdue':                 'purdue-boilermakers',
  'Rice':                   'rice-owls',
  'Rutgers':                'rutgers-scarlet-knights',
  'Sam Houston':            'sam-houston-bearkats',
  'San Diego State':        'san-diego-state-aztecs',
  'San Jose State':         'san-jose-state-spartans',
  'SMU':                    'smu-mustangs',
  'South Alabama':          'south-alabama-jaguars',
  'South Carolina':         'south-carolina-gamecocks',
  'Southern Miss':          'southern-miss-golden-eagles',
  'Stanford':               'stanford-cardinal',
  'Syracuse':               'syracuse-orange',
  'TCU':                    'tcu-horned-frogs',
  'Temple':                 'temple-owls',
  'Tennessee':              'tennessee-volunteers',
  'Texas':                  'texas-longhorns',
  'Texas A&M':              'texas-am-aggies',
  'Texas State':            'texas-state-bobcats',
  'Texas Tech':             'texas-tech-red-raiders',
  'Toledo':                 'toledo-rockets',
  'Troy':                   'troy-trojans',
  'Tulane':                 'tulane-green-wave',
  'Tulsa':                  'tulsa-golden-hurricane',
  'UAB':                    'uab-blazers',
  'UCF':                    'ucf-knights',
  'UConn':                  'uconn-huskies',
  'UL Monroe':              'ul-monroe-warhawks',
  'UNLV':                   'unlv-rebels',
  'USC':                    'usc-trojans',
  'USF':                    'usf-bulls',
  'UTSA':                   'utsa-roadrunners',
  'Utah':                   'utah-utes',
  'Utah State':             'utah-state-aggies',
  'Vanderbilt':             'vanderbilt-commodores',
  'Virginia':               'virginia-cavaliers',
  'Virginia Tech':          'virginia-tech-hokies',
  'Wake Forest':            'wake-forest-demon-deacons',
  'Washington':             'washington-huskies',
  'Washington State':       'washington-state-cougars',
  'West Virginia':          'west-virginia-mountaineers',
  'Western Kentucky':       'western-kentucky-hilltoppers',
  'Western Michigan':       'western-michigan-broncos',
  'Wisconsin':              'wisconsin-badgers',
  'Wyoming':                'wyoming-cowboys',
};

function pickToRound(pick: number): number {
  if (pick <= 32)  return 1;
  if (pick <= 64)  return 2;
  if (pick <= 100) return 3;
  if (pick <= 138) return 4;
  if (pick <= 179) return 5;
  if (pick <= 217) return 6;
  return 7;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[''`]/g, '').replace(/\./g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'PFN-Internal-NON-Blocking' } }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const roundArgs = args.filter(a => a.startsWith('--round=')).map(a => parseInt(a.split('=')[1]));
  const targetRounds = roundArgs.length > 0 ? roundArgs : [2, 3];

  const draftDir = path.join(process.cwd(), 'data', 'draft');
  const masterDbPath = path.join(process.cwd(), '..', 'nfl-draft-hub', 'data', 'master-player-database.json');

  if (!fs.existsSync(masterDbPath)) {
    console.error(`Master player DB not found at ${masterDbPath}`);
    process.exit(1);
  }

  const masterDb: Array<{ id: string; name?: string; school?: string }> = JSON.parse(fs.readFileSync(masterDbPath, 'utf-8'));
  const bySlug = new Map<string, string>();
  masterDb.forEach(p => { if (p.id && p.school) bySlug.set(p.id, p.school); });

  console.log(`Fetching PFN live data...`);
  const json = await fetchJson(PFN_URL);
  const collections: Array<{ sheetName: string; data: string[][] }> = json.collections || [];
  const trackingSheet = collections.find(c => c.sheetName === 'draft_tracking');

  if (!trackingSheet) {
    console.error('No draft_tracking sheet found in PFN response');
    process.exit(1);
  }

  const minPick = Math.min(...targetRounds.map(r => r === 1 ? 1 : r === 2 ? 33 : r === 3 ? 65 : r === 4 ? 101 : r === 5 ? 139 : 180));
  const maxPick = Math.max(...targetRounds.map(r => r === 1 ? 32 : r === 2 ? 64 : r === 3 ? 100 : r === 4 ? 138 : r === 5 ? 179 : 217));

  const livePicks = trackingSheet.data.slice(1).filter(row => {
    const pick = parseInt(row[0]);
    return !isNaN(pick) && pick >= minPick && pick <= maxPick && row[3];
  });

  console.log(`Found ${livePicks.length} picks in rounds ${targetRounds.join(', ')} from PFN`);
  console.log('');

  const injected: string[] = [];
  const skipped: string[] = [];
  const noFile: string[] = [];

  for (const row of livePicks) {
    const pickNum = parseInt(row[0]);
    const rawAbbr = (row[1] || '').toUpperCase();
    const abbr = ABBR_NORMALIZE[rawAbbr] ?? rawAbbr;
    const nflTeam = TEAM_NAMES[abbr] || abbr;
    const round = pickToRound(pickNum);
    const playerName = row[3];
    const position = row[4] || 'Unknown';
    const playerId = slugify(playerName);

    const school = bySlug.get(playerId);
    if (!school) {
      skipped.push(`  Pick ${pickNum}: ${playerName} — school not found in master DB`);
      continue;
    }

    const teamSlug = SCHOOL_TO_SLUG[school];
    if (!teamSlug) {
      skipped.push(`  Pick ${pickNum}: ${playerName} (${school}) — no slug mapping`);
      continue;
    }

    const filePath = path.join(draftDir, `${teamSlug}.json`);
    if (!fs.existsSync(filePath)) {
      noFile.push(`  Pick ${pickNum}: ${playerName} (${school}) — file missing: ${teamSlug}.json`);
      continue;
    }

    const fileData: TeamDraftFile = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const alreadyExists = fileData.draftPicks.some(
      p => p.year === 2026 && p.pick === pickNum
    );
    if (alreadyExists) {
      console.log(`  [SKIP] Pick ${pickNum} ${playerName} already in ${teamSlug}.json`);
      continue;
    }

    const newPick: DraftPick = { year: 2026, round, pick: pickNum, name: playerName, position, nflTeam };
    fileData.draftPicks.unshift(newPick);

    // Sort: year desc, then round asc, then pick asc
    fileData.draftPicks.sort((a, b) =>
      b.year !== a.year ? b.year - a.year : a.round !== b.round ? a.round - b.round : a.pick - b.pick
    );

    if (!dryRun) {
      fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2));
    }

    const mode = dryRun ? '[DRY RUN] ' : '';
    console.log(`  ${mode}Injected Pick ${pickNum} R${round}: ${playerName} (${school} → ${nflTeam}) into ${teamSlug}.json`);
    injected.push(`${teamSlug}: Pick ${pickNum} ${playerName}`);
  }

  console.log('\n========================================');
  console.log(`Done! ${dryRun ? '[DRY RUN] ' : ''}Injected: ${injected.length} | Skipped: ${skipped.length} | Missing files: ${noFile.length}`);

  if (skipped.length > 0) {
    console.log('\nSkipped (no school/slug match):');
    skipped.forEach(s => console.log(s));
  }
  if (noFile.length > 0) {
    console.log('\nMissing draft files:');
    noFile.forEach(s => console.log(s));
  }
}

main().catch(console.error);
