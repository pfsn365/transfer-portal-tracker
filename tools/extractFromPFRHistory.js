/**
 * Extracts college draft histories from NFL Draft Hub's pfr-draft-history.json
 * (organized by NFL team, contains college field on every pick, PFR-sourced, 1936-2025)
 */

const fs = require('fs');
const path = require('path');

const srcFile = 'C:/Users/frago/NFL Draft Hub/nfl-draft-hub/data/pfr-draft-history.json';
const draftDir = path.join(__dirname, '..', 'data', 'draft');

const slugToColleges = {
  'alabama-crimson-tide': ['Alabama'],
  'arkansas-razorbacks': ['Arkansas'],
  'auburn-tigers': ['Auburn'],
  'florida-gators': ['Florida'],
  'georgia-bulldogs': ['Georgia'],
  'kentucky-wildcats': ['Kentucky'],
  'lsu-tigers': ['LSU'],
  'ole-miss-rebels': ['Mississippi'],
  'mississippi-state-bulldogs': ['Mississippi St.'],
  'missouri-tigers': ['Missouri'],
  'south-carolina-gamecocks': ['South Carolina'],
  'tennessee-volunteers': ['Tennessee'],
  'texas-am-aggies': ['Texas A&M'],
  'vanderbilt-commodores': ['Vanderbilt'],
  'texas-longhorns': ['Texas'],
  'oklahoma-sooners': ['Oklahoma'],
  'ohio-state-buckeyes': ['Ohio St.'],
  'michigan-wolverines': ['Michigan'],
  'penn-state-nittany-lions': ['Penn St.'],
  'wisconsin-badgers': ['Wisconsin'],
  'iowa-hawkeyes': ['Iowa'],
  'michigan-state-spartans': ['Michigan St.'],
  'minnesota-golden-gophers': ['Minnesota'],
  'illinois-fighting-illini': ['Illinois'],
  'indiana-hoosiers': ['Indiana'],
  'purdue-boilermakers': ['Purdue'],
  'nebraska-cornhuskers': ['Nebraska'],
  'northwestern-wildcats': ['Northwestern'],
  'maryland-terrapins': ['Maryland'],
  'rutgers-scarlet-knights': ['Rutgers'],
  'oregon-ducks': ['Oregon'],
  'usc-trojans': ['USC'],
  'washington-huskies': ['Washington'],
  'ucla-bruins': ['UCLA'],
  'clemson-tigers': ['Clemson'],
  'florida-state-seminoles': ['Florida St.'],
  'miami-hurricanes': ['Miami (FL)'],
  'notre-dame-fighting-irish': ['Notre Dame'],
  'north-carolina-tar-heels': ['North Carolina'],
  'nc-state-wolfpack': ['North Carolina St.'],
  'virginia-tech-hokies': ['Virginia Tech'],
  'virginia-cavaliers': ['Virginia'],
  'duke-blue-devils': ['Duke'],
  'wake-forest-demon-deacons': ['Wake Forest'],
  'louisville-cardinals': ['Louisville'],
  'pittsburgh-panthers': ['Pittsburgh'],
  'syracuse-orange': ['Syracuse'],
  'boston-college-eagles': ['Boston Col.'],
  'georgia-tech-yellow-jackets': ['Georgia Tech'],
  'stanford-cardinal': ['Stanford'],
  'california-golden-bears': ['California'],
  'smu-mustangs': ['SMU'],
  'tcu-horned-frogs': ['TCU'],
  'baylor-bears': ['Baylor'],
  'texas-tech-red-raiders': ['Texas Tech'],
  'kansas-state-wildcats': ['Kansas St.'],
  'kansas-jayhawks': ['Kansas'],
  'oklahoma-state-cowboys': ['Oklahoma St.'],
  'iowa-state-cyclones': ['Iowa St.'],
  'west-virginia-mountaineers': ['West Virginia'],
  'byu-cougars': ['BYU'],
  'cincinnati-bearcats': ['Cincinnati'],
  'ucf-knights': ['Central Florida'],
  'houston-cougars': ['Houston'],
  'arizona-wildcats': ['Arizona'],
  'arizona-state-sun-devils': ['Arizona St.'],
  'colorado-buffaloes': ['Colorado'],
  'utah-utes': ['Utah'],
  'oregon-state-beavers': ['Oregon St.'],
  'washington-state-cougars': ['Washington St.'],
  'boise-state-broncos': ['Boise St.'],
  'fresno-state-bulldogs': ['Fresno St.'],
  'san-diego-state-aztecs': ['San Diego St.'],
  'unlv-rebels': ['UNLV'],
  'san-jose-state-spartans': ['San Jose St.'],
  'air-force-falcons': ['Air Force'],
  'colorado-state-rams': ['Colorado St.'],
  'wyoming-cowboys': ['Wyoming'],
  'new-mexico-lobos': ['New Mexico'],
  'utah-state-aggies': ['Utah St.'],
  'nevada-wolf-pack': ['Nevada'],
  'hawaii-rainbow-warriors': ['Hawaii'],
  'memphis-tigers': ['Memphis'],
  'tulane-green-wave': ['Tulane'],
  'usf-bulls': ['South Florida'],
  'east-carolina-pirates': ['East Carolina'],
  'temple-owls': ['Temple'],
  'tulsa-golden-hurricane': ['Tulsa'],
  'navy-midshipmen': ['Navy'],
  'army-black-knights': ['Army'],
  'rice-owls': ['Rice'],
  'north-texas-mean-green': ['North Texas'],
  'utsa-roadrunners': ['Texas-San Antonio'],
  'charlotte-49ers': ['Charlotte'],
  'fau-owls': ['Florida Atlantic'],
  'uab-blazers': ['Ala-Birmingham'],
  'appalachian-state-mountaineers': ['Appalachian St.'],
  'coastal-carolina-chanticleers': ['Coastal Carolina'],
  'marshall-thundering-herd': ['Marshall'],
  'old-dominion-monarchs': ['Old Dominion'],
  'james-madison-dukes': ['James Madison'],
  'georgia-state-panthers': ['Georgia St.'],
  'georgia-southern-eagles': ['Georgia Southern'],
  'troy-trojans': ['Troy'],
  'south-alabama-jaguars': ['South Alabama'],
  'louisiana-ragin-cajuns': ['Louisiana'],
  'louisiana-tech-bulldogs': ['Louisiana Tech'],
  'arkansas-state-red-wolves': ['Arkansas St.'],
  'texas-state-bobcats': ['Texas St.'],
  'ul-monroe-warhawks': ['La-Monroe'],
  'southern-miss-golden-eagles': ['Southern Miss'],
  'ohio-bobcats': ['Ohio'],
  'miami-oh-redhawks': ['Miami (OH)'],
  'central-michigan-chippewas': ['Central Michigan'],
  'western-michigan-broncos': ['Western Michigan'],
  'toledo-rockets': ['Toledo'],
  'bowling-green-falcons': ['Bowling Green'],
  'buffalo-bulls': ['Buffalo'],
  'akron-zips': ['Akron'],
  'kent-state-golden-flashes': ['Kent St.'],
  'ball-state-cardinals': ['Ball St.'],
  'eastern-michigan-eagles': ['Eastern Michigan'],
  'northern-illinois-huskies': ['Northern Illinois'],
  'liberty-flames': ['Liberty'],
  'jacksonville-state-gamecocks': ['Jacksonville St.'],
  'sam-houston-bearkats': ['Sam Houston St.'],
  'kennesaw-state-owls': ['Kennesaw St.'],
  'new-mexico-state-aggies': ['New Mexico St.'],
  'middle-tennessee-blue-raiders': ['Middle Tenn. St.'],
  'western-kentucky-hilltoppers': ['Western Kentucky'],
  'fiu-panthers': ['Florida International'],
  'uconn-huskies': ['Connecticut'],
  'umass-minutemen': ['Massachusetts'],
};

