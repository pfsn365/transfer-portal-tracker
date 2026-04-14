/**
 * Fetches NFL draft data from Pro Football Reference using Playwright (real Chrome).
 * Bypasses Cloudflare bot detection since it uses an actual browser.
 *
 * Usage:
 *   npx playwright install chromium   (first time only)
 *   npx tsx tools/fetchDraftPlaywright.ts
 *   npx tsx tools/fetchDraftPlaywright.ts --start=missouri-tigers
 */

import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

interface DraftPick {
  year: number;
  round: number;
  pick: number;
  name: string;
  position: string;
  nflTeam: string;
}

interface DraftData {
  teamId: string;
  teamSlug: string;
  teamName: string;
  draftPicks: DraftPick[];
}

const pfbRefSchoolIds: Record<string, { pfrId: string; teamName: string }> = {
  // SEC
  'alabama-crimson-tide': { pfrId: 'alabama', teamName: 'Alabama Crimson Tide' },
  'georgia-bulldogs': { pfrId: 'georgia', teamName: 'Georgia Bulldogs' },
  'lsu-tigers': { pfrId: 'lsu', teamName: 'LSU Tigers' },
  'auburn-tigers': { pfrId: 'auburn', teamName: 'Auburn Tigers' },
  'tennessee-volunteers': { pfrId: 'tennessee', teamName: 'Tennessee Volunteers' },
  'texas-am-aggies': { pfrId: 'texasam', teamName: 'Texas A&M Aggies' },
  'florida-gators': { pfrId: 'florida', teamName: 'Florida Gators' },
  'ole-miss-rebels': { pfrId: 'mississippi', teamName: 'Ole Miss Rebels' },
  'arkansas-razorbacks': { pfrId: 'arkansas', teamName: 'Arkansas Razorbacks' },
  'kentucky-wildcats': { pfrId: 'kentucky', teamName: 'Kentucky Wildcats' },
  'mississippi-state-bulldogs': { pfrId: 'mississippist', teamName: 'Mississippi State Bulldogs' },
  'missouri-tigers': { pfrId: 'missouri', teamName: 'Missouri Tigers' },
  'vanderbilt-commodores': { pfrId: 'vanderbilt', teamName: 'Vanderbilt Commodores' },
  'texas-longhorns': { pfrId: 'texas', teamName: 'Texas Longhorns' },
  'oklahoma-sooners': { pfrId: 'oklahoma', teamName: 'Oklahoma Sooners' },

  // Big Ten
  'ohio-state-buckeyes': { pfrId: 'ohiost', teamName: 'Ohio State Buckeyes' },
  'michigan-wolverines': { pfrId: 'michigan', teamName: 'Michigan Wolverines' },
  'penn-state-nittany-lions': { pfrId: 'pennst', teamName: 'Penn State Nittany Lions' },
  'wisconsin-badgers': { pfrId: 'wisconsin', teamName: 'Wisconsin Badgers' },
  'iowa-hawkeyes': { pfrId: 'iowa', teamName: 'Iowa Hawkeyes' },
  'michigan-state-spartans': { pfrId: 'michiganst', teamName: 'Michigan State Spartans' },
  'minnesota-golden-gophers': { pfrId: 'minnesota', teamName: 'Minnesota Golden Gophers' },
  'illinois-fighting-illini': { pfrId: 'illinois', teamName: 'Illinois Fighting Illini' },
  'indiana-hoosiers': { pfrId: 'indiana', teamName: 'Indiana Hoosiers' },
  'purdue-boilermakers': { pfrId: 'purdue', teamName: 'Purdue Boilermakers' },
  'nebraska-cornhuskers': { pfrId: 'nebraska', teamName: 'Nebraska Cornhuskers' },
  'northwestern-wildcats': { pfrId: 'northwestern', teamName: 'Northwestern Wildcats' },
  'maryland-terrapins': { pfrId: 'maryland', teamName: 'Maryland Terrapins' },
  'rutgers-scarlet-knights': { pfrId: 'rutgers', teamName: 'Rutgers Scarlet Knights' },
  'oregon-ducks': { pfrId: 'oregon', teamName: 'Oregon Ducks' },
  'usc-trojans': { pfrId: 'usc', teamName: 'USC Trojans' },
  'washington-huskies': { pfrId: 'washington', teamName: 'Washington Huskies' },
  'ucla-bruins': { pfrId: 'ucla', teamName: 'UCLA Bruins' },

  // ACC
  'clemson-tigers': { pfrId: 'clemson', teamName: 'Clemson Tigers' },
  'florida-state-seminoles': { pfrId: 'floridast', teamName: 'Florida State Seminoles' },
  'miami-hurricanes': { pfrId: 'miami(fl)', teamName: 'Miami Hurricanes' },
  'notre-dame-fighting-irish': { pfrId: 'notredame', teamName: 'Notre Dame Fighting Irish' },
  'north-carolina-tar-heels': { pfrId: 'nocarolina', teamName: 'North Carolina Tar Heels' },
  'nc-state-wolfpack': { pfrId: 'nocarolinast', teamName: 'NC State Wolfpack' },
  'virginia-tech-hokies': { pfrId: 'virginiatech', teamName: 'Virginia Tech Hokies' },
  'virginia-cavaliers': { pfrId: 'virginia', teamName: 'Virginia Cavaliers' },
  'duke-blue-devils': { pfrId: 'duke', teamName: 'Duke Blue Devils' },
  'wake-forest-demon-deacons': { pfrId: 'wakeforest', teamName: 'Wake Forest Demon Deacons' },
  'louisville-cardinals': { pfrId: 'louisville', teamName: 'Louisville Cardinals' },
  'pittsburgh-panthers': { pfrId: 'pittsburgh', teamName: 'Pittsburgh Panthers' },
  'syracuse-orange': { pfrId: 'syracuse', teamName: 'Syracuse Orange' },
  'boston-college-eagles': { pfrId: 'bostoncol', teamName: 'Boston College Eagles' },
  'georgia-tech-yellow-jackets': { pfrId: 'georgiatech', teamName: 'Georgia Tech Yellow Jackets' },
  'stanford-cardinal': { pfrId: 'stanford', teamName: 'Stanford Cardinal' },
  'california-golden-bears': { pfrId: 'california', teamName: 'California Golden Bears' },
  'smu-mustangs': { pfrId: 'smu', teamName: 'SMU Mustangs' },

  // Big 12
  'tcu-horned-frogs': { pfrId: 'tcu', teamName: 'TCU Horned Frogs' },
  'baylor-bears': { pfrId: 'baylor', teamName: 'Baylor Bears' },
  'texas-tech-red-raiders': { pfrId: 'texastech', teamName: 'Texas Tech Red Raiders' },
  'kansas-state-wildcats': { pfrId: 'kansasst', teamName: 'Kansas State Wildcats' },
  'kansas-jayhawks': { pfrId: 'kansas', teamName: 'Kansas Jayhawks' },
  'oklahoma-state-cowboys': { pfrId: 'oklahomast', teamName: 'Oklahoma State Cowboys' },
  'iowa-state-cyclones': { pfrId: 'iowast', teamName: 'Iowa State Cyclones' },
  'west-virginia-mountaineers': { pfrId: 'westvirginia', teamName: 'West Virginia Mountaineers' },
  'byu-cougars': { pfrId: 'byu', teamName: 'BYU Cougars' },
  'cincinnati-bearcats': { pfrId: 'cincinnati', teamName: 'Cincinnati Bearcats' },
  'ucf-knights': { pfrId: 'centralflorida', teamName: 'UCF Knights' },
  'houston-cougars': { pfrId: 'houston', teamName: 'Houston Cougars' },
  'arizona-wildcats': { pfrId: 'arizona', teamName: 'Arizona Wildcats' },
  'arizona-state-sun-devils': { pfrId: 'arizonast', teamName: 'Arizona State Sun Devils' },
  'colorado-buffaloes': { pfrId: 'colorado', teamName: 'Colorado Buffaloes' },
  'utah-utes': { pfrId: 'utah', teamName: 'Utah Utes' },

  // Pac-12 remaining
  'oregon-state-beavers': { pfrId: 'oregonst', teamName: 'Oregon State Beavers' },
  'washington-state-cougars': { pfrId: 'washingtonst', teamName: 'Washington State Cougars' },

  // Mountain West
  'boise-state-broncos': { pfrId: 'boisest', teamName: 'Boise State Broncos' },
  'fresno-state-bulldogs': { pfrId: 'fresnost', teamName: 'Fresno State Bulldogs' },
  'san-diego-state-aztecs': { pfrId: 'sandiegost', teamName: 'San Diego State Aztecs' },
  'unlv-rebels': { pfrId: 'unlv', teamName: 'UNLV Rebels' },
  'san-jose-state-spartans': { pfrId: 'sanjosest', teamName: 'San Jose State Spartans' },
  'air-force-falcons': { pfrId: 'airforce', teamName: 'Air Force Falcons' },
  'colorado-state-rams': { pfrId: 'coloradost', teamName: 'Colorado State Rams' },
  'wyoming-cowboys': { pfrId: 'wyoming', teamName: 'Wyoming Cowboys' },
  'new-mexico-lobos': { pfrId: 'newmexico', teamName: 'New Mexico Lobos' },
  'utah-state-aggies': { pfrId: 'utahst', teamName: 'Utah State Aggies' },
  'nevada-wolf-pack': { pfrId: 'nevadareno', teamName: 'Nevada Wolf Pack' },
  'hawaii-rainbow-warriors': { pfrId: 'hawaii', teamName: 'Hawaii Rainbow Warriors' },

  // American Athletic
  'memphis-tigers': { pfrId: 'memphis', teamName: 'Memphis Tigers' },
  'tulane-green-wave': { pfrId: 'tulane', teamName: 'Tulane Green Wave' },
  'usf-bulls': { pfrId: 'soflorida', teamName: 'USF Bulls' },
  'east-carolina-pirates': { pfrId: 'eastcarolina', teamName: 'East Carolina Pirates' },
  'temple-owls': { pfrId: 'temple', teamName: 'Temple Owls' },
  'tulsa-golden-hurricane': { pfrId: 'tulsa', teamName: 'Tulsa Golden Hurricane' },
  'navy-midshipmen': { pfrId: 'navy', teamName: 'Navy Midshipmen' },
  'army-black-knights': { pfrId: 'army', teamName: 'Army Black Knights' },
  'rice-owls': { pfrId: 'rice', teamName: 'Rice Owls' },
  'north-texas-mean-green': { pfrId: 'notexas', teamName: 'North Texas Mean Green' },
  'utsa-roadrunners': { pfrId: 'texassanantonio', teamName: 'UTSA Roadrunners' },
  'charlotte-49ers': { pfrId: 'charlotte', teamName: 'Charlotte 49ers' },
  'fau-owls': { pfrId: 'floridaatlantic', teamName: 'FAU Owls' },
  'uab-blazers': { pfrId: 'alabirmingham', teamName: 'UAB Blazers' },

  // Sun Belt
  'appalachian-state-mountaineers': { pfrId: 'appalachianst', teamName: 'Appalachian State Mountaineers' },
  'coastal-carolina-chanticleers': { pfrId: 'coastalcarolina', teamName: 'Coastal Carolina Chanticleers' },
  'marshall-thundering-herd': { pfrId: 'marshall', teamName: 'Marshall Thundering Herd' },
  'old-dominion-monarchs': { pfrId: 'olddominion', teamName: 'Old Dominion Monarchs' },
  'james-madison-dukes': { pfrId: 'jamesmadison', teamName: 'James Madison Dukes' },
  'georgia-state-panthers': { pfrId: 'georgiast', teamName: 'Georgia State Panthers' },
  'georgia-southern-eagles': { pfrId: 'georgiaso', teamName: 'Georgia Southern Eagles' },
  'troy-trojans': { pfrId: 'troy', teamName: 'Troy Trojans' },
  'south-alabama-jaguars': { pfrId: 'soalabama', teamName: 'South Alabama Jaguars' },
  'louisiana-ragin-cajuns': { pfrId: 'lalafayette', teamName: "Louisiana Ragin' Cajuns" },
  'louisiana-tech-bulldogs': { pfrId: 'louisianatech', teamName: 'Louisiana Tech Bulldogs' },
  'arkansas-state-red-wolves': { pfrId: 'arkansasst', teamName: 'Arkansas State Red Wolves' },
  'texas-state-bobcats': { pfrId: 'texasst', teamName: 'Texas State Bobcats' },
  'ul-monroe-warhawks': { pfrId: 'lamonroe', teamName: 'UL Monroe Warhawks' },
  'southern-miss-golden-eagles': { pfrId: 'somississippi', teamName: 'Southern Miss Golden Eagles' },

  // MAC
  'ohio-bobcats': { pfrId: 'ohio', teamName: 'Ohio Bobcats' },
  'miami-oh-redhawks': { pfrId: 'miami(oh)', teamName: 'Miami (OH) RedHawks' },
  'central-michigan-chippewas': { pfrId: 'centralmichigan', teamName: 'Central Michigan Chippewas' },
  'western-michigan-broncos': { pfrId: 'westmichigan', teamName: 'Western Michigan Broncos' },
  'toledo-rockets': { pfrId: 'toledo', teamName: 'Toledo Rockets' },
  'bowling-green-falcons': { pfrId: 'bowlinggreen', teamName: 'Bowling Green Falcons' },
  'buffalo-bulls': { pfrId: 'buffalo', teamName: 'Buffalo Bulls' },
  'akron-zips': { pfrId: 'akron', teamName: 'Akron Zips' },
  'kent-state-golden-flashes': { pfrId: 'kentst', teamName: 'Kent State Golden Flashes' },
  'ball-state-cardinals': { pfrId: 'ballst', teamName: 'Ball State Cardinals' },
  'eastern-michigan-eagles': { pfrId: 'eastmichigan', teamName: 'Eastern Michigan Eagles' },
  'northern-illinois-huskies': { pfrId: 'noillinois', teamName: 'Northern Illinois Huskies' },

  // Conference USA / Independents
  'liberty-flames': { pfrId: 'liberty', teamName: 'Liberty Flames' },
  'jacksonville-state-gamecocks': { pfrId: 'jacksonvillest', teamName: 'Jacksonville State Gamecocks' },
  'sam-houston-bearkats': { pfrId: 'samhoustonst', teamName: 'Sam Houston Bearkats' },
  'kennesaw-state-owls': { pfrId: 'kennesawst', teamName: 'Kennesaw State Owls' },
  'new-mexico-state-aggies': { pfrId: 'newmexicost', teamName: 'New Mexico State Aggies' },
  'middle-tennessee-blue-raiders': { pfrId: 'middletennst', teamName: 'Middle Tennessee Blue Raiders' },
  'western-kentucky-hilltoppers': { pfrId: 'westkentucky', teamName: 'Western Kentucky Hilltoppers' },
  'fiu-panthers': { pfrId: 'floridainternational', teamName: 'FIU Panthers' },
  'uconn-huskies': { pfrId: 'connecticut', teamName: 'UConn Huskies' },
  'umass-minutemen': { pfrId: 'massachusetts', teamName: 'UMass Minutemen' },
};

