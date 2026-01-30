import * as fs from 'fs';
import * as path from 'path';

interface YearlyRecord {
  year: number;
  wins: number;
  losses: number;
  confWins: number;
  confLosses: number;
  apPre: number | null;
  apPost: number | null;
  cfpFinal: number | null;
  coach: string;
  bowl: string | null;
}

interface HistoryData {
  teamId: string;
  teamSlug: string;
  teamName: string;
  yearlyRecords: YearlyRecord[];
}

// Sports Reference school ID mappings (slug -> SR ID)
// These are the URL paths used on sports-reference.com/cfb/schools/
const sportsRefSchoolIds: Record<string, { srId: string; teamName: string }> = {
  // SEC
  'alabama-crimson-tide': { srId: 'alabama', teamName: 'Alabama Crimson Tide' },
  'georgia-bulldogs': { srId: 'georgia', teamName: 'Georgia Bulldogs' },
  'lsu-tigers': { srId: 'louisiana-state', teamName: 'LSU Tigers' },
  'auburn-tigers': { srId: 'auburn', teamName: 'Auburn Tigers' },
  'tennessee-volunteers': { srId: 'tennessee', teamName: 'Tennessee Volunteers' },
  'texas-am-aggies': { srId: 'texas-am', teamName: 'Texas A&M Aggies' },
  'florida-gators': { srId: 'florida', teamName: 'Florida Gators' },
  'ole-miss-rebels': { srId: 'mississippi', teamName: 'Ole Miss Rebels' },
  'arkansas-razorbacks': { srId: 'arkansas', teamName: 'Arkansas Razorbacks' },
  'kentucky-wildcats': { srId: 'kentucky', teamName: 'Kentucky Wildcats' },
  'mississippi-state-bulldogs': { srId: 'mississippi-state', teamName: 'Mississippi State Bulldogs' },
  'missouri-tigers': { srId: 'missouri', teamName: 'Missouri Tigers' },
  'south-carolina-gamecocks': { srId: 'south-carolina', teamName: 'South Carolina Gamecocks' },
  'vanderbilt-commodores': { srId: 'vanderbilt', teamName: 'Vanderbilt Commodores' },
  'texas-longhorns': { srId: 'texas', teamName: 'Texas Longhorns' },
  'oklahoma-sooners': { srId: 'oklahoma', teamName: 'Oklahoma Sooners' },

  // Big Ten
  'ohio-state-buckeyes': { srId: 'ohio-state', teamName: 'Ohio State Buckeyes' },
  'michigan-wolverines': { srId: 'michigan', teamName: 'Michigan Wolverines' },
  'penn-state-nittany-lions': { srId: 'penn-state', teamName: 'Penn State Nittany Lions' },
  'wisconsin-badgers': { srId: 'wisconsin', teamName: 'Wisconsin Badgers' },
  'iowa-hawkeyes': { srId: 'iowa', teamName: 'Iowa Hawkeyes' },
  'michigan-state-spartans': { srId: 'michigan-state', teamName: 'Michigan State Spartans' },
  'minnesota-golden-gophers': { srId: 'minnesota', teamName: 'Minnesota Golden Gophers' },
  'illinois-fighting-illini': { srId: 'illinois', teamName: 'Illinois Fighting Illini' },
  'indiana-hoosiers': { srId: 'indiana', teamName: 'Indiana Hoosiers' },
  'purdue-boilermakers': { srId: 'purdue', teamName: 'Purdue Boilermakers' },
  'nebraska-cornhuskers': { srId: 'nebraska', teamName: 'Nebraska Cornhuskers' },
  'northwestern-wildcats': { srId: 'northwestern', teamName: 'Northwestern Wildcats' },
  'maryland-terrapins': { srId: 'maryland', teamName: 'Maryland Terrapins' },
  'rutgers-scarlet-knights': { srId: 'rutgers', teamName: 'Rutgers Scarlet Knights' },
  'oregon-ducks': { srId: 'oregon', teamName: 'Oregon Ducks' },
  'usc-trojans': { srId: 'southern-california', teamName: 'USC Trojans' },
  'washington-huskies': { srId: 'washington', teamName: 'Washington Huskies' },
  'ucla-bruins': { srId: 'ucla', teamName: 'UCLA Bruins' },

  // ACC
  'clemson-tigers': { srId: 'clemson', teamName: 'Clemson Tigers' },
  'florida-state-seminoles': { srId: 'florida-state', teamName: 'Florida State Seminoles' },
  'miami-hurricanes': { srId: 'miami-fl', teamName: 'Miami Hurricanes' },
  'notre-dame-fighting-irish': { srId: 'notre-dame', teamName: 'Notre Dame Fighting Irish' },
  'north-carolina-tar-heels': { srId: 'north-carolina', teamName: 'North Carolina Tar Heels' },
  'nc-state-wolfpack': { srId: 'north-carolina-state', teamName: 'NC State Wolfpack' },
  'virginia-tech-hokies': { srId: 'virginia-tech', teamName: 'Virginia Tech Hokies' },
  'virginia-cavaliers': { srId: 'virginia', teamName: 'Virginia Cavaliers' },
  'duke-blue-devils': { srId: 'duke', teamName: 'Duke Blue Devils' },
  'wake-forest-demon-deacons': { srId: 'wake-forest', teamName: 'Wake Forest Demon Deacons' },
  'louisville-cardinals': { srId: 'louisville', teamName: 'Louisville Cardinals' },
  'pittsburgh-panthers': { srId: 'pittsburgh', teamName: 'Pittsburgh Panthers' },
  'syracuse-orange': { srId: 'syracuse', teamName: 'Syracuse Orange' },
  'boston-college-eagles': { srId: 'boston-college', teamName: 'Boston College Eagles' },
  'georgia-tech-yellow-jackets': { srId: 'georgia-tech', teamName: 'Georgia Tech Yellow Jackets' },
  'stanford-cardinal': { srId: 'stanford', teamName: 'Stanford Cardinal' },
  'california-golden-bears': { srId: 'california', teamName: 'California Golden Bears' },
  'smu-mustangs': { srId: 'southern-methodist', teamName: 'SMU Mustangs' },

  // Big 12
  'tcu-horned-frogs': { srId: 'texas-christian', teamName: 'TCU Horned Frogs' },
  'baylor-bears': { srId: 'baylor', teamName: 'Baylor Bears' },
  'texas-tech-red-raiders': { srId: 'texas-tech', teamName: 'Texas Tech Red Raiders' },
  'kansas-state-wildcats': { srId: 'kansas-state', teamName: 'Kansas State Wildcats' },
  'kansas-jayhawks': { srId: 'kansas', teamName: 'Kansas Jayhawks' },
  'oklahoma-state-cowboys': { srId: 'oklahoma-state', teamName: 'Oklahoma State Cowboys' },
  'iowa-state-cyclones': { srId: 'iowa-state', teamName: 'Iowa State Cyclones' },
  'west-virginia-mountaineers': { srId: 'west-virginia', teamName: 'West Virginia Mountaineers' },
  'byu-cougars': { srId: 'brigham-young', teamName: 'BYU Cougars' },
  'cincinnati-bearcats': { srId: 'cincinnati', teamName: 'Cincinnati Bearcats' },
  'ucf-knights': { srId: 'central-florida', teamName: 'UCF Knights' },
  'houston-cougars': { srId: 'houston', teamName: 'Houston Cougars' },
  'arizona-wildcats': { srId: 'arizona', teamName: 'Arizona Wildcats' },
  'arizona-state-sun-devils': { srId: 'arizona-state', teamName: 'Arizona State Sun Devils' },
  'colorado-buffaloes': { srId: 'colorado', teamName: 'Colorado Buffaloes' },
  'utah-utes': { srId: 'utah', teamName: 'Utah Utes' },

  // Pac-12 (remaining)
  'oregon-state-beavers': { srId: 'oregon-state', teamName: 'Oregon State Beavers' },
  'washington-state-cougars': { srId: 'washington-state', teamName: 'Washington State Cougars' },

  // Mountain West
  'boise-state-broncos': { srId: 'boise-state', teamName: 'Boise State Broncos' },
  'fresno-state-bulldogs': { srId: 'fresno-state', teamName: 'Fresno State Bulldogs' },
  'san-diego-state-aztecs': { srId: 'san-diego-state', teamName: 'San Diego State Aztecs' },
  'unlv-rebels': { srId: 'nevada-las-vegas', teamName: 'UNLV Rebels' },
  'san-jose-state-spartans': { srId: 'san-jose-state', teamName: 'San Jose State Spartans' },
  'air-force-falcons': { srId: 'air-force', teamName: 'Air Force Falcons' },
  'colorado-state-rams': { srId: 'colorado-state', teamName: 'Colorado State Rams' },
  'wyoming-cowboys': { srId: 'wyoming', teamName: 'Wyoming Cowboys' },
  'new-mexico-lobos': { srId: 'new-mexico', teamName: 'New Mexico Lobos' },
  'utah-state-aggies': { srId: 'utah-state', teamName: 'Utah State Aggies' },
  'nevada-wolf-pack': { srId: 'nevada', teamName: 'Nevada Wolf Pack' },
  'hawaii-rainbow-warriors': { srId: 'hawaii', teamName: 'Hawaii Rainbow Warriors' },

  // American Athletic
  'memphis-tigers': { srId: 'memphis', teamName: 'Memphis Tigers' },
  'tulane-green-wave': { srId: 'tulane', teamName: 'Tulane Green Wave' },
  'usf-bulls': { srId: 'south-florida', teamName: 'USF Bulls' },
  'east-carolina-pirates': { srId: 'east-carolina', teamName: 'East Carolina Pirates' },
  'temple-owls': { srId: 'temple', teamName: 'Temple Owls' },
  'tulsa-golden-hurricane': { srId: 'tulsa', teamName: 'Tulsa Golden Hurricane' },
  'navy-midshipmen': { srId: 'navy', teamName: 'Navy Midshipmen' },
  'army-black-knights': { srId: 'army', teamName: 'Army Black Knights' },
  'rice-owls': { srId: 'rice', teamName: 'Rice Owls' },
  'north-texas-mean-green': { srId: 'north-texas', teamName: 'North Texas Mean Green' },
  'utsa-roadrunners': { srId: 'texas-san-antonio', teamName: 'UTSA Roadrunners' },
  'charlotte-49ers': { srId: 'charlotte', teamName: 'Charlotte 49ers' },
  'fau-owls': { srId: 'florida-atlantic', teamName: 'FAU Owls' },
  'uab-blazers': { srId: 'alabama-birmingham', teamName: 'UAB Blazers' },

  // Sun Belt
  'appalachian-state-mountaineers': { srId: 'appalachian-state', teamName: 'Appalachian State Mountaineers' },
  'coastal-carolina-chanticleers': { srId: 'coastal-carolina', teamName: 'Coastal Carolina Chanticleers' },
  'marshall-thundering-herd': { srId: 'marshall', teamName: 'Marshall Thundering Herd' },
  'old-dominion-monarchs': { srId: 'old-dominion', teamName: 'Old Dominion Monarchs' },
  'james-madison-dukes': { srId: 'james-madison', teamName: 'James Madison Dukes' },
  'georgia-state-panthers': { srId: 'georgia-state', teamName: 'Georgia State Panthers' },
  'georgia-southern-eagles': { srId: 'georgia-southern', teamName: 'Georgia Southern Eagles' },
  'troy-trojans': { srId: 'troy', teamName: 'Troy Trojans' },
  'south-alabama-jaguars': { srId: 'south-alabama', teamName: 'South Alabama Jaguars' },
  'louisiana-ragin-cajuns': { srId: 'louisiana-lafayette', teamName: 'Louisiana Ragin\' Cajuns' },
  'louisiana-tech-bulldogs': { srId: 'louisiana-tech', teamName: 'Louisiana Tech Bulldogs' },
  'arkansas-state-red-wolves': { srId: 'arkansas-state', teamName: 'Arkansas State Red Wolves' },
  'texas-state-bobcats': { srId: 'texas-state', teamName: 'Texas State Bobcats' },
  'ul-monroe-warhawks': { srId: 'louisiana-monroe', teamName: 'UL Monroe Warhawks' },
  'southern-miss-golden-eagles': { srId: 'southern-mississippi', teamName: 'Southern Miss Golden Eagles' },

  // MAC
  'ohio-bobcats': { srId: 'ohio', teamName: 'Ohio Bobcats' },
  'miami-oh-redhawks': { srId: 'miami-oh', teamName: 'Miami (OH) RedHawks' },
  'central-michigan-chippewas': { srId: 'central-michigan', teamName: 'Central Michigan Chippewas' },
  'western-michigan-broncos': { srId: 'western-michigan', teamName: 'Western Michigan Broncos' },
  'toledo-rockets': { srId: 'toledo', teamName: 'Toledo Rockets' },
  'bowling-green-falcons': { srId: 'bowling-green-state', teamName: 'Bowling Green Falcons' },
  'buffalo-bulls': { srId: 'buffalo', teamName: 'Buffalo Bulls' },
  'akron-zips': { srId: 'akron', teamName: 'Akron Zips' },
  'kent-state-golden-flashes': { srId: 'kent-state', teamName: 'Kent State Golden Flashes' },
  'ball-state-cardinals': { srId: 'ball-state', teamName: 'Ball State Cardinals' },
  'eastern-michigan-eagles': { srId: 'eastern-michigan', teamName: 'Eastern Michigan Eagles' },
  'northern-illinois-huskies': { srId: 'northern-illinois', teamName: 'Northern Illinois Huskies' },

  // Conference USA
  'liberty-flames': { srId: 'liberty', teamName: 'Liberty Flames' },
  'jacksonville-state-gamecocks': { srId: 'jacksonville-state', teamName: 'Jacksonville State Gamecocks' },
  'sam-houston-bearkats': { srId: 'sam-houston-state', teamName: 'Sam Houston Bearkats' },
  'kennesaw-state-owls': { srId: 'kennesaw-state', teamName: 'Kennesaw State Owls' },
  'new-mexico-state-aggies': { srId: 'new-mexico-state', teamName: 'New Mexico State Aggies' },
  'middle-tennessee-blue-raiders': { srId: 'middle-tennessee-state', teamName: 'Middle Tennessee Blue Raiders' },
  'western-kentucky-hilltoppers': { srId: 'western-kentucky', teamName: 'Western Kentucky Hilltoppers' },
  'fiu-panthers': { srId: 'florida-international', teamName: 'FIU Panthers' },

  // Independents
  'uconn-huskies': { srId: 'connecticut', teamName: 'UConn Huskies' },
  'umass-minutemen': { srId: 'massachusetts', teamName: 'UMass Minutemen' },
};

