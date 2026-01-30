/**
 * Script to fetch yearly records from Sports Reference for all FBS teams
 * Run with: npx tsx scripts/fetchTeamHistory.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Sports Reference URL mapping for each team
const sportsRefMapping: Record<string, { sportsRef: string; teamName: string }> = {
  // SEC
  'alabama-crimson-tide': { sportsRef: 'alabama', teamName: 'Alabama Crimson Tide' },
  'arkansas-razorbacks': { sportsRef: 'arkansas', teamName: 'Arkansas Razorbacks' },
  'auburn-tigers': { sportsRef: 'auburn', teamName: 'Auburn Tigers' },
  'florida-gators': { sportsRef: 'florida', teamName: 'Florida Gators' },
  'georgia-bulldogs': { sportsRef: 'georgia', teamName: 'Georgia Bulldogs' },
  'kentucky-wildcats': { sportsRef: 'kentucky', teamName: 'Kentucky Wildcats' },
  'lsu-tigers': { sportsRef: 'lsu', teamName: 'LSU Tigers' },
  'ole-miss-rebels': { sportsRef: 'mississippi', teamName: 'Ole Miss Rebels' },
  'mississippi-state-bulldogs': { sportsRef: 'mississippi-state', teamName: 'Mississippi State Bulldogs' },
  'missouri-tigers': { sportsRef: 'missouri', teamName: 'Missouri Tigers' },
  'oklahoma-sooners': { sportsRef: 'oklahoma', teamName: 'Oklahoma Sooners' },
  'south-carolina-gamecocks': { sportsRef: 'south-carolina', teamName: 'South Carolina Gamecocks' },
  'tennessee-volunteers': { sportsRef: 'tennessee', teamName: 'Tennessee Volunteers' },
  'texas-longhorns': { sportsRef: 'texas', teamName: 'Texas Longhorns' },
  'texas-am-aggies': { sportsRef: 'texas-am', teamName: 'Texas A&M Aggies' },
  'vanderbilt-commodores': { sportsRef: 'vanderbilt', teamName: 'Vanderbilt Commodores' },

  // Big Ten
  'illinois-fighting-illini': { sportsRef: 'illinois', teamName: 'Illinois Fighting Illini' },
  'indiana-hoosiers': { sportsRef: 'indiana', teamName: 'Indiana Hoosiers' },
  'iowa-hawkeyes': { sportsRef: 'iowa', teamName: 'Iowa Hawkeyes' },
  'maryland-terrapins': { sportsRef: 'maryland', teamName: 'Maryland Terrapins' },
  'michigan-wolverines': { sportsRef: 'michigan', teamName: 'Michigan Wolverines' },
  'michigan-state-spartans': { sportsRef: 'michigan-state', teamName: 'Michigan State Spartans' },
  'minnesota-golden-gophers': { sportsRef: 'minnesota', teamName: 'Minnesota Golden Gophers' },
  'nebraska-cornhuskers': { sportsRef: 'nebraska', teamName: 'Nebraska Cornhuskers' },
  'northwestern-wildcats': { sportsRef: 'northwestern', teamName: 'Northwestern Wildcats' },
  'ohio-state-buckeyes': { sportsRef: 'ohio-state', teamName: 'Ohio State Buckeyes' },
  'oregon-ducks': { sportsRef: 'oregon', teamName: 'Oregon Ducks' },
  'penn-state-nittany-lions': { sportsRef: 'penn-state', teamName: 'Penn State Nittany Lions' },
  'purdue-boilermakers': { sportsRef: 'purdue', teamName: 'Purdue Boilermakers' },
  'rutgers-scarlet-knights': { sportsRef: 'rutgers', teamName: 'Rutgers Scarlet Knights' },
  'ucla-bruins': { sportsRef: 'ucla', teamName: 'UCLA Bruins' },
  'usc-trojans': { sportsRef: 'southern-california', teamName: 'USC Trojans' },
  'washington-huskies': { sportsRef: 'washington', teamName: 'Washington Huskies' },
  'wisconsin-badgers': { sportsRef: 'wisconsin', teamName: 'Wisconsin Badgers' },

  // Big 12
  'arizona-wildcats': { sportsRef: 'arizona', teamName: 'Arizona Wildcats' },
  'arizona-state-sun-devils': { sportsRef: 'arizona-state', teamName: 'Arizona State Sun Devils' },
  'baylor-bears': { sportsRef: 'baylor', teamName: 'Baylor Bears' },
  'byu-cougars': { sportsRef: 'brigham-young', teamName: 'BYU Cougars' },
  'cincinnati-bearcats': { sportsRef: 'cincinnati', teamName: 'Cincinnati Bearcats' },
  'colorado-buffaloes': { sportsRef: 'colorado', teamName: 'Colorado Buffaloes' },
  'houston-cougars': { sportsRef: 'houston', teamName: 'Houston Cougars' },
  'iowa-state-cyclones': { sportsRef: 'iowa-state', teamName: 'Iowa State Cyclones' },
  'kansas-jayhawks': { sportsRef: 'kansas', teamName: 'Kansas Jayhawks' },
  'kansas-state-wildcats': { sportsRef: 'kansas-state', teamName: 'Kansas State Wildcats' },
  'oklahoma-state-cowboys': { sportsRef: 'oklahoma-state', teamName: 'Oklahoma State Cowboys' },
  'tcu-horned-frogs': { sportsRef: 'texas-christian', teamName: 'TCU Horned Frogs' },
  'texas-tech-red-raiders': { sportsRef: 'texas-tech', teamName: 'Texas Tech Red Raiders' },
  'ucf-knights': { sportsRef: 'central-florida', teamName: 'UCF Knights' },
  'utah-utes': { sportsRef: 'utah', teamName: 'Utah Utes' },
  'west-virginia-mountaineers': { sportsRef: 'west-virginia', teamName: 'West Virginia Mountaineers' },

  // ACC
  'boston-college-eagles': { sportsRef: 'boston-college', teamName: 'Boston College Eagles' },
  'california-golden-bears': { sportsRef: 'california', teamName: 'California Golden Bears' },
  'clemson-tigers': { sportsRef: 'clemson', teamName: 'Clemson Tigers' },
  'duke-blue-devils': { sportsRef: 'duke', teamName: 'Duke Blue Devils' },
  'florida-state-seminoles': { sportsRef: 'florida-state', teamName: 'Florida State Seminoles' },
  'georgia-tech-yellow-jackets': { sportsRef: 'georgia-tech', teamName: 'Georgia Tech Yellow Jackets' },
  'louisville-cardinals': { sportsRef: 'louisville', teamName: 'Louisville Cardinals' },
  'miami-hurricanes': { sportsRef: 'miami-fl', teamName: 'Miami Hurricanes' },
  'north-carolina-tar-heels': { sportsRef: 'north-carolina', teamName: 'North Carolina Tar Heels' },
  'nc-state-wolfpack': { sportsRef: 'north-carolina-state', teamName: 'NC State Wolfpack' },
  'pittsburgh-panthers': { sportsRef: 'pittsburgh', teamName: 'Pittsburgh Panthers' },
  'smu-mustangs': { sportsRef: 'southern-methodist', teamName: 'SMU Mustangs' },
  'stanford-cardinal': { sportsRef: 'stanford', teamName: 'Stanford Cardinal' },
  'syracuse-orange': { sportsRef: 'syracuse', teamName: 'Syracuse Orange' },
  'virginia-cavaliers': { sportsRef: 'virginia', teamName: 'Virginia Cavaliers' },
  'virginia-tech-hokies': { sportsRef: 'virginia-tech', teamName: 'Virginia Tech Hokies' },
  'wake-forest-demon-deacons': { sportsRef: 'wake-forest', teamName: 'Wake Forest Demon Deacons' },

  // American
  'army-black-knights': { sportsRef: 'army', teamName: 'Army Black Knights' },
  'charlotte-49ers': { sportsRef: 'charlotte', teamName: 'Charlotte 49ers' },
  'east-carolina-pirates': { sportsRef: 'east-carolina', teamName: 'East Carolina Pirates' },
  'fau-owls': { sportsRef: 'florida-atlantic', teamName: 'FAU Owls' },
  'memphis-tigers': { sportsRef: 'memphis', teamName: 'Memphis Tigers' },
  'navy-midshipmen': { sportsRef: 'navy', teamName: 'Navy Midshipmen' },
  'north-texas-mean-green': { sportsRef: 'north-texas', teamName: 'North Texas Mean Green' },
  'rice-owls': { sportsRef: 'rice', teamName: 'Rice Owls' },
  'south-florida-bulls': { sportsRef: 'south-florida', teamName: 'South Florida Bulls' },
  'temple-owls': { sportsRef: 'temple', teamName: 'Temple Owls' },
  'tulane-green-wave': { sportsRef: 'tulane', teamName: 'Tulane Green Wave' },
  'tulsa-golden-hurricane': { sportsRef: 'tulsa', teamName: 'Tulsa Golden Hurricane' },
  'uab-blazers': { sportsRef: 'alabama-birmingham', teamName: 'UAB Blazers' },
  'utsa-roadrunners': { sportsRef: 'texas-san-antonio', teamName: 'UTSA Roadrunners' },

  // Pac-12
  'washington-state-cougars': { sportsRef: 'washington-state', teamName: 'Washington State Cougars' },
  'oregon-state-beavers': { sportsRef: 'oregon-state', teamName: 'Oregon State Beavers' },

  // Mountain West
  'air-force-falcons': { sportsRef: 'air-force', teamName: 'Air Force Falcons' },
  'boise-state-broncos': { sportsRef: 'boise-state', teamName: 'Boise State Broncos' },
  'colorado-state-rams': { sportsRef: 'colorado-state', teamName: 'Colorado State Rams' },
  'fresno-state-bulldogs': { sportsRef: 'fresno-state', teamName: 'Fresno State Bulldogs' },
  'hawaii-rainbow-warriors': { sportsRef: 'hawaii', teamName: 'Hawaii Rainbow Warriors' },
  'nevada-wolf-pack': { sportsRef: 'nevada', teamName: 'Nevada Wolf Pack' },
  'new-mexico-lobos': { sportsRef: 'new-mexico', teamName: 'New Mexico Lobos' },
  'san-diego-state-aztecs': { sportsRef: 'san-diego-state', teamName: 'San Diego State Aztecs' },
  'san-jose-state-spartans': { sportsRef: 'san-jose-state', teamName: 'San Jose State Spartans' },
  'unlv-rebels': { sportsRef: 'nevada-las-vegas', teamName: 'UNLV Rebels' },
  'utah-state-aggies': { sportsRef: 'utah-state', teamName: 'Utah State Aggies' },
  'wyoming-cowboys': { sportsRef: 'wyoming', teamName: 'Wyoming Cowboys' },

  // Sun Belt
  'appalachian-state-mountaineers': { sportsRef: 'appalachian-state', teamName: 'Appalachian State Mountaineers' },
  'arkansas-state-red-wolves': { sportsRef: 'arkansas-state', teamName: 'Arkansas State Red Wolves' },
  'coastal-carolina-chanticleers': { sportsRef: 'coastal-carolina', teamName: 'Coastal Carolina Chanticleers' },
  'georgia-southern-eagles': { sportsRef: 'georgia-southern', teamName: 'Georgia Southern Eagles' },
  'georgia-state-panthers': { sportsRef: 'georgia-state', teamName: 'Georgia State Panthers' },
  'james-madison-dukes': { sportsRef: 'james-madison', teamName: 'James Madison Dukes' },
  'louisiana-ragin-cajuns': { sportsRef: 'louisiana-lafayette', teamName: 'Louisiana Ragin\' Cajuns' },
  'louisiana-monroe-warhawks': { sportsRef: 'louisiana-monroe', teamName: 'Louisiana-Monroe Warhawks' },
  'marshall-thundering-herd': { sportsRef: 'marshall', teamName: 'Marshall Thundering Herd' },
  'old-dominion-monarchs': { sportsRef: 'old-dominion', teamName: 'Old Dominion Monarchs' },
  'south-alabama-jaguars': { sportsRef: 'south-alabama', teamName: 'South Alabama Jaguars' },
  'southern-miss-golden-eagles': { sportsRef: 'southern-mississippi', teamName: 'Southern Miss Golden Eagles' },
  'texas-state-bobcats': { sportsRef: 'texas-state', teamName: 'Texas State Bobcats' },
  'troy-trojans': { sportsRef: 'troy', teamName: 'Troy Trojans' },

  // Conference USA
  'fiu-panthers': { sportsRef: 'florida-international', teamName: 'FIU Panthers' },
  'jacksonville-state-gamecocks': { sportsRef: 'jacksonville-state', teamName: 'Jacksonville State Gamecocks' },
  'kennesaw-state-owls': { sportsRef: 'kennesaw-state', teamName: 'Kennesaw State Owls' },
  'liberty-flames': { sportsRef: 'liberty', teamName: 'Liberty Flames' },
  'louisiana-tech-bulldogs': { sportsRef: 'louisiana-tech', teamName: 'Louisiana Tech Bulldogs' },
  'middle-tennessee-blue-raiders': { sportsRef: 'middle-tennessee-state', teamName: 'Middle Tennessee Blue Raiders' },
  'new-mexico-state-aggies': { sportsRef: 'new-mexico-state', teamName: 'New Mexico State Aggies' },
  'sam-houston-bearkats': { sportsRef: 'sam-houston-state', teamName: 'Sam Houston Bearkats' },
  'utep-miners': { sportsRef: 'texas-el-paso', teamName: 'UTEP Miners' },
  'western-kentucky-hilltoppers': { sportsRef: 'western-kentucky', teamName: 'Western Kentucky Hilltoppers' },

  // Independents
  'uconn-huskies': { sportsRef: 'connecticut', teamName: 'UConn Huskies' },
  'notre-dame-fighting-irish': { sportsRef: 'notre-dame', teamName: 'Notre Dame Fighting Irish' },

  // MAC
  'akron-zips': { sportsRef: 'akron', teamName: 'Akron Zips' },
  'ball-state-cardinals': { sportsRef: 'ball-state', teamName: 'Ball State Cardinals' },
  'bowling-green-falcons': { sportsRef: 'bowling-green-state', teamName: 'Bowling Green Falcons' },
  'buffalo-bulls': { sportsRef: 'buffalo', teamName: 'Buffalo Bulls' },
  'central-michigan-chippewas': { sportsRef: 'central-michigan', teamName: 'Central Michigan Chippewas' },
  'eastern-michigan-eagles': { sportsRef: 'eastern-michigan', teamName: 'Eastern Michigan Eagles' },
  'kent-state-golden-flashes': { sportsRef: 'kent-state', teamName: 'Kent State Golden Flashes' },
  'umass-minutemen': { sportsRef: 'massachusetts', teamName: 'UMass Minutemen' },
  'miami-oh-redhawks': { sportsRef: 'miami-oh', teamName: 'Miami (OH) RedHawks' },
  'northern-illinois-huskies': { sportsRef: 'northern-illinois', teamName: 'Northern Illinois Huskies' },
  'ohio-bobcats': { sportsRef: 'ohio', teamName: 'Ohio Bobcats' },
  'toledo-rockets': { sportsRef: 'toledo', teamName: 'Toledo Rockets' },
  'western-michigan-broncos': { sportsRef: 'western-michigan', teamName: 'Western Michigan Broncos' },
};

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

interface TeamHistory {
  teamId: string;
  teamSlug: string;
  teamName: string;
  yearlyRecords: YearlyRecord[];
}

function parseNumber(text: string): number | null {
  const num = parseInt(text.trim(), 10);
  return isNaN(num) ? null : num;
}

function parseRecord(text: string): { wins: number; losses: number } {
  const match = text.match(/(\d+)-(\d+)/);
  if (match) {
    return { wins: parseInt(match[1], 10), losses: parseInt(match[2], 10) };
  }
  return { wins: 0, losses: 0 };
}

async function fetchTeamHistory(teamSlug: string, sportsRefName: string, teamName: string): Promise<TeamHistory | null> {
  const url = `https://www.sports-reference.com/cfb/schools/${sportsRefName}/index.html`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${teamName}: ${response.status}`);
      return null;
    }

    const html = await response.text();

    // Parse the HTML to extract table data
    // Look for the yearly results table
    const tableMatch = html.match(/<table[^>]*id="[^"]*"[^>]*>[\s\S]*?<\/table>/gi);

    if (!tableMatch) {
      console.error(`No table found for ${teamName}`);
      return null;
    }

    const yearlyRecords: YearlyRecord[] = [];

    // Find rows in the table
    const rowMatches = html.matchAll(/<tr[^>]*>[\s\S]*?<\/tr>/gi);

    for (const rowMatch of rowMatches) {
      const row = rowMatch[0];

      // Skip header rows
      if (row.includes('<th')) continue;

      // Extract cells
      const cells = row.match(/<td[^>]*>[\s\S]*?<\/td>/gi);
      if (!cells || cells.length < 15) continue;

      // Extract text from cells
      const getText = (cell: string): string => {
        return cell.replace(/<[^>]+>/g, '').trim();
      };

      const yearText = getText(cells[0]);
      const year = parseNumber(yearText);

      if (!year || year < 2000 || year > 2025) continue;

      // Parse the data based on Sports Reference column order
      const winsText = getText(cells[2]);
      const lossesText = getText(cells[3]);
      const confWinsText = getText(cells[5]);
      const confLossesText = getText(cells[6]);
      const apPreText = getText(cells[11]);
      const apPostText = getText(cells[13]);
      const cfpFinalText = getText(cells[15]);
      const coachText = getText(cells[16]);
      const bowlText = getText(cells[17]);

      const record: YearlyRecord = {
        year,
        wins: parseNumber(winsText) || 0,
        losses: parseNumber(lossesText) || 0,
        confWins: parseNumber(confWinsText) || 0,
        confLosses: parseNumber(confLossesText) || 0,
        apPre: parseNumber(apPreText),
        apPost: parseNumber(apPostText),
        cfpFinal: parseNumber(cfpFinalText),
        coach: coachText || 'Unknown',
        bowl: bowlText || null,
      };

      yearlyRecords.push(record);
    }

    // Sort by year descending
    yearlyRecords.sort((a, b) => b.year - a.year);

    const teamId = teamSlug.split('-').slice(0, -1).join('-') || teamSlug;

    return {
      teamId,
      teamSlug,
      teamName,
      yearlyRecords,
    };

  } catch (error) {
    console.error(`Error fetching ${teamName}:`, error);
    return null;
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const outputDir = path.join(__dirname, '..', 'data', 'history');

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const teams = Object.entries(sportsRefMapping);
  console.log(`Fetching history for ${teams.length} teams...`);

  let successCount = 0;
  let failCount = 0;

  for (const [teamSlug, { sportsRef, teamName }] of teams) {
    // Check if file already exists
    const filePath = path.join(outputDir, `${teamSlug}.json`);
    if (fs.existsSync(filePath)) {
      console.log(`Skipping ${teamName} (already exists)`);
      successCount++;
      continue;
    }

    console.log(`Fetching ${teamName}...`);

    const history = await fetchTeamHistory(teamSlug, sportsRef, teamName);

    if (history && history.yearlyRecords.length > 0) {
      fs.writeFileSync(filePath, JSON.stringify(history, null, 2));
      console.log(`  ✓ Saved ${history.yearlyRecords.length} records`);
      successCount++;
    } else {
      console.log(`  ✗ Failed to fetch`);
      failCount++;
    }

    // Rate limiting: wait 2 seconds between requests
    await sleep(2000);
  }

  console.log(`\nDone! Success: ${successCount}, Failed: ${failCount}`);
}

main().catch(console.error);
