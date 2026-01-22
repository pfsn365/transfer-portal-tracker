import { Conference } from '@/types/player';

export interface Team {
  id: string; // Short name for logo lookups
  name: string; // Full display name
  slug: string; // URL slug
  conference: Conference;
}

export const allTeams: Team[] = [
  // SEC
  { id: 'alabama', name: 'Alabama Crimson Tide', slug: 'alabama-crimson-tide', conference: 'SEC' },
  { id: 'arkansas', name: 'Arkansas Razorbacks', slug: 'arkansas-razorbacks', conference: 'SEC' },
  { id: 'auburn', name: 'Auburn Tigers', slug: 'auburn-tigers', conference: 'SEC' },
  { id: 'florida', name: 'Florida Gators', slug: 'florida-gators', conference: 'SEC' },
  { id: 'georgia', name: 'Georgia Bulldogs', slug: 'georgia-bulldogs', conference: 'SEC' },
  { id: 'kentucky', name: 'Kentucky Wildcats', slug: 'kentucky-wildcats', conference: 'SEC' },
  { id: 'lsu', name: 'LSU Tigers', slug: 'lsu-tigers', conference: 'SEC' },
  { id: 'ole miss', name: 'Ole Miss Rebels', slug: 'ole-miss-rebels', conference: 'SEC' },
  { id: 'mississippi state', name: 'Mississippi State Bulldogs', slug: 'mississippi-state-bulldogs', conference: 'SEC' },
  { id: 'missouri', name: 'Missouri Tigers', slug: 'missouri-tigers', conference: 'SEC' },
  { id: 'oklahoma', name: 'Oklahoma Sooners', slug: 'oklahoma-sooners', conference: 'SEC' },
  { id: 'south carolina', name: 'South Carolina Gamecocks', slug: 'south-carolina-gamecocks', conference: 'SEC' },
  { id: 'tennessee', name: 'Tennessee Volunteers', slug: 'tennessee-volunteers', conference: 'SEC' },
  { id: 'texas', name: 'Texas Longhorns', slug: 'texas-longhorns', conference: 'SEC' },
  { id: 'texas a&m', name: 'Texas A&M Aggies', slug: 'texas-am-aggies', conference: 'SEC' },
  { id: 'vanderbilt', name: 'Vanderbilt Commodores', slug: 'vanderbilt-commodores', conference: 'SEC' },

  // Big Ten
  { id: 'illinois', name: 'Illinois Fighting Illini', slug: 'illinois-fighting-illini', conference: 'Big Ten' },
  { id: 'indiana', name: 'Indiana Hoosiers', slug: 'indiana-hoosiers', conference: 'Big Ten' },
  { id: 'iowa', name: 'Iowa Hawkeyes', slug: 'iowa-hawkeyes', conference: 'Big Ten' },
  { id: 'maryland', name: 'Maryland Terrapins', slug: 'maryland-terrapins', conference: 'Big Ten' },
  { id: 'michigan', name: 'Michigan Wolverines', slug: 'michigan-wolverines', conference: 'Big Ten' },
  { id: 'michigan state', name: 'Michigan State Spartans', slug: 'michigan-state-spartans', conference: 'Big Ten' },
  { id: 'minnesota', name: 'Minnesota Golden Gophers', slug: 'minnesota-golden-gophers', conference: 'Big Ten' },
  { id: 'nebraska', name: 'Nebraska Cornhuskers', slug: 'nebraska-cornhuskers', conference: 'Big Ten' },
  { id: 'northwestern', name: 'Northwestern Wildcats', slug: 'northwestern-wildcats', conference: 'Big Ten' },
  { id: 'ohio state', name: 'Ohio State Buckeyes', slug: 'ohio-state-buckeyes', conference: 'Big Ten' },
  { id: 'oregon', name: 'Oregon Ducks', slug: 'oregon-ducks', conference: 'Big Ten' },
  { id: 'penn state', name: 'Penn State Nittany Lions', slug: 'penn-state-nittany-lions', conference: 'Big Ten' },
  { id: 'purdue', name: 'Purdue Boilermakers', slug: 'purdue-boilermakers', conference: 'Big Ten' },
  { id: 'rutgers', name: 'Rutgers Scarlet Knights', slug: 'rutgers-scarlet-knights', conference: 'Big Ten' },
  { id: 'ucla', name: 'UCLA Bruins', slug: 'ucla-bruins', conference: 'Big Ten' },
  { id: 'usc', name: 'USC Trojans', slug: 'usc-trojans', conference: 'Big Ten' },
  { id: 'washington', name: 'Washington Huskies', slug: 'washington-huskies', conference: 'Big Ten' },
  { id: 'wisconsin', name: 'Wisconsin Badgers', slug: 'wisconsin-badgers', conference: 'Big Ten' },

  // Big 12
  { id: 'arizona', name: 'Arizona Wildcats', slug: 'arizona-wildcats', conference: 'Big 12' },
  { id: 'arizona state', name: 'Arizona State Sun Devils', slug: 'arizona-state-sun-devils', conference: 'Big 12' },
  { id: 'baylor', name: 'Baylor Bears', slug: 'baylor-bears', conference: 'Big 12' },
  { id: 'byu', name: 'BYU Cougars', slug: 'byu-cougars', conference: 'Big 12' },
  { id: 'cincinnati', name: 'Cincinnati Bearcats', slug: 'cincinnati-bearcats', conference: 'Big 12' },
  { id: 'colorado', name: 'Colorado Buffaloes', slug: 'colorado-buffaloes', conference: 'Big 12' },
  { id: 'houston', name: 'Houston Cougars', slug: 'houston-cougars', conference: 'Big 12' },
  { id: 'iowa state', name: 'Iowa State Cyclones', slug: 'iowa-state-cyclones', conference: 'Big 12' },
  { id: 'kansas', name: 'Kansas Jayhawks', slug: 'kansas-jayhawks', conference: 'Big 12' },
  { id: 'kansas state', name: 'Kansas State Wildcats', slug: 'kansas-state-wildcats', conference: 'Big 12' },
  { id: 'oklahoma state', name: 'Oklahoma State Cowboys', slug: 'oklahoma-state-cowboys', conference: 'Big 12' },
  { id: 'tcu', name: 'TCU Horned Frogs', slug: 'tcu-horned-frogs', conference: 'Big 12' },
  { id: 'texas tech', name: 'Texas Tech Red Raiders', slug: 'texas-tech-red-raiders', conference: 'Big 12' },
  { id: 'ucf', name: 'UCF Knights', slug: 'ucf-knights', conference: 'Big 12' },
  { id: 'utah', name: 'Utah Utes', slug: 'utah-utes', conference: 'Big 12' },
  { id: 'west virginia', name: 'West Virginia Mountaineers', slug: 'west-virginia-mountaineers', conference: 'Big 12' },

  // ACC
  { id: 'boston college', name: 'Boston College Eagles', slug: 'boston-college-eagles', conference: 'ACC' },
  { id: 'california', name: 'California Golden Bears', slug: 'california-golden-bears', conference: 'ACC' },
  { id: 'clemson', name: 'Clemson Tigers', slug: 'clemson-tigers', conference: 'ACC' },
  { id: 'duke', name: 'Duke Blue Devils', slug: 'duke-blue-devils', conference: 'ACC' },
  { id: 'florida state', name: 'Florida State Seminoles', slug: 'florida-state-seminoles', conference: 'ACC' },
  { id: 'georgia tech', name: 'Georgia Tech Yellow Jackets', slug: 'georgia-tech-yellow-jackets', conference: 'ACC' },
  { id: 'louisville', name: 'Louisville Cardinals', slug: 'louisville-cardinals', conference: 'ACC' },
  { id: 'miami', name: 'Miami Hurricanes', slug: 'miami-hurricanes', conference: 'ACC' },
  { id: 'north carolina', name: 'North Carolina Tar Heels', slug: 'north-carolina-tar-heels', conference: 'ACC' },
  { id: 'north carolina state', name: 'NC State Wolfpack', slug: 'nc-state-wolfpack', conference: 'ACC' },
  { id: 'pittsburgh', name: 'Pittsburgh Panthers', slug: 'pittsburgh-panthers', conference: 'ACC' },
  { id: 'smu', name: 'SMU Mustangs', slug: 'smu-mustangs', conference: 'ACC' },
  { id: 'stanford', name: 'Stanford Cardinal', slug: 'stanford-cardinal', conference: 'ACC' },
  { id: 'syracuse', name: 'Syracuse Orange', slug: 'syracuse-orange', conference: 'ACC' },
  { id: 'virginia', name: 'Virginia Cavaliers', slug: 'virginia-cavaliers', conference: 'ACC' },
  { id: 'virginia tech', name: 'Virginia Tech Hokies', slug: 'virginia-tech-hokies', conference: 'ACC' },
  { id: 'wake forest', name: 'Wake Forest Demon Deacons', slug: 'wake-forest-demon-deacons', conference: 'ACC' },

  // American
  { id: 'army', name: 'Army Black Knights', slug: 'army-black-knights', conference: 'American' },
  { id: 'charlotte', name: 'Charlotte 49ers', slug: 'charlotte-49ers', conference: 'American' },
  { id: 'east carolina', name: 'East Carolina Pirates', slug: 'east-carolina-pirates', conference: 'American' },
  { id: 'fau', name: 'FAU Owls', slug: 'fau-owls', conference: 'American' },
  { id: 'memphis', name: 'Memphis Tigers', slug: 'memphis-tigers', conference: 'American' },
  { id: 'navy', name: 'Navy Midshipmen', slug: 'navy-midshipmen', conference: 'American' },
  { id: 'north texas', name: 'North Texas Mean Green', slug: 'north-texas-mean-green', conference: 'American' },
  { id: 'rice', name: 'Rice Owls', slug: 'rice-owls', conference: 'American' },
  { id: 'usf', name: 'South Florida Bulls', slug: 'south-florida-bulls', conference: 'American' },
  { id: 'temple', name: 'Temple Owls', slug: 'temple-owls', conference: 'American' },
  { id: 'tulane', name: 'Tulane Green Wave', slug: 'tulane-green-wave', conference: 'American' },
  { id: 'tulsa', name: 'Tulsa Golden Hurricane', slug: 'tulsa-golden-hurricane', conference: 'American' },
  { id: 'uab', name: 'UAB Blazers', slug: 'uab-blazers', conference: 'American' },
  { id: 'utsa', name: 'UTSA Roadrunners', slug: 'utsa-roadrunners', conference: 'American' },

  // Pac-12
  { id: 'washington state', name: 'Washington State Cougars', slug: 'washington-state-cougars', conference: 'Pac-12' },
  { id: 'oregon state', name: 'Oregon State Beavers', slug: 'oregon-state-beavers', conference: 'Pac-12' },

  // Mountain West
  { id: 'air force', name: 'Air Force Falcons', slug: 'air-force-falcons', conference: 'Mountain West' },
  { id: 'boise state', name: 'Boise State Broncos', slug: 'boise-state-broncos', conference: 'Mountain West' },
  { id: 'colorado state', name: 'Colorado State Rams', slug: 'colorado-state-rams', conference: 'Mountain West' },
  { id: 'fresno state', name: 'Fresno State Bulldogs', slug: 'fresno-state-bulldogs', conference: 'Mountain West' },
  { id: 'hawaii', name: 'Hawaii Rainbow Warriors', slug: 'hawaii-rainbow-warriors', conference: 'Mountain West' },
  { id: 'nevada', name: 'Nevada Wolf Pack', slug: 'nevada-wolf-pack', conference: 'Mountain West' },
  { id: 'new mexico', name: 'New Mexico Lobos', slug: 'new-mexico-lobos', conference: 'Mountain West' },
  { id: 'san diego state', name: 'San Diego State Aztecs', slug: 'san-diego-state-aztecs', conference: 'Mountain West' },
  { id: 'san jose state', name: 'San Jose State Spartans', slug: 'san-jose-state-spartans', conference: 'Mountain West' },
  { id: 'unlv', name: 'UNLV Rebels', slug: 'unlv-rebels', conference: 'Mountain West' },
  { id: 'utah state', name: 'Utah State Aggies', slug: 'utah-state-aggies', conference: 'Mountain West' },
  { id: 'wyoming', name: 'Wyoming Cowboys', slug: 'wyoming-cowboys', conference: 'Mountain West' },

  // Sun Belt
  { id: 'appalachian state', name: 'Appalachian State Mountaineers', slug: 'appalachian-state-mountaineers', conference: 'Sun Belt' },
  { id: 'arkansas state', name: 'Arkansas State Red Wolves', slug: 'arkansas-state-red-wolves', conference: 'Sun Belt' },
  { id: 'coastal carolina', name: 'Coastal Carolina Chanticleers', slug: 'coastal-carolina-chanticleers', conference: 'Sun Belt' },
  { id: 'georgia southern', name: 'Georgia Southern Eagles', slug: 'georgia-southern-eagles', conference: 'Sun Belt' },
  { id: 'georgia state', name: 'Georgia State Panthers', slug: 'georgia-state-panthers', conference: 'Sun Belt' },
  { id: 'james madison', name: 'James Madison Dukes', slug: 'james-madison-dukes', conference: 'Sun Belt' },
  { id: 'louisiana', name: 'Louisiana Ragin Cajuns', slug: 'louisiana-ragin-cajuns', conference: 'Sun Belt' },
  { id: 'louisiana-monroe', name: 'Louisiana-Monroe Warhawks', slug: 'louisiana-monroe-warhawks', conference: 'Sun Belt' },
  { id: 'marshall', name: 'Marshall Thundering Herd', slug: 'marshall-thundering-herd', conference: 'Sun Belt' },
  { id: 'old dominion', name: 'Old Dominion Monarchs', slug: 'old-dominion-monarchs', conference: 'Sun Belt' },
  { id: 'south alabama', name: 'South Alabama Jaguars', slug: 'south-alabama-jaguars', conference: 'Sun Belt' },
  { id: 'southern miss', name: 'Southern Miss Golden Eagles', slug: 'southern-miss-golden-eagles', conference: 'Sun Belt' },
  { id: 'texas state', name: 'Texas State Bobcats', slug: 'texas-state-bobcats', conference: 'Sun Belt' },
  { id: 'troy', name: 'Troy Trojans', slug: 'troy-trojans', conference: 'Sun Belt' },

  // Conference USA
  { id: 'delaware', name: 'Delaware Fightin Blue Hens', slug: 'delaware-fightin-blue-hens', conference: 'Conference USA' },
  { id: 'florida international', name: 'FIU Panthers', slug: 'fiu-panthers', conference: 'Conference USA' },
  { id: 'jacksonville state', name: 'Jacksonville State Gamecocks', slug: 'jacksonville-state-gamecocks', conference: 'Conference USA' },
  { id: 'kennesaw state', name: 'Kennesaw State Owls', slug: 'kennesaw-state-owls', conference: 'Conference USA' },
  { id: 'liberty', name: 'Liberty Flames', slug: 'liberty-flames', conference: 'Conference USA' },
  { id: 'louisiana tech', name: 'Louisiana Tech Bulldogs', slug: 'louisiana-tech-bulldogs', conference: 'Conference USA' },
  { id: 'middle tennessee state', name: 'Middle Tennessee Blue Raiders', slug: 'middle-tennessee-blue-raiders', conference: 'Conference USA' },
  { id: 'new mexico state', name: 'New Mexico State Aggies', slug: 'new-mexico-state-aggies', conference: 'Conference USA' },
  { id: 'sam houston', name: 'Sam Houston Bearkats', slug: 'sam-houston-bearkats', conference: 'Conference USA' },
  { id: 'utep', name: 'UTEP Miners', slug: 'utep-miners', conference: 'Conference USA' },
  { id: 'western kentucky', name: 'Western Kentucky Hilltoppers', slug: 'western-kentucky-hilltoppers', conference: 'Conference USA' },

  // Independents
  { id: 'connecticut', name: 'UConn Huskies', slug: 'uconn-huskies', conference: 'Independent' },
  { id: 'notre dame', name: 'Notre Dame Fighting Irish', slug: 'notre-dame-fighting-irish', conference: 'Independent' },

  // MAC
  { id: 'akron', name: 'Akron Zips', slug: 'akron-zips', conference: 'MAC' },
  { id: 'ball state', name: 'Ball State Cardinals', slug: 'ball-state-cardinals', conference: 'MAC' },
  { id: 'bowling green', name: 'Bowling Green Falcons', slug: 'bowling-green-falcons', conference: 'MAC' },
  { id: 'buffalo', name: 'Buffalo Bulls', slug: 'buffalo-bulls', conference: 'MAC' },
  { id: 'central michigan', name: 'Central Michigan Chippewas', slug: 'central-michigan-chippewas', conference: 'MAC' },
  { id: 'eastern michigan', name: 'Eastern Michigan Eagles', slug: 'eastern-michigan-eagles', conference: 'MAC' },
  { id: 'kent state', name: 'Kent State Golden Flashes', slug: 'kent-state-golden-flashes', conference: 'MAC' },
  { id: 'massachusetts', name: 'UMass Minutemen', slug: 'umass-minutemen', conference: 'MAC' },
  { id: 'miami (oh)', name: 'Miami (OH) RedHawks', slug: 'miami-oh-redhawks', conference: 'MAC' },
  { id: 'northern illinois', name: 'Northern Illinois Huskies', slug: 'northern-illinois-huskies', conference: 'MAC' },
  { id: 'ohio', name: 'Ohio Bobcats', slug: 'ohio-bobcats', conference: 'MAC' },
  { id: 'toledo', name: 'Toledo Rockets', slug: 'toledo-rockets', conference: 'MAC' },
  { id: 'western michigan', name: 'Western Michigan Broncos', slug: 'western-michigan-broncos', conference: 'MAC' },
];