// Manually verified — skip these
const verifiedSlugs = new Set(['south-carolina-gamecocks']);

function parseDraftTable(html: string): DraftPick[] {
  const picks: DraftPick[] = [];
  const rowRegex = /<tr[^>]*>.*?<\/tr>/gs;
  const rows = html.match(rowRegex) || [];

  for (const row of rows) {
    if (!row.includes('data-stat="year_id"')) continue;

    const yearMatch = row.match(/data-stat="year_id"[^>]*><a[^>]*>(\d{4})<\/a>/);
    if (!yearMatch) continue;
    const year = parseInt(yearMatch[1]);
    if (year < 1967) continue;

    const roundMatch = row.match(/data-stat="draft_round"[^>]*>(\d+)<\/td>/);
    if (!roundMatch) continue;
    const round = parseInt(roundMatch[1]);

    const pickMatch = row.match(/data-stat="draft_pick"[^>]*>(\d+)<\/td>/);
    if (!pickMatch) continue;
    const pick = parseInt(pickMatch[1]);

    const teamMatch = row.match(/data-stat="team"[^>]*><a[^>]*title="([^"]+)"/);
    if (!teamMatch) continue;

    const playerMatch = row.match(/data-stat="player"[^>]*><a[^>]*>([^<]+)<\/a>/);
    if (!playerMatch) continue;

    const posMatch = row.match(/data-stat="pos"[^>]*>([A-Z*]+)<\/td>/);

    picks.push({
      year,
      round,
      pick,
      name: playerMatch[1],
      position: posMatch ? posMatch[1] : 'Unknown',
      nflTeam: teamMatch[1],
    });
  }

  picks.sort((a, b) => b.year - a.year || a.round - b.round || a.pick - b.pick);
  return picks;
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const startFrom = process.argv.find(a => a.startsWith('--start='))?.split('=')[1];
  const draftDir = path.join(process.cwd(), 'data', 'draft');

  console.log('Launching Chrome...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  // Warm up — visit PFR homepage first to get Cloudflare clearance
  console.log('Warming up (visiting PFR homepage)...');
  await page.goto('https://www.pro-football-reference.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await delay(3000);
  console.log('Warmed up. Starting team scrape...\n');

  const teams = Object.entries(pfbRefSchoolIds);
  let success = 0, failed = 0, skipped = 0;
  let startProcessing = !startFrom;

  for (const [slug, { pfrId, teamName }] of teams) {
    if (!startProcessing) {
      if (slug === startFrom) startProcessing = true;
      else continue;
    }

    if (verifiedSlugs.has(slug)) {
      console.log(`Skipping ${teamName} (manually verified)`);
      skipped++;
      continue;
    }

    const url = `https://www.pro-football-reference.com/schools/${pfrId}/drafted.htm`;
    console.log(`\nFetching ${teamName}...`);

    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      if (!response || response.status() !== 200) {
        console.error(`  HTTP ${response?.status()} — skipping`);
        failed++;
        await delay(5000);
        continue;
      }

      const html = await page.content();
      const picks = parseDraftTable(html);

      if (picks.length === 0) {
        console.log('  No picks found');
        failed++;
      } else {
        const years = picks.map(p => p.year);
        console.log(`  Found ${picks.length} picks (${Math.min(...years)}–${Math.max(...years)})`);

        const outputPath = path.join(draftDir, `${slug}.json`);
        const existing = fs.existsSync(outputPath)
          ? JSON.parse(fs.readFileSync(outputPath, 'utf-8'))
          : null;

        const data: DraftData = {
          teamId: existing?.teamId || pfrId,
          teamSlug: slug,
          teamName: existing?.teamName || teamName,
          draftPicks: picks,
        };

        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
        success++;
      }
    } catch (err) {
      console.error(`  Error: ${err}`);
      failed++;
    }

    // Polite delay: 8–12 seconds between requests
    await delay(8000 + Math.random() * 4000);
  }

  await browser.close();

  console.log('\n========================================');
  console.log(`Done! Success: ${success} | Failed: ${failed} | Skipped: ${skipped}`);

  // Spot-check a few
  for (const slug of ['alabama-crimson-tide', 'ohio-state-buckeyes', 'notre-dame-fighting-irish']) {
    if (fs.existsSync(path.join(draftDir, `${slug}.json`))) {
      const d = JSON.parse(fs.readFileSync(path.join(draftDir, `${slug}.json`), 'utf-8'));
      console.log(`  ${d.teamName}: ${d.draftPicks.length} picks`);
    }
  }
}

main().catch(console.error);
