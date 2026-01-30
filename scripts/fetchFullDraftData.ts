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

// Pro Football Reference school ID mappings (slug -> PFR ID)
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
  'south-carolina-gamecocks': { pfrId: 'socarolina', teamName: 'South Carolina Gamecocks' },
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

  // Pac-12 (remaining)
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
  'louisiana-ragin-cajuns': { pfrId: 'lalafayette', teamName: 'Louisiana Ragin\' Cajuns' },
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

  // Conference USA
  'liberty-flames': { pfrId: 'liberty', teamName: 'Liberty Flames' },
  'jacksonville-state-gamecocks': { pfrId: 'jacksonvillest', teamName: 'Jacksonville State Gamecocks' },
  'sam-houston-bearkats': { pfrId: 'samhoustonst', teamName: 'Sam Houston Bearkats' },
  'kennesaw-state-owls': { pfrId: 'kennesawst', teamName: 'Kennesaw State Owls' },
  'new-mexico-state-aggies': { pfrId: 'newmexicost', teamName: 'New Mexico State Aggies' },
  'middle-tennessee-blue-raiders': { pfrId: 'middletennst', teamName: 'Middle Tennessee Blue Raiders' },
  'western-kentucky-hilltoppers': { pfrId: 'westkentucky', teamName: 'Western Kentucky Hilltoppers' },
  'fiu-panthers': { pfrId: 'floridainternational', teamName: 'FIU Panthers' },

  // Independents
  'uconn-huskies': { pfrId: 'connecticut', teamName: 'UConn Huskies' },
  'umass-minutemen': { pfrId: 'massachusetts', teamName: 'UMass Minutemen' },
};

async function fetchDraftData(schoolId: string): Promise<string | null> {
  const url = `https://www.pro-football-reference.com/schools/${schoolId}/drafted.htm`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return null;
    }
    return await response.text();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}

function parseDraftPicks(html: string, minYear: number = 1967): DraftPick[] {
  const picks: DraftPick[] = [];

  // Match each table row - the rows span multiple lines
  const rowRegex = /<tr\s*>.*?<\/tr>/gs;
  const rows = html.match(rowRegex) || [];

  console.log(`Found ${rows.length} total rows in HTML`);

  for (const row of rows) {
    if (!row.includes('data-stat="year_id"')) continue;

    // Extract year - it's inside an anchor tag: <td ... data-stat="year_id" ><a href="...">2025</a></td>
    const yearMatch = row.match(/data-stat="year_id"[^>]*><a[^>]*>(\d{4})<\/a>/);
    if (!yearMatch) continue;
    const year = parseInt(yearMatch[1]);

    // Skip years before minYear
    if (year < minYear) continue;

    // Extract round - format: <td ... data-stat="draft_round" ...>1</td>
    const roundMatch = row.match(/data-stat="draft_round"[^>]*>(\d+)<\/td>/);
    if (!roundMatch) continue;
    const round = parseInt(roundMatch[1]);

    // Extract pick - format: <td ... data-stat="draft_pick" >12</td>
    const pickMatch = row.match(/data-stat="draft_pick"[^>]*>(\d+)<\/td>/);
    if (!pickMatch) continue;
    const pick = parseInt(pickMatch[1]);

    // Extract NFL team from title attribute: <a href="..." title="Dallas Cowboys">DAL</a>
    const teamMatch = row.match(/data-stat="team"[^>]*><a[^>]*title="([^"]+)"/);
    if (!teamMatch) continue;
    const nflTeam = teamMatch[1];

    // Extract player name - inside anchor: <td ... data-stat="player" ...><a href="...">Tyler Booker</a></td>
    const playerMatch = row.match(/data-stat="player"[^>]*><a[^>]*>([^<]+)<\/a>/);
    if (!playerMatch) continue;
    const name = playerMatch[1];

    // Extract position - format: <td ... data-stat="pos" ...>OL</td>
    const posMatch = row.match(/data-stat="pos"[^>]*>([A-Z]+)<\/td>/);
    const position = posMatch ? posMatch[1] : 'Unknown';

    picks.push({
      year,
      round,
      pick,
      name,
      position,
      nflTeam
    });
  }

  // Sort by year (desc), then round, then pick
  picks.sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    if (a.round !== b.round) return a.round - b.round;
    return a.pick - b.pick;
  });

  return picks;
}

async function fetchTeamDraftData(slug: string, pfrId: string, teamName: string): Promise<number> {
  console.log(`\nFetching ${teamName}...`);

  const html = await fetchDraftData(pfrId);
  if (!html) {
    console.error(`  Failed to fetch HTML for ${pfrId}`);
    return 0;
  }

  const picks = parseDraftPicks(html, 1967);

  if (picks.length === 0) {
    console.log(`  No picks found`);
    return 0;
  }

  // Show year range
  const years = picks.map(p => p.year);
  const minYearFound = Math.min(...years);
  const maxYearFound = Math.max(...years);
  console.log(`  Found ${picks.length} picks (${minYearFound}-${maxYearFound})`);

  // Save to draft file
  const draftData: DraftData = {
    teamId: pfrId,
    teamSlug: slug,
    teamName: teamName,
    draftPicks: picks
  };

  const outputPath = path.join(process.cwd(), 'data', 'draft', `${slug}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(draftData, null, 2));

  return picks.length;
}

// Delay helper to avoid rate limiting
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function hasFullData(slug: string): boolean {
  const filePath = path.join(process.cwd(), 'data', 'draft', `${slug}.json`);
  if (!fs.existsSync(filePath)) return false;

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    // Consider it "full" if it has picks from before 2000
    if (data.draftPicks && data.draftPicks.length > 0) {
      const years = data.draftPicks.map((p: DraftPick) => p.year);
      const minYear = Math.min(...years);
      return minYear < 2000; // Has historical data
    }
  } catch {
    return false;
  }
  return false;
}

async function main() {
  const teams = Object.entries(pfbRefSchoolIds);
  const skipExisting = process.argv.includes('--skip-existing');
  const startFrom = process.argv.find(a => a.startsWith('--start='))?.split('=')[1];

  console.log(`Processing ${teams.length} teams...`);
  if (skipExisting) console.log('Skipping teams with existing full data');
  if (startFrom) console.log(`Starting from: ${startFrom}`);
  console.log('');

  let totalPicks = 0;
  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;
  let startProcessing = !startFrom;

  for (const [slug, { pfrId, teamName }] of teams) {
    // Handle --start= flag
    if (!startProcessing) {
      if (slug === startFrom) {
        startProcessing = true;
      } else {
        continue;
      }
    }

    // Skip if we already have full data
    if (skipExisting && hasFullData(slug)) {
      console.log(`Skipping ${teamName} (already has full data)`);
      skippedCount++;
      continue;
    }

    try {
      const pickCount = await fetchTeamDraftData(slug, pfrId, teamName);
      if (pickCount > 0) {
        totalPicks += pickCount;
        successCount++;
      } else {
        failCount++;
      }
      // Longer delay between requests to avoid rate limiting (10-15 seconds with randomization)
      await delay(10000 + Math.random() * 5000);
    } catch (error) {
      console.error(`  Error processing ${slug}:`, error);
      failCount++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Done! Processed ${successCount} teams successfully.`);
  console.log(`Total picks: ${totalPicks}`);
  if (skippedCount > 0) console.log(`Skipped: ${skippedCount} teams (already had data)`);
  if (failCount > 0) console.log(`Failed: ${failCount} teams`);
}

main().catch(console.error);