// Pre-built lookup Maps for O(1) access
const teamBySlugMap = new Map<string, Team>(
  allTeams.map(team => [team.slug, team])
);

const teamByIdMap = new Map<string, Team>(
  allTeams.map(team => [team.id.toLowerCase(), team])
);

const teamByNameMap = new Map<string, Team>(
  allTeams.map(team => [team.name.toLowerCase(), team])
);

const teamsByConferenceMap = new Map<Conference, Team[]>();
allTeams.forEach(team => {
  const existing = teamsByConferenceMap.get(team.conference) || [];
  existing.push(team);
  teamsByConferenceMap.set(team.conference, existing);
});
teamsByConferenceMap.forEach((teams, conf) => {
  teamsByConferenceMap.set(conf, teams.sort((a, b) => a.name.localeCompare(b.name)));
});

// Cache for fuzzy lookups to avoid repeated searches
const fuzzyLookupCache = new Map<string, Team | undefined>();

// Helper functions
export function getTeamBySlug(slug: string): Team | undefined {
  return teamBySlugMap.get(slug);
}

export function getTeamById(id: string): Team | undefined {
  const searchTerm = id.toLowerCase().trim();

  // Check cache first for fuzzy lookups
  if (fuzzyLookupCache.has(searchTerm)) {
    return fuzzyLookupCache.get(searchTerm);
  }

  // 1. Try exact match on team ID (O(1))
  let team = teamByIdMap.get(searchTerm);
  if (team) {
    fuzzyLookupCache.set(searchTerm, team);
    return team;
  }

  // 2. Try exact match on full team name (O(1))
  team = teamByNameMap.get(searchTerm);
  if (team) {
    fuzzyLookupCache.set(searchTerm, team);
    return team;
  }

  // 3. Try partial match - check if search term starts with team ID
  // e.g., "Northern Illinois Huskies" starts with "northern illinois"
  // But exclude cases where the remaining text indicates a different school
  // (e.g., "North Carolina A&T" should NOT match "North Carolina")
  const schoolModifiers = ['a&t', 'a&m', 'state', 'tech', 'central', 'southern', 'northern', 'western', 'eastern'];
  team = allTeams.find(t => {
    const teamId = t.id.toLowerCase();
    if (!searchTerm.startsWith(teamId)) return false;

    // Get the remaining text after the team ID
    const remaining = searchTerm.slice(teamId.length).trim().toLowerCase();

    // If nothing remains, it's a match
    if (!remaining) return true;

    // If remaining starts with a school modifier, it's a different school
    const startsWithModifier = schoolModifiers.some(mod => remaining.startsWith(mod));
    if (startsWithModifier) return false;

    // Otherwise, it's likely a mascot suffix, so it's a match
    return true;
  });
  if (team) {
    fuzzyLookupCache.set(searchTerm, team);
    return team;
  }

  // 4. Try partial match - check if team name starts with search term
  // e.g., search "Northern Illinois" matches "Northern Illinois Huskies"
  team = allTeams.find(t => t.name.toLowerCase().startsWith(searchTerm));
  if (team) {
    fuzzyLookupCache.set(searchTerm, team);
    return team;
  }

  fuzzyLookupCache.set(searchTerm, undefined);
  return undefined;
}

export function getTeamsByConference(conference: Conference): Team[] {
  return teamsByConferenceMap.get(conference) || [];
}

export function getAllConferences(): Conference[] {
  return Array.from(teamsByConferenceMap.keys()).sort();
}
