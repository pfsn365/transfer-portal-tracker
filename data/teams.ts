import { Conference } from '@/types/player';

export interface Team {
  id: string; // Short name for logo lookups
  name: string; // Full display name
  slug: string; // URL slug
  conference: Conference;
}

export const allTeams: Team[] = [
  // SEC
  { id: 'alabama', name: 'Alabama', slug: 'alabama-crimson-tide', conference: 'SEC' },
  { id: 'arkansas', name: 'Arkansas', slug: 'arkansas-razorbacks', conference: 'SEC' },
  { id: 'auburn', name: 'Auburn', slug: 'auburn-tigers', conference: 'SEC' },
  { id: 'florida', name: 'Florida', slug: 'florida-gators', conference: 'SEC' },
  { id: 'georgia', name: 'Georgia', slug: 'georgia-bulldogs', conference: 'SEC' },
  { id: 'kentucky', name: 'Kentucky', slug: 'kentucky-wildcats', conference: 'SEC' },
  { id: 'lsu', name: 'LSU', slug: 'lsu-tigers', conference: 'SEC' },
  { id: 'ole miss', name: 'Ole Miss', slug: 'ole-miss-rebels', conference: 'SEC' },
  { id: 'mississippi state', name: 'Mississippi State', slug: 'mississippi-state-bulldogs', conference: 'SEC' },
  { id: 'missouri', name: 'Missouri', slug: 'missouri-tigers', conference: 'SEC' },
  { id: 'oklahoma', name: 'Oklahoma', slug: 'oklahoma-sooners', conference: 'SEC' },
  { id: 'south carolina', name: 'South Carolina', slug: 'south-carolina-gamecocks', conference: 'SEC' },
  { id: 'tennessee', name: 'Tennessee', slug: 'tennessee-volunteers', conference: 'SEC' },
  { id: 'texas', name: 'Texas', slug: 'texas-longhorns', conference: 'SEC' },
  { id: 'texas a&m', name: 'Texas A&M', slug: 'texas-am-aggies', conference: 'SEC' },
  { id: 'vanderbilt', name: 'Vanderbilt', slug: 'vanderbilt-commodores', conference: 'SEC' },

  // Big Ten
  { id: 'illinois', name: 'Illinois', slug: 'illinois-fighting-illini', conference: 'Big Ten' },
  { id: 'indiana', name: 'Indiana', slug: 'indiana-hoosiers', conference: 'Big Ten' },
  { id: 'iowa', name: 'Iowa', slug: 'iowa-hawkeyes', conference: 'Big Ten' },
  { id: 'maryland', name: 'Maryland', slug: 'maryland-terrapins', conference: 'Big Ten' },
  { id: 'michigan', name: 'Michigan', slug: 'michigan-wolverines', conference: 'Big Ten' },
  { id: 'michigan state', name: 'Michigan State', slug: 'michigan-state-spartans', conference: 'Big Ten' },
  { id: 'minnesota', name: 'Minnesota', slug: 'minnesota-golden-gophers', conference: 'Big Ten' },
  { id: 'nebraska', name: 'Nebraska', slug: 'nebraska-cornhuskers', conference: 'Big Ten' },
  { id: 'northwestern', name: 'Northwestern', slug: 'northwestern-wildcats', conference: 'Big Ten' },
  { id: 'ohio state', name: 'Ohio State', slug: 'ohio-state-buckeyes', conference: 'Big Ten' },
  { id: 'oregon', name: 'Oregon', slug: 'oregon-ducks', conference: 'Big Ten' },
  { id: 'penn state', name: 'Penn State', slug: 'penn-state-nittany-lions', conference: 'Big Ten' },
  { id: 'purdue', name: 'Purdue', slug: 'purdue-boilermakers', conference: 'Big Ten' },
  { id: 'rutgers', name: 'Rutgers', slug: 'rutgers-scarlet-knights', conference: 'Big Ten' },
  { id: 'ucla', name: 'UCLA', slug: 'ucla-bruins', conference: 'Big Ten' },
  { id: 'usc', name: 'USC', slug: 'usc-trojans', conference: 'Big Ten' },
  { id: 'washington', name: 'Washington', slug: 'washington-huskies', conference: 'Big Ten' },
  { id: 'wisconsin', name: 'Wisconsin', slug: 'wisconsin-badgers', conference: 'Big Ten' },

  // Big 12
  { id: 'arizona', name: 'Arizona', slug: 'arizona-wildcats', conference: 'Big 12' },
  { id: 'arizona state', name: 'Arizona State', slug: 'arizona-state-sun-devils', conference: 'Big 12' },
  { id: 'baylor', name: 'Baylor', slug: 'baylor-bears', conference: 'Big 12' },
  { id: 'byu', name: 'BYU', slug: 'byu-cougars', conference: 'Big 12' },
  { id: 'cincinnati', name: 'Cincinnati', slug: 'cincinnati-bearcats', conference: 'Big 12' },
  { id: 'colorado', name: 'Colorado', slug: 'colorado-buffaloes', conference: 'Big 12' },
  { id: 'houston', name: 'Houston', slug: 'houston-cougars', conference: 'Big 12' },
  { id: 'iowa state', name: 'Iowa State', slug: 'iowa-state-cyclones', conference: 'Big 12' },
  { id: 'kansas', name: 'Kansas', slug: 'kansas-jayhawks', conference: 'Big 12' },
  { id: 'kansas state', name: 'Kansas State', slug: 'kansas-state-wildcats', conference: 'Big 12' },
  { id: 'oklahoma state', name: 'Oklahoma State', slug: 'oklahoma-state-cowboys', conference: 'Big 12' },
  { id: 'tcu', name: 'TCU', slug: 'tcu-horned-frogs', conference: 'Big 12' },
  { id: 'texas tech', name: 'Texas Tech', slug: 'texas-tech-red-raiders', conference: 'Big 12' },
  { id: 'ucf', name: 'UCF', slug: 'ucf-knights', conference: 'Big 12' },
  { id: 'utah', name: 'Utah', slug: 'utah-utes', conference: 'Big 12' },
  { id: 'west virginia', name: 'West Virginia', slug: 'west-virginia-mountaineers', conference: 'Big 12' },

  // ACC
  { id: 'boston college', name: 'Boston College', slug: 'boston-college-eagles', conference: 'ACC' },
  { id: 'california', name: 'California', slug: 'california-golden-bears', conference: 'ACC' },
  { id: 'clemson', name: 'Clemson', slug: 'clemson-tigers', conference: 'ACC' },
  { id: 'duke', name: 'Duke', slug: 'duke-blue-devils', conference: 'ACC' },
  { id: 'florida state', name: 'Florida State', slug: 'florida-state-seminoles', conference: 'ACC' },
  { id: 'georgia tech', name: 'Georgia Tech', slug: 'georgia-tech-yellow-jackets', conference: 'ACC' },
  { id: 'louisville', name: 'Louisville', slug: 'louisville-cardinals', conference: 'ACC' },
  { id: 'miami', name: 'Miami', slug: 'miami-hurricanes', conference: 'ACC' },
  { id: 'north carolina', name: 'North Carolina', slug: 'north-carolina-tar-heels', conference: 'ACC' },
  { id: 'north carolina state', name: 'NC State', slug: 'nc-state-wolfpack', conference: 'ACC' },
  { id: 'pittsburgh', name: 'Pittsburgh', slug: 'pittsburgh-panthers', conference: 'ACC' },
  { id: 'smu', name: 'SMU', slug: 'smu-mustangs', conference: 'ACC' },
  { id: 'stanford', name: 'Stanford', slug: 'stanford-cardinal', conference: 'ACC' },
  { id: 'syracuse', name: 'Syracuse', slug: 'syracuse-orange', conference: 'ACC' },
  { id: 'virginia', name: 'Virginia', slug: 'virginia-cavaliers', conference: 'ACC' },
  { id: 'virginia tech', name: 'Virginia Tech', slug: 'virginia-tech-hokies', conference: 'ACC' },
  { id: 'wake forest', name: 'Wake Forest', slug: 'wake-forest-demon-deacons', conference: 'ACC' },

  // American
  { id: 'army', name: 'Army', slug: 'army-black-knights', conference: 'American' },
  { id: 'charlotte', name: 'Charlotte', slug: 'charlotte-49ers', conference: 'American' },
  { id: 'east carolina', name: 'East Carolina', slug: 'east-carolina-pirates', conference: 'American' },
  { id: 'fau', name: 'FAU', slug: 'fau-owls', conference: 'American' },
  { id: 'memphis', name: 'Memphis', slug: 'memphis-tigers', conference: 'American' },
  { id: 'navy', name: 'Navy', slug: 'navy-midshipmen', conference: 'American' },
  { id: 'north texas', name: 'North Texas', slug: 'north-texas-mean-green', conference: 'American' },
  { id: 'rice', name: 'Rice', slug: 'rice-owls', conference: 'American' },
  { id: 'usf', name: 'South Florida', slug: 'south-florida-bulls', conference: 'American' },
  { id: 'temple', name: 'Temple', slug: 'temple-owls', conference: 'American' },
  { id: 'tulane', name: 'Tulane', slug: 'tulane-green-wave', conference: 'American' },
  { id: 'tulsa', name: 'Tulsa', slug: 'tulsa-golden-hurricane', conference: 'American' },
  { id: 'uab', name: 'UAB', slug: 'uab-blazers', conference: 'American' },
  { id: 'utsa', name: 'UTSA', slug: 'utsa-roadrunners', conference: 'American' },

  // Pac-12
  { id: 'washington state', name: 'Washington State', slug: 'washington-state-cougars', conference: 'Pac-12' },
  { id: 'oregon state', name: 'Oregon State', slug: 'oregon-state-beavers', conference: 'Pac-12' },

  // Mountain West
  { id: 'air force', name: 'Air Force', slug: 'air-force-falcons', conference: 'Mountain West' },
  { id: 'boise state', name: 'Boise State', slug: 'boise-state-broncos', conference: 'Mountain West' },
  { id: 'colorado state', name: 'Colorado State', slug: 'colorado-state-rams', conference: 'Mountain West' },
  { id: 'fresno state', name: 'Fresno State', slug: 'fresno-state-bulldogs', conference: 'Mountain West' },
  { id: 'hawaii', name: 'Hawaii', slug: 'hawaii-rainbow-warriors', conference: 'Mountain West' },
  { id: 'nevada', name: 'Nevada', slug: 'nevada-wolf-pack', conference: 'Mountain West' },
  { id: 'new mexico', name: 'New Mexico', slug: 'new-mexico-lobos', conference: 'Mountain West' },
  { id: 'san diego state', name: 'San Diego State', slug: 'san-diego-state-aztecs', conference: 'Mountain West' },
  { id: 'san jose state', name: 'San Jose State', slug: 'san-jose-state-spartans', conference: 'Mountain West' },
  { id: 'unlv', name: 'UNLV', slug: 'unlv-rebels', conference: 'Mountain West' },
  { id: 'utah state', name: 'Utah State', slug: 'utah-state-aggies', conference: 'Mountain West' },
  { id: 'wyoming', name: 'Wyoming', slug: 'wyoming-cowboys', conference: 'Mountain West' },

  // Sun Belt
  { id: 'appalachian state', name: 'Appalachian State', slug: 'appalachian-state-mountaineers', conference: 'Sun Belt' },
  { id: 'arkansas state', name: 'Arkansas State', slug: 'arkansas-state-red-wolves', conference: 'Sun Belt' },
  { id: 'coastal carolina', name: 'Coastal Carolina', slug: 'coastal-carolina-chanticleers', conference: 'Sun Belt' },
  { id: 'georgia southern', name: 'Georgia Southern', slug: 'georgia-southern-eagles', conference: 'Sun Belt' },
  { id: 'georgia state', name: 'Georgia State', slug: 'georgia-state-panthers', conference: 'Sun Belt' },
  { id: 'james madison', name: 'James Madison', slug: 'james-madison-dukes', conference: 'Sun Belt' },
  { id: 'louisiana', name: 'Louisiana', slug: 'louisiana-ragin-cajuns', conference: 'Sun Belt' },
  { id: 'louisiana-monroe', name: 'Louisiana-Monroe', slug: 'louisiana-monroe-warhawks', conference: 'Sun Belt' },
  { id: 'marshall', name: 'Marshall', slug: 'marshall-thundering-herd', conference: 'Sun Belt' },
  { id: 'old dominion', name: 'Old Dominion', slug: 'old-dominion-monarchs', conference: 'Sun Belt' },
  { id: 'south alabama', name: 'South Alabama', slug: 'south-alabama-jaguars', conference: 'Sun Belt' },
  { id: 'southern miss', name: 'Southern Miss', slug: 'southern-miss-golden-eagles', conference: 'Sun Belt' },
  { id: 'texas state', name: 'Texas State', slug: 'texas-state-bobcats', conference: 'Sun Belt' },
  { id: 'troy', name: 'Troy', slug: 'troy-trojans', conference: 'Sun Belt' },

  // Conference USA
  { id: 'delaware', name: 'Delaware', slug: 'delaware-fightin-blue-hens', conference: 'C-USA' },
  { id: 'florida international', name: 'FIU', slug: 'fiu-panthers', conference: 'C-USA' },
  { id: 'jacksonville state', name: 'Jacksonville State', slug: 'jacksonville-state-gamecocks', conference: 'C-USA' },
  { id: 'kennesaw state', name: 'Kennesaw State', slug: 'kennesaw-state-owls', conference: 'C-USA' },
  { id: 'liberty', name: 'Liberty', slug: 'liberty-flames', conference: 'C-USA' },
  { id: 'louisiana tech', name: 'Louisiana Tech', slug: 'louisiana-tech-bulldogs', conference: 'C-USA' },
  { id: 'middle tennessee', name: 'Middle Tennessee', slug: 'middle-tennessee-blue-raiders', conference: 'C-USA' },
  { id: 'new mexico state', name: 'New Mexico State', slug: 'new-mexico-state-aggies', conference: 'C-USA' },
  { id: 'sam houston', name: 'Sam Houston', slug: 'sam-houston-bearkats', conference: 'C-USA' },
  { id: 'utep', name: 'UTEP', slug: 'utep-miners', conference: 'C-USA' },
  { id: 'western kentucky', name: 'Western Kentucky', slug: 'western-kentucky-hilltoppers', conference: 'C-USA' },

  // Independents
  { id: 'connecticut', name: 'UConn', slug: 'uconn-huskies', conference: 'Independent' },
  { id: 'notre dame', name: 'Notre Dame', slug: 'notre-dame-fighting-irish', conference: 'Independent' },

  // MAC
  { id: 'akron', name: 'Akron', slug: 'akron-zips', conference: 'MAC' },
  { id: 'ball state', name: 'Ball State', slug: 'ball-state-cardinals', conference: 'MAC' },
  { id: 'bowling green', name: 'Bowling Green', slug: 'bowling-green-falcons', conference: 'MAC' },
  { id: 'buffalo', name: 'Buffalo', slug: 'buffalo-bulls', conference: 'MAC' },
  { id: 'central michigan', name: 'Central Michigan', slug: 'central-michigan-chippewas', conference: 'MAC' },
  { id: 'eastern michigan', name: 'Eastern Michigan', slug: 'eastern-michigan-eagles', conference: 'MAC' },
  { id: 'kent state', name: 'Kent State', slug: 'kent-state-golden-flashes', conference: 'MAC' },
  { id: 'massachusetts', name: 'UMass', slug: 'umass-minutemen', conference: 'MAC' },
  { id: 'miami (oh)', name: 'Miami (OH)', slug: 'miami-oh-redhawks', conference: 'MAC' },
  { id: 'northern illinois', name: 'Northern Illinois', slug: 'northern-illinois-huskies', conference: 'MAC' },
  { id: 'ohio', name: 'Ohio', slug: 'ohio-bobcats', conference: 'MAC' },
  { id: 'toledo', name: 'Toledo', slug: 'toledo-rockets', conference: 'MAC' },
  { id: 'western michigan', name: 'Western Michigan', slug: 'western-michigan-broncos', conference: 'MAC' },
];

// Helper functions
export function getTeamBySlug(slug: string): Team | undefined {
  return allTeams.find(team => team.slug === slug);
}

export function getTeamById(id: string): Team | undefined {
  return allTeams.find(team => team.id.toLowerCase() === id.toLowerCase());
}

export function getTeamsByConference(conference: Conference): Team[] {
  return allTeams.filter(team => team.conference === conference).sort((a, b) => a.name.localeCompare(b.name));
}

export function getAllConferences(): Conference[] {
  const conferences = new Set<Conference>(allTeams.map(team => team.conference));
  return Array.from(conferences).sort();
}