async function fetchHistoryData(schoolId: string): Promise<string | null> {
  const url = `https://www.sports-reference.com/cfb/schools/${schoolId}/index.html`;

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

function parseYearlyRecords(html: string, minYear: number = 1950): YearlyRecord[] {
  const records: YearlyRecord[] = [];

  // Match each table row - the rows span multiple lines
  const rowRegex = /<tr\s*>.*?<\/tr>/gs;
  const rows = html.match(rowRegex) || [];

  console.log(`Found ${rows.length} total rows in HTML`);

  for (const row of rows) {
    // Skip header rows and non-data rows
    if (!row.includes('data-stat="year_id"')) continue;
    // Skip header repetition rows
    if (row.includes('class="thead"')) continue;

    // Extract year - it's inside an anchor tag or directly in the cell
    const yearMatch = row.match(/data-stat="year_id"[^>]*>(?:<a[^>]*>)?(\d{4})(?:<\/a>)?<\/td>/);
    if (!yearMatch) continue;
    const year = parseInt(yearMatch[1]);

    // Skip years before minYear
    if (year < minYear) continue;

    // Extract overall wins and losses
    const winsMatch = row.match(/data-stat="wins"[^>]*>(\d+)<\/td>/);
    const lossesMatch = row.match(/data-stat="losses"[^>]*>(\d+)<\/td>/);
    if (!winsMatch || !lossesMatch) continue;
    const wins = parseInt(winsMatch[1]);
    const losses = parseInt(lossesMatch[1]);

    // Extract conference record (wins_conf and losses_conf)
    const confWinsMatch = row.match(/data-stat="wins_conf"[^>]*>(\d*)<\/td>/);
    const confLossesMatch = row.match(/data-stat="losses_conf"[^>]*>(\d*)<\/td>/);
    const confWins = confWinsMatch && confWinsMatch[1] ? parseInt(confWinsMatch[1]) : 0;
    const confLosses = confLossesMatch && confLossesMatch[1] ? parseInt(confLossesMatch[1]) : 0;

    // Extract AP Pre ranking (rank_pre) - values like "999" mean unranked
    const apPreMatch = row.match(/data-stat="rank_pre"[^>]*>(\d*)<\/td>/);
    let apPre: number | null = null;
    if (apPreMatch && apPreMatch[1]) {
      const val = parseInt(apPreMatch[1]);
      apPre = val < 100 ? val : null; // 999 means unranked
    }

    // Extract AP Post (Final) ranking (rank_final)
    const apPostMatch = row.match(/data-stat="rank_final"[^>]*>(\d*)<\/td>/);
    let apPost: number | null = null;
    if (apPostMatch && apPostMatch[1]) {
      const val = parseInt(apPostMatch[1]);
      apPost = val < 100 ? val : null;
    }

    // Extract CFP Final ranking
    const cfpFinalMatch = row.match(/data-stat="cfp_final"[^>]*>(\d*)<\/td>/);
    let cfpFinal: number | null = null;
    if (cfpFinalMatch && cfpFinalMatch[1]) {
      const val = parseInt(cfpFinalMatch[1]);
      cfpFinal = val < 100 ? val : null;
    }

    // Extract coach name(s) - in format: <a href="...">Nick Saban</a> (12-2)
    const coachMatch = row.match(/data-stat="coaches"[^>]*>(.*?)<\/td>/s);
    let coach = 'Unknown';
    if (coachMatch && coachMatch[1]) {
      // Extract text and clean up
      let coachText = coachMatch[1]
        .replace(/<a[^>]*>([^<]+)<\/a>/g, '$1')  // Extract link text
        .replace(/\s*\(\d+-\d+(?:-\d+)?\)/g, '')  // Remove records like (12-2) or (9-3-1)
        .replace(/,\s*/g, ' / ')  // Replace commas with slash for multiple coaches
        .trim();
      if (coachText) {
        coach = coachText;
      }
    }

    // Extract bowl game (bowl_name) - contains anchor with bowl name and (W) or (L)
    const bowlMatch = row.match(/data-stat="bowl_name"[^>]*>(.*?)<\/td>/s);
    let bowl: string | null = null;
    if (bowlMatch && bowlMatch[1]) {
      const bowlContent = bowlMatch[1].trim();
      // Skip if it's empty or just "ZZZ" (placeholder for no bowl)
      if (bowlContent && !bowlContent.includes('csk="ZZZ')) {
        // Extract the last bowl game (for CFP years, there may be multiple)
        // Format: <a href="...">Sugar Bowl</a> <strong>(W)</strong>
        const bowlParts = bowlContent.split(/,\s*/);
        const lastBowl = bowlParts[bowlParts.length - 1];

        // Extract bowl name and result
        const bowlNameMatch = lastBowl.match(/<a[^>]*>([^<]+)<\/a>/);
        const resultMatch = lastBowl.match(/\(([WL])\)/);

        if (bowlNameMatch) {
          let bowlName = bowlNameMatch[1].trim();
          // Simplify some bowl names
          bowlName = bowlName.replace('College Football Playoff National Championship', 'CFP National Championship')
                           .replace('College Football Playoff - First Round', 'CFP First Round');
          if (resultMatch) {
            bowl = `${bowlName} (${resultMatch[1]})`;
          } else {
            bowl = bowlName;
          }
        }
      }
    }

    records.push({
      year,
      wins,
      losses,
      confWins,
      confLosses,
      apPre,
      apPost,
      cfpFinal,
      coach,
      bowl
    });
  }

  // Sort by year (most recent first)
  records.sort((a, b) => b.year - a.year);

  return records;
}

async function fetchTeamHistoryData(slug: string, srId: string, teamName: string): Promise<number> {
  console.log(`\nFetching ${teamName}...`);

  const html = await fetchHistoryData(srId);
  if (!html) {
    console.error(`  Failed to fetch HTML for ${srId}`);
    return 0;
  }

  const records = parseYearlyRecords(html, 1950);

  if (records.length === 0) {
    console.log(`  No records found`);
    return 0;
  }

  // Show year range
  const years = records.map(r => r.year);
  const minYearFound = Math.min(...years);
  const maxYearFound = Math.max(...years);
  console.log(`  Found ${records.length} seasons (${minYearFound}-${maxYearFound})`);

  // Read existing data to get teamId
  const existingPath = path.join(process.cwd(), 'data', 'history', `${slug}.json`);
  let teamId = srId;
  if (fs.existsSync(existingPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(existingPath, 'utf-8'));
      teamId = existing.teamId || srId;
    } catch {
      // Use srId as fallback
    }
  }

  // Save to history file
  const historyData: HistoryData = {
    teamId,
    teamSlug: slug,
    teamName: teamName,
    yearlyRecords: records
  };

  const outputPath = path.join(process.cwd(), 'data', 'history', `${slug}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(historyData, null, 2));

  return records.length;
}

// Delay helper to avoid rate limiting
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function hasFullData(slug: string): boolean {
  const filePath = path.join(process.cwd(), 'data', 'history', `${slug}.json`);
  if (!fs.existsSync(filePath)) return false;

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    // Consider it "full" if it has records from before 1960
    if (data.yearlyRecords && data.yearlyRecords.length > 0) {
      const years = data.yearlyRecords.map((r: YearlyRecord) => r.year);
      const minYear = Math.min(...years);
      return minYear < 1960; // Has historical data back to at least 1960
    }
  } catch {
    return false;
  }
  return false;
}

async function main() {
  const teams = Object.entries(sportsRefSchoolIds);
  const skipExisting = process.argv.includes('--skip-existing');
  const startFrom = process.argv.find(a => a.startsWith('--start='))?.split('=')[1];
  const singleTeam = process.argv.find(a => a.startsWith('--team='))?.split('=')[1];

  if (singleTeam) {
    const teamEntry = teams.find(([slug]) => slug === singleTeam);
    if (!teamEntry) {
      console.error(`Team not found: ${singleTeam}`);
      return;
    }
    const [slug, { srId, teamName }] = teamEntry;
    await fetchTeamHistoryData(slug, srId, teamName);
    return;
  }

  console.log(`Processing ${teams.length} teams...`);
  if (skipExisting) console.log('Skipping teams with existing full data');
  if (startFrom) console.log(`Starting from: ${startFrom}`);
  console.log('');

  let totalSeasons = 0;
  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;
  let startProcessing = !startFrom;

  for (const [slug, { srId, teamName }] of teams) {
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
      const seasonCount = await fetchTeamHistoryData(slug, srId, teamName);
      if (seasonCount > 0) {
        totalSeasons += seasonCount;
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
  console.log(`Total seasons: ${totalSeasons}`);
  if (skippedCount > 0) console.log(`Skipped: ${skippedCount} teams (already had data)`);
  if (failCount > 0) console.log(`Failed: ${failCount} teams`);
}

main().catch(console.error);
