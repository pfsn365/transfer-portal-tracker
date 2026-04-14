/**
 * Builds NFL draft JSON files by merging three sources:
 *  1. nflverse draft_picks.csv  — PFR-sourced, 1980–present, high accuracy
 *  2. JackLich10 nfl_draft_prospects.csv — ESPN-sourced, 1967–2021 (fills pre-1980 gaps)
 *  3. git HEAD JSON files — original PFR scrape (catches anything both CSVs miss)
 *
 * Deduplication is by (year, normalized player name).
 *
 * Usage:
 *   npx tsx tools/importDraftFromCSV.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

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

// ── College name mappings ────────────────────────────────────────────────────
// Each slug maps to { nflverse: string[], espn: string[] }
// nflverse uses PFR abbreviations; espn uses full names

const teamMappings: Record<string, { nflverse: string[]; espn: string[]; teamName: string }> = {
  // SEC
  'alabama-crimson-tide':        { nflverse: ['Alabama'],            espn: ['Alabama'],            teamName: 'Alabama Crimson Tide' },
  'arkansas-razorbacks':         { nflverse: ['Arkansas'],           espn: ['Arkansas'],           teamName: 'Arkansas Razorbacks' },
  'auburn-tigers':               { nflverse: ['Auburn'],             espn: ['Auburn'],             teamName: 'Auburn Tigers' },
  'florida-gators':              { nflverse: ['Florida'],            espn: ['Florida'],            teamName: 'Florida Gators' },
  'georgia-bulldogs':            { nflverse: ['Georgia'],            espn: ['Georgia'],            teamName: 'Georgia Bulldogs' },
  'kentucky-wildcats':           { nflverse: ['Kentucky'],           espn: ['Kentucky'],           teamName: 'Kentucky Wildcats' },
  'lsu-tigers':                  { nflverse: ['LSU'],                espn: ['LSU'],                teamName: 'LSU Tigers' },
  'ole-miss-rebels':             { nflverse: ['Mississippi'],        espn: ['Ole Miss'],           teamName: 'Ole Miss Rebels' },
  'mississippi-state-bulldogs':  { nflverse: ['Mississippi St.'],    espn: ['Mississippi State'],  teamName: 'Mississippi State Bulldogs' },
  'missouri-tigers':             { nflverse: ['Missouri'],           espn: ['Missouri'],           teamName: 'Missouri Tigers' },
  'south-carolina-gamecocks':    { nflverse: ['South Carolina'],     espn: ['South Carolina'],     teamName: 'South Carolina Gamecocks' },
  'tennessee-volunteers':        { nflverse: ['Tennessee'],          espn: ['Tennessee'],          teamName: 'Tennessee Volunteers' },
  'texas-am-aggies':             { nflverse: ['Texas A&M'],          espn: ['Texas A&M'],          teamName: 'Texas A&M Aggies' },
  'vanderbilt-commodores':       { nflverse: ['Vanderbilt'],         espn: ['Vanderbilt'],         teamName: 'Vanderbilt Commodores' },
  'texas-longhorns':             { nflverse: ['Texas'],              espn: ['Texas'],              teamName: 'Texas Longhorns' },
  'oklahoma-sooners':            { nflverse: ['Oklahoma'],           espn: ['Oklahoma'],           teamName: 'Oklahoma Sooners' },

  // Big Ten
  'ohio-state-buckeyes':         { nflverse: ['Ohio St.'],           espn: ['Ohio State'],         teamName: 'Ohio State Buckeyes' },
  'michigan-wolverines':         { nflverse: ['Michigan'],           espn: ['Michigan'],           teamName: 'Michigan Wolverines' },
  'penn-state-nittany-lions':    { nflverse: ['Penn St.'],           espn: ['Penn State'],         teamName: 'Penn State Nittany Lions' },
  'wisconsin-badgers':           { nflverse: ['Wisconsin'],          espn: ['Wisconsin'],          teamName: 'Wisconsin Badgers' },
  'iowa-hawkeyes':               { nflverse: ['Iowa'],               espn: ['Iowa'],               teamName: 'Iowa Hawkeyes' },
  'michigan-state-spartans':     { nflverse: ['Michigan St.'],       espn: ['Michigan State'],     teamName: 'Michigan State Spartans' },
  'minnesota-golden-gophers':    { nflverse: ['Minnesota'],          espn: ['Minnesota'],          teamName: 'Minnesota Golden Gophers' },
  'illinois-fighting-illini':    { nflverse: ['Illinois'],           espn: ['Illinois'],           teamName: 'Illinois Fighting Illini' },
  'indiana-hoosiers':            { nflverse: ['Indiana'],            espn: ['Indiana'],            teamName: 'Indiana Hoosiers' },
  'purdue-boilermakers':         { nflverse: ['Purdue'],             espn: ['Purdue'],             teamName: 'Purdue Boilermakers' },
  'nebraska-cornhuskers':        { nflverse: ['Nebraska'],           espn: ['Nebraska'],           teamName: 'Nebraska Cornhuskers' },
  'northwestern-wildcats':       { nflverse: ['Northwestern'],       espn: ['Northwestern'],       teamName: 'Northwestern Wildcats' },
  'maryland-terrapins':          { nflverse: ['Maryland'],           espn: ['Maryland'],           teamName: 'Maryland Terrapins' },
  'rutgers-scarlet-knights':     { nflverse: ['Rutgers'],            espn: ['Rutgers'],            teamName: 'Rutgers Scarlet Knights' },
  'oregon-ducks':                { nflverse: ['Oregon'],             espn: ['Oregon'],             teamName: 'Oregon Ducks' },
  'usc-trojans':                 { nflverse: ['USC'],                espn: ['USC'],                teamName: 'USC Trojans' },
  'washington-huskies':          { nflverse: ['Washington'],         espn: ['Washington'],         teamName: 'Washington Huskies' },
  'ucla-bruins':                 { nflverse: ['UCLA'],               espn: ['UCLA'],               teamName: 'UCLA Bruins' },

  // ACC
  'clemson-tigers':              { nflverse: ['Clemson'],            espn: ['Clemson'],            teamName: 'Clemson Tigers' },
  'florida-state-seminoles':     { nflverse: ['Florida St.'],        espn: ['Florida State'],      teamName: 'Florida State Seminoles' },
  'miami-hurricanes':            { nflverse: ['Miami (FL)', 'Miami'], espn: ['Miami (FL)', 'Miami'], teamName: 'Miami Hurricanes' },
  'notre-dame-fighting-irish':   { nflverse: ['Notre Dame'],         espn: ['Notre Dame'],         teamName: 'Notre Dame Fighting Irish' },
  'north-carolina-tar-heels':    { nflverse: ['North Carolina'],     espn: ['North Carolina'],     teamName: 'North Carolina Tar Heels' },
  'nc-state-wolfpack':           { nflverse: ['North Carolina St.'], espn: ['NC State'],           teamName: 'NC State Wolfpack' },
  'virginia-tech-hokies':        { nflverse: ['Virginia Tech'],      espn: ['Virginia Tech'],      teamName: 'Virginia Tech Hokies' },
  'virginia-cavaliers':          { nflverse: ['Virginia'],           espn: ['Virginia'],           teamName: 'Virginia Cavaliers' },
  'duke-blue-devils':            { nflverse: ['Duke'],               espn: ['Duke'],               teamName: 'Duke Blue Devils' },
  'wake-forest-demon-deacons':   { nflverse: ['Wake Forest'],        espn: ['Wake Forest'],        teamName: 'Wake Forest Demon Deacons' },
  'louisville-cardinals':        { nflverse: ['Louisville'],         espn: ['Louisville'],         teamName: 'Louisville Cardinals' },
  'pittsburgh-panthers':         { nflverse: ['Pittsburgh'],         espn: ['Pittsburgh'],         teamName: 'Pittsburgh Panthers' },
  'syracuse-orange':             { nflverse: ['Syracuse'],           espn: ['Syracuse'],           teamName: 'Syracuse Orange' },
  'boston-college-eagles':       { nflverse: ['Boston College'],     espn: ['Boston College'],     teamName: 'Boston College Eagles' },
  'georgia-tech-yellow-jackets': { nflverse: ['Georgia Tech'],       espn: ['Georgia Tech'],       teamName: 'Georgia Tech Yellow Jackets' },
  'stanford-cardinal':           { nflverse: ['Stanford'],           espn: ['Stanford'],           teamName: 'Stanford Cardinal' },
  'california-golden-bears':     { nflverse: ['California'],         espn: ['California'],         teamName: 'California Golden Bears' },
  'smu-mustangs':                { nflverse: ['SMU'],                espn: ['SMU'],                teamName: 'SMU Mustangs' },

  // Big 12
  'tcu-horned-frogs':            { nflverse: ['TCU'],                espn: ['TCU'],                teamName: 'TCU Horned Frogs' },
  'baylor-bears':                { nflverse: ['Baylor'],             espn: ['Baylor'],             teamName: 'Baylor Bears' },
  'texas-tech-red-raiders':      { nflverse: ['Texas Tech'],         espn: ['Texas Tech'],         teamName: 'Texas Tech Red Raiders' },
  'kansas-state-wildcats':       { nflverse: ['Kansas St.'],         espn: ['Kansas State'],       teamName: 'Kansas State Wildcats' },
  'kansas-jayhawks':             { nflverse: ['Kansas'],             espn: ['Kansas'],             teamName: 'Kansas Jayhawks' },
  'oklahoma-state-cowboys':      { nflverse: ['Oklahoma St.'],       espn: ['Oklahoma State'],     teamName: 'Oklahoma State Cowboys' },
  'iowa-state-cyclones':         { nflverse: ['Iowa St.'],           espn: ['Iowa State'],         teamName: 'Iowa State Cyclones' },
  'west-virginia-mountaineers':  { nflverse: ['West Virginia'],      espn: ['West Virginia'],      teamName: 'West Virginia Mountaineers' },
  'byu-cougars':                 { nflverse: ['BYU'],                espn: ['BYU'],                teamName: 'BYU Cougars' },
  'cincinnati-bearcats':         { nflverse: ['Cincinnati'],         espn: ['Cincinnati'],         teamName: 'Cincinnati Bearcats' },
  'ucf-knights':                 { nflverse: ['UCF'],                espn: ['UCF'],                teamName: 'UCF Knights' },
  'houston-cougars':             { nflverse: ['Houston'],            espn: ['Houston'],            teamName: 'Houston Cougars' },
  'arizona-wildcats':            { nflverse: ['Arizona'],            espn: ['Arizona'],            teamName: 'Arizona Wildcats' },
  'arizona-state-sun-devils':    { nflverse: ['Arizona St.'],        espn: ['Arizona State'],      teamName: 'Arizona State Sun Devils' },
  'colorado-buffaloes':          { nflverse: ['Colorado'],           espn: ['Colorado'],           teamName: 'Colorado Buffaloes' },
  'utah-utes':                   { nflverse: ['Utah'],               espn: ['Utah'],               teamName: 'Utah Utes' },

  // Pac-12 remaining
  'oregon-state-beavers':        { nflverse: ['Oregon St.'],         espn: ['Oregon State'],       teamName: 'Oregon State Beavers' },
  'washington-state-cougars':    { nflverse: ['Washington St.'],     espn: ['Washington State'],   teamName: 'Washington State Cougars' },

  // Mountain West
  'boise-state-broncos':         { nflverse: ['Boise St.'],          espn: ['Boise State'],        teamName: 'Boise State Broncos' },
  'fresno-state-bulldogs':       { nflverse: ['Fresno St.'],         espn: ['Fresno State'],       teamName: 'Fresno State Bulldogs' },
  'san-diego-state-aztecs':      { nflverse: ['San Diego St.'],      espn: ['San Diego State'],    teamName: 'San Diego State Aztecs' },
  'unlv-rebels':                 { nflverse: ['UNLV'],               espn: ['UNLV'],               teamName: 'UNLV Rebels' },
  'san-jose-state-spartans':     { nflverse: ['San Jose St.'],       espn: ['San Jose State'],     teamName: 'San Jose State Spartans' },
  'air-force-falcons':           { nflverse: ['Air Force'],          espn: ['Air Force'],          teamName: 'Air Force Falcons' },
  'colorado-state-rams':         { nflverse: ['Colorado St.'],       espn: ['Colorado State'],     teamName: 'Colorado State Rams' },
  'wyoming-cowboys':             { nflverse: ['Wyoming'],            espn: ['Wyoming'],            teamName: 'Wyoming Cowboys' },
  'new-mexico-lobos':            { nflverse: ['New Mexico'],         espn: ['New Mexico'],         teamName: 'New Mexico Lobos' },
  'utah-state-aggies':           { nflverse: ['Utah St.'],           espn: ['Utah State'],         teamName: 'Utah State Aggies' },
  'nevada-wolf-pack':            { nflverse: ['Nevada'],             espn: ['Nevada'],             teamName: 'Nevada Wolf Pack' },
  'hawaii-rainbow-warriors':     { nflverse: ['Hawaii'],             espn: ['Hawaii'],             teamName: 'Hawaii Rainbow Warriors' },

  // American Athletic
  'memphis-tigers':              { nflverse: ['Memphis'],            espn: ['Memphis'],            teamName: 'Memphis Tigers' },
  'tulane-green-wave':           { nflverse: ['Tulane'],             espn: ['Tulane'],             teamName: 'Tulane Green Wave' },
  'usf-bulls':                   { nflverse: ['South Florida'],      espn: ['South Florida'],      teamName: 'USF Bulls' },
  'east-carolina-pirates':       { nflverse: ['East Carolina'],      espn: ['East Carolina'],      teamName: 'East Carolina Pirates' },
  'temple-owls':                 { nflverse: ['Temple'],             espn: ['Temple'],             teamName: 'Temple Owls' },
  'tulsa-golden-hurricane':      { nflverse: ['Tulsa'],              espn: ['Tulsa'],              teamName: 'Tulsa Golden Hurricane' },
  'navy-midshipmen':             { nflverse: ['Navy'],               espn: ['Navy'],               teamName: 'Navy Midshipmen' },
  'army-black-knights':          { nflverse: ['Army'],               espn: ['Army'],               teamName: 'Army Black Knights' },
  'rice-owls':                   { nflverse: ['Rice'],               espn: ['Rice'],               teamName: 'Rice Owls' },
  'north-texas-mean-green':      { nflverse: ['North Texas'],        espn: ['North Texas'],        teamName: 'North Texas Mean Green' },
  'utsa-roadrunners':            { nflverse: ['Texas-San Antonio'],  espn: ['UTSA'],               teamName: 'UTSA Roadrunners' },
  'charlotte-49ers':             { nflverse: ['Charlotte'],          espn: ['Charlotte'],          teamName: 'Charlotte 49ers' },
  'fau-owls':                    { nflverse: ['Florida Atlantic'],   espn: ['Florida Atlantic'],   teamName: 'FAU Owls' },
  'uab-blazers':                 { nflverse: ['UAB'],                espn: ['UAB'],                teamName: 'UAB Blazers' },

  // Sun Belt
  'appalachian-state-mountaineers': { nflverse: ['Appalachian St.'],  espn: ['Appalachian State'],  teamName: 'Appalachian State Mountaineers' },
  'coastal-carolina-chanticleers':  { nflverse: ['Coastal Carolina'], espn: ['Coastal Carolina'],   teamName: 'Coastal Carolina Chanticleers' },
  'marshall-thundering-herd':       { nflverse: ['Marshall'],          espn: ['Marshall'],           teamName: 'Marshall Thundering Herd' },
  'old-dominion-monarchs':          { nflverse: ['Old Dominion'],      espn: ['Old Dominion'],       teamName: 'Old Dominion Monarchs' },
  'james-madison-dukes':            { nflverse: ['James Madison'],     espn: ['James Madison'],      teamName: 'James Madison Dukes' },
  'georgia-state-panthers':         { nflverse: ['Georgia St.'],       espn: ['Georgia State'],      teamName: 'Georgia State Panthers' },
  'georgia-southern-eagles':        { nflverse: ['Georgia Southern'],  espn: ['Georgia Southern'],   teamName: 'Georgia Southern Eagles' },
  'troy-trojans':                   { nflverse: ['Troy'],              espn: ['Troy'],               teamName: 'Troy Trojans' },
  'south-alabama-jaguars':          { nflverse: ['South Alabama'],     espn: ['South Alabama'],      teamName: 'South Alabama Jaguars' },
  'louisiana-ragin-cajuns':         { nflverse: ['Louisiana'],         espn: ['Louisiana-Lafayette', 'Louisiana'], teamName: "Louisiana Ragin' Cajuns" },
  'louisiana-tech-bulldogs':        { nflverse: ['Louisiana Tech'],    espn: ['Louisiana Tech'],     teamName: 'Louisiana Tech Bulldogs' },
  'arkansas-state-red-wolves':      { nflverse: ['Arkansas St.'],      espn: ['Arkansas State'],     teamName: 'Arkansas State Red Wolves' },
  'texas-state-bobcats':            { nflverse: ['Texas St.'],         espn: ['Texas State'],        teamName: 'Texas State Bobcats' },
  'ul-monroe-warhawks':             { nflverse: ['La-Monroe'],         espn: ['Louisiana-Monroe', 'Louisiana Monroe'], teamName: 'UL Monroe Warhawks' },
  'southern-miss-golden-eagles':    { nflverse: ['Southern Miss'],     espn: ['Southern Miss'],      teamName: 'Southern Miss Golden Eagles' },

  // MAC
  'ohio-bobcats':                { nflverse: ['Ohio'],               espn: ['Ohio'],               teamName: 'Ohio Bobcats' },
  'miami-oh-redhawks':           { nflverse: ['Miami (OH)'],         espn: ['Miami (OH)'],         teamName: 'Miami (OH) RedHawks' },
  'central-michigan-chippewas':  { nflverse: ['Central Michigan'],   espn: ['Central Michigan'],   teamName: 'Central Michigan Chippewas' },
  'western-michigan-broncos':    { nflverse: ['Western Michigan'],   espn: ['Western Michigan'],   teamName: 'Western Michigan Broncos' },
  'toledo-rockets':              { nflverse: ['Toledo'],             espn: ['Toledo'],             teamName: 'Toledo Rockets' },
  'bowling-green-falcons':       { nflverse: ['Bowling Green'],      espn: ['Bowling Green'],      teamName: 'Bowling Green Falcons' },
  'buffalo-bulls':               { nflverse: ['Buffalo'],            espn: ['Buffalo'],            teamName: 'Buffalo Bulls' },
  'akron-zips':                  { nflverse: ['Akron'],              espn: ['Akron'],              teamName: 'Akron Zips' },
  'kent-state-golden-flashes':   { nflverse: ['Kent St.'],           espn: ['Kent State'],         teamName: 'Kent State Golden Flashes' },
  'ball-state-cardinals':        { nflverse: ['Ball St.'],           espn: ['Ball State'],         teamName: 'Ball State Cardinals' },
  'eastern-michigan-eagles':     { nflverse: ['Eastern Michigan'],   espn: ['Eastern Michigan'],   teamName: 'Eastern Michigan Eagles' },
  'northern-illinois-huskies':   { nflverse: ['Northern Illinois'],  espn: ['Northern Illinois'],  teamName: 'Northern Illinois Huskies' },

  // C-USA / Independents
  'liberty-flames':              { nflverse: ['Liberty'],            espn: ['Liberty'],            teamName: 'Liberty Flames' },
  'jacksonville-state-gamecocks':{ nflverse: ['Jacksonville St.'],   espn: ['Jacksonville State'], teamName: 'Jacksonville State Gamecocks' },
  'sam-houston-bearkats':        { nflverse: ['Sam Houston St.'],    espn: ['Sam Houston State'],  teamName: 'Sam Houston Bearkats' },
  'kennesaw-state-owls':         { nflverse: ['Kennesaw St.'],       espn: ['Kennesaw State'],     teamName: 'Kennesaw State Owls' },
  'new-mexico-state-aggies':     { nflverse: ['New Mexico St.'],     espn: ['New Mexico State'],   teamName: 'New Mexico State Aggies' },
  'middle-tennessee-blue-raiders':{ nflverse: ['Middle Tenn. St.'],  espn: ['Middle Tennessee'],   teamName: 'Middle Tennessee Blue Raiders' },
  'western-kentucky-hilltoppers':{ nflverse: ['Western Kentucky'],   espn: ['Western Kentucky'],   teamName: 'Western Kentucky Hilltoppers' },
  'fiu-panthers':                { nflverse: ['Florida International'], espn: ['Florida International'], teamName: 'FIU Panthers' },
  'uconn-huskies':               { nflverse: ['Connecticut'],        espn: ['UConn', 'Connecticut'], teamName: 'UConn Huskies' },
  'umass-minutemen':             { nflverse: ['Massachusetts'],      espn: ['Massachusetts'],      teamName: 'UMass Minutemen' },
};

// ── Parsers ──────────────────────────────────────────────────────────────────

function parseNflverse(csvText: string, collegeNames: string[]): DraftPick[] {
  const nameSet = new Set(collegeNames);
  const lines = csvText.split('\n');
  const h = lines[0].split(',');
  const idx = {
    season: h.indexOf('season'),
    round: h.indexOf('round'),
    pick: h.indexOf('pick'),
    team: h.indexOf('team'),
    name: h.indexOf('pfr_player_name'),
    pos: h.indexOf('position'),
    college: h.indexOf('college'),
  };

  const picks: DraftPick[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (!nameSet.has(cols[idx.college])) continue;
    const year = parseInt(cols[idx.season]);
    const round = parseInt(cols[idx.round]);
    const pick = parseInt(cols[idx.pick]);
    if (!year || !cols[idx.name]) continue;
    picks.push({ year, round: isNaN(round) ? 0 : round, pick: isNaN(pick) ? 0 : pick, name: cols[idx.name], position: cols[idx.pos] || 'Unknown', nflTeam: cols[idx.team] || '' });
  }
  return picks;
}

function parseEspnCSV(csvText: string, collegeNames: string[]): DraftPick[] {
  const nameSet = new Set(collegeNames);
  const lines = csvText.split('\n');
  const h = lines[0].split(',');
  const idx = {
    year: h.indexOf('draft_year'),
    round: h.indexOf('round'),
    overall: h.indexOf('overall'),
    pick: h.indexOf('pick'),
    name: h.indexOf('player_name'),
    pos: h.indexOf('pos_abbr'),
    school: h.indexOf('school'),
    team: h.indexOf('team'),
  };

  const picks: DraftPick[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (!nameSet.has(cols[idx.school])) continue;
    const year = parseInt(cols[idx.year]);
    const round = parseInt(cols[idx.round]);
    const overall = parseInt(cols[idx.overall]);
    const pick = parseInt(cols[idx.pick]);
    if (!year || !cols[idx.name]) continue;
    if (isNaN(round) && isNaN(overall) && isNaN(pick)) continue; // UDFA
    picks.push({ year, round: isNaN(round) ? 0 : round, pick: isNaN(pick) ? (isNaN(overall) ? 0 : overall) : pick, name: cols[idx.name], position: cols[idx.pos] || 'Unknown', nflTeam: cols[idx.team] || '' });
  }
  return picks;
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, '');
}

function unionPicks(...sources: DraftPick[][]): DraftPick[] {
  const seen = new Set<string>();
  const result: DraftPick[] = [];
  for (const source of sources) {
    for (const p of source) {
      const key = `${p.year}|${normalizeName(p.name)}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(p);
      }
    }
  }
  return result;
}

function getGitPicks(slug: string): DraftPick[] {
  try {
    const json = execSync(`git show HEAD:data/draft/${slug}.json`, { encoding: 'utf-8' });
    return JSON.parse(json).draftPicks || [];
  } catch { return []; }
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const nflversePath = 'C:/Users/frago/Downloads/nflverse_draft_picks.csv';
  const espnPath = 'C:/Users/frago/Downloads/nfl_draft_prospects.csv';
  const draftDir = path.join(process.cwd(), 'data', 'draft');

  if (!fs.existsSync(nflversePath)) { console.error('Missing nflverse CSV'); process.exit(1); }
  if (!fs.existsSync(espnPath)) { console.error('Missing ESPN CSV'); process.exit(1); }

  console.log('Loading CSVs...');
  const nflverseCSV = fs.readFileSync(nflversePath, 'utf-8');
  const espnCSV = fs.readFileSync(espnPath, 'utf-8');
  console.log('Done.\n');

  let updated = 0;

  for (const [slug, { nflverse, espn, teamName }] of Object.entries(teamMappings)) {
    const jsonPath = path.join(draftDir, `${slug}.json`);

    // Source 1: nflverse (1980–present, high quality)
    const nflversePicks = parseNflverse(nflverseCSV, nflverse);

    // Source 2: ESPN CSV (1967–2021), only use pre-1980 to fill gaps
    const espnPre1980 = parseEspnCSV(espnCSV, espn).filter(p => p.year < 1980);

    // Source 3: git original PFR scrape (may have unique picks from either CSV)
    const gitPicks = getGitPicks(slug);

    // Load current file — may contain manually verified data (e.g. pasted from PFR)
    const existingPicks: DraftPick[] = fs.existsSync(jsonPath)
      ? JSON.parse(fs.readFileSync(jsonPath, 'utf-8')).draftPicks || []
      : [];
    const recent = existingPicks.filter(p => p.year >= 2022);

    // UNION priority: nflverse (PFR-quality 1980+) → ESPN pre-1980 → git pre-1980 → current file (catches manual corrections)
    const allPicks = unionPicks(
      nflversePicks,                        // PFR-quality, 1980-present
      espnPre1980,                          // ESPN pre-1980 fills
      gitPicks.filter(p => p.year < 1980), // git pre-1980 backup
      recent,                              // 2022+ in case nflverse missed something
      existingPicks,                       // preserve any manually corrected data
    ).sort((a, b) => b.year - a.year || a.round - b.round || a.pick - b.pick);

    const existing = fs.existsSync(jsonPath)
      ? JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
      : null;

    const result: DraftData = {
      teamId: existing?.teamId || slug,
      teamSlug: slug,
      teamName: existing?.teamName || teamName,
      draftPicks: allPicks,
    };

    fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2));

    const pre1980count = allPicks.filter(p => p.year < 1980).length;
    console.log(`✓ ${teamName}: ${allPicks.length} total (${pre1980count} pre-1980)`);
    updated++;
  }

  console.log(`\nDone! Updated ${updated} teams.`);

  // Spot-check South Carolina
  const sc = JSON.parse(fs.readFileSync(path.join(draftDir, 'south-carolina-gamecocks.json'), 'utf-8'));
  console.log(`\nSouth Carolina: ${sc.draftPicks.length} picks`);
}

main();