// These have been manually verified from PFR — skip
const verified = new Set(['south-carolina-gamecocks']);

// Load source data
const src = JSON.parse(fs.readFileSync(srcFile, 'utf-8'));
let allPicks = [];
for (const team of Object.values(src)) {
  if (Array.isArray(team.picks)) {
    const nflTeamName = team.team || '';
    allPicks.push(...team.picks.map(p => ({ ...p, nflTeam: nflTeamName })));
  }
}

// Only real picks from 1967+
const realPicks = allPicks.filter(p => {
  const y = parseInt(p.year);
  return !isNaN(y) && y >= 1967 && p.player && p.player !== 'Player';
});

console.log('Total PFR picks 1967+:', realPicks.length, '\n');

const results = [];
let updated = 0;

for (const [slug, colleges] of Object.entries(slugToColleges)) {
  if (verified.has(slug)) {
    console.log('SKIP ' + slug + ' (manually verified)');
    continue;
  }

  const collegeSet = new Set(colleges);
  const jsonPath = path.join(draftDir, slug + '.json');

  // Filter picks, deduplicate by year+player name
  const seen = new Set();
  const picks = realPicks
    .filter(p => p.college && collegeSet.has(p.college))
    .filter(p => {
      const key = parseInt(p.year) + '|' + p.player.toLowerCase().replace(/[^a-z]/g, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(p => ({
      year: parseInt(p.year),
      round: parseInt(p.round) || 0,
      pick: parseInt(p.pick) || 0,
      name: p.player,
      position: p.position || 'Unknown',
      nflTeam: p.nflTeam || '',
    }))
    .sort((a, b) => b.year - a.year || a.round - b.round || a.pick - b.pick);

  const existing = fs.existsSync(jsonPath)
    ? JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
    : null;

  // nflTeam comes directly from pfr-draft-history.json (full team names) — no need to preserve old data

  const result = {
    teamId: existing?.teamId || slug,
    teamSlug: slug,
    teamName: existing?.teamName || colleges[0],
    draftPicks: picks,
  };

  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2));
  results.push({ name: result.teamName, count: picks.length });
  console.log('✓ ' + result.teamName + ': ' + picks.length + ' picks');
  updated++;
}

console.log('\nDone! Updated ' + updated + ' teams.');
console.log('\nTop 10 by all-time picks:');
results.sort((a, b) => b.count - a.count).slice(0, 10).forEach(r => {
  console.log('  ' + r.name + ': ' + r.count);
});
