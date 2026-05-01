import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const RECRUITS_DIR = path.join(process.cwd(), 'public', 'data', 'cfbd');
const BATTLE_YEARS = 5;
const CURRENT_YEAR = new Date().getFullYear();
const START_YEAR = CURRENT_YEAR - BATTLE_YEARS + 1;

// Team ID (lowercase) → home state abbreviation
const TEAM_STATE: Record<string, string> = {
  alabama: 'AL', arkansas: 'AR', auburn: 'AL', florida: 'FL', georgia: 'GA',
  kentucky: 'KY', lsu: 'LA', 'ole miss': 'MS', 'mississippi state': 'MS',
  missouri: 'MO', oklahoma: 'OK', 'south carolina': 'SC', tennessee: 'TN',
  texas: 'TX', 'texas a&m': 'TX', vanderbilt: 'TN',
  illinois: 'IL', indiana: 'IN', iowa: 'IA', maryland: 'MD', michigan: 'MI',
  'michigan state': 'MI', minnesota: 'MN', nebraska: 'NE', northwestern: 'IL',
  'ohio state': 'OH', oregon: 'OR', 'penn state': 'PA', purdue: 'IN',
  rutgers: 'NJ', ucla: 'CA', usc: 'CA', washington: 'WA', wisconsin: 'WI',
  arizona: 'AZ', 'arizona state': 'AZ', baylor: 'TX', byu: 'UT',
  cincinnati: 'OH', colorado: 'CO', houston: 'TX', 'iowa state': 'IA',
  kansas: 'KS', 'kansas state': 'KS', 'oklahoma state': 'OK', tcu: 'TX',
  'texas tech': 'TX', ucf: 'FL', utah: 'UT', 'west virginia': 'WV',
  'boston college': 'MA', california: 'CA', clemson: 'SC', duke: 'NC',
  'florida state': 'FL', 'georgia tech': 'GA', louisville: 'KY', miami: 'FL',
  'north carolina': 'NC', 'north carolina state': 'NC', pittsburgh: 'PA',
  smu: 'TX', stanford: 'CA', syracuse: 'NY', virginia: 'VA',
  'virginia tech': 'VA', 'wake forest': 'NC',
  army: 'NY', navy: 'MD', 'notre dame': 'IN', connecticut: 'CT',
  memphis: 'TN', usf: 'FL', 'east carolina': 'NC', tulane: 'LA', tulsa: 'OK',
  'boise state': 'ID', 'fresno state': 'CA', 'san diego state': 'CA',
  'san jose state': 'CA', unlv: 'NV', 'utah state': 'UT', wyoming: 'WY',
  'colorado state': 'CO', nevada: 'NV', hawaii: 'HI', 'new mexico': 'NM',
  'air force': 'CO', 'appalachian state': 'NC', 'georgia southern': 'GA',
  'georgia state': 'GA', louisiana: 'LA', marshall: 'WV', 'south alabama': 'AL',
  'arkansas state': 'AR', troy: 'AL', 'coastal carolina': 'SC',
  'louisiana tech': 'LA', utep: 'TX', utsa: 'TX', 'western kentucky': 'KY',
  'middle tennessee state': 'TN', 'new mexico state': 'NM', liberty: 'VA',
  'james madison': 'VA', 'old dominion': 'VA', 'southern miss': 'MS',
  'texas state': 'TX', 'louisiana-monroe': 'LA',
  akron: 'OH', 'ball state': 'IN', 'bowling green': 'OH', buffalo: 'NY',
  'central michigan': 'MI', 'eastern michigan': 'MI', 'kent state': 'OH',
  massachusetts: 'MA', 'miami (oh)': 'OH', 'northern illinois': 'IL',
  ohio: 'OH', toledo: 'OH', 'western michigan': 'MI',
  'north texas': 'TX', uab: 'AL', charlotte: 'NC', rice: 'TX',
  fau: 'FL', 'florida international': 'FL',
};

// Map team ID (lowercase) to the committedTo name used in recruiting data
const CFBD_SCHOOL: Record<string, string> = {
  'ole miss': 'Mississippi', 'mississippi state': 'Mississippi State',
  'texas a&m': 'Texas A&M', lsu: 'LSU', byu: 'BYU', usc: 'USC', ucf: 'UCF',
  smu: 'SMU', tcu: 'TCU', ucla: 'UCLA', uab: 'UAB', usf: 'South Florida',
  utsa: 'UTSA', utep: 'UTEP', unlv: 'UNLV', fau: 'Florida Atlantic',
  'north carolina state': 'NC State', 'miami (oh)': 'Miami (OH)',
  'louisiana-monroe': 'Louisiana Monroe', 'appalachian state': 'Appalachian State',
  'coastal carolina': 'Coastal Carolina', 'florida international': 'FIU',
  'middle tennessee state': 'Middle Tennessee', 'new mexico state': 'New Mexico State',
  'san jose state': 'San José State', 'east carolina': 'East Carolina',
  'georgia southern': 'Georgia Southern', 'georgia state': 'Georgia State',
  'south alabama': 'South Alabama', 'southern miss': 'Southern Miss',
  'texas state': 'Texas State', 'james madison': 'James Madison',
  'old dominion': 'Old Dominion', 'western kentucky': 'Western Kentucky',
  'louisiana tech': 'Louisiana Tech', 'north texas': 'North Texas',
  'ball state': 'Ball State', 'bowling green': 'Bowling Green',
  'central michigan': 'Central Michigan', 'eastern michigan': 'Eastern Michigan',
  'kent state': 'Kent State', 'western michigan': 'Western Michigan',
  'northern illinois': 'Northern Illinois',
  'notre dame': 'Notre Dame', 'boston college': 'Boston College',
  'wake forest': 'Wake Forest', 'virginia tech': 'Virginia Tech',
  'north carolina': 'North Carolina', 'ohio state': 'Ohio State',
  'penn state': 'Penn State', 'michigan state': 'Michigan State',
  'iowa state': 'Iowa State', 'kansas state': 'Kansas State',
  'oklahoma state': 'Oklahoma State', 'west virginia': 'West Virginia',
  'texas tech': 'Texas Tech', 'arizona state': 'Arizona State',
  'florida state': 'Florida State', 'georgia tech': 'Georgia Tech',
  'south carolina': 'South Carolina',
};

function toCfbdSchool(id: string): string {
  return CFBD_SCHOOL[id] ?? id.replace(/\b\w/g, c => c.toUpperCase());
}

interface Recruit {
  name: string;
  stars: number;
  rating: number;
  state: string;
  classYear: number;
  committedTo: string;
}

function loadRecruits(year: number): Recruit[] {
  const fp = path.join(RECRUITS_DIR, `recruits-${year}.json`);
  try { return JSON.parse(fs.readFileSync(fp, 'utf-8')) as Recruit[]; }
  catch { return []; }
}

export interface RecruitingBattleResponse {
  t1: { totalCommits: number; avgStars: number; fiveStars: number; fourStars: number; homeStateCommits: number; rivalStateCommits: number };
  t2: { totalCommits: number; avgStars: number; fiveStars: number; fourStars: number; homeStateCommits: number; rivalStateCommits: number };
  t1HomeState: string | null;
  t2HomeState: string | null;
  sharedStates: { state: string; t1: number; t2: number }[];
  years: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const team1 = searchParams.get('team1')?.toLowerCase().trim() ?? '';
  const team2 = searchParams.get('team2')?.toLowerCase().trim() ?? '';
  if (!team1 || !team2) return NextResponse.json({ error: 'Two teams required' }, { status: 400 });

  const school1 = toCfbdSchool(team1);
  const school2 = toCfbdSchool(team2);
  const state1 = TEAM_STATE[team1] ?? null;
  const state2 = TEAM_STATE[team2] ?? null;

  // Load last 5 years of recruits
  const allRecruits: Recruit[] = [];
  for (let y = START_YEAR; y <= CURRENT_YEAR; y++) {
    allRecruits.push(...loadRecruits(y));
  }

  const t1Recruits = allRecruits.filter(r => r.committedTo === school1);
  const t2Recruits = allRecruits.filter(r => r.committedTo === school2);

  function stats(recruits: Recruit[], homeState: string | null, rivalState: string | null) {
    const completed = recruits.filter(r => r.stars > 0);
    const avgStars = completed.length ? completed.reduce((s, r) => s + r.stars, 0) / completed.length : 0;
    return {
      totalCommits: recruits.length,
      avgStars: Math.round(avgStars * 10) / 10,
      fiveStars: recruits.filter(r => r.stars === 5).length,
      fourStars: recruits.filter(r => r.stars === 4).length,
      homeStateCommits: homeState ? recruits.filter(r => r.state === homeState).length : 0,
      rivalStateCommits: rivalState ? recruits.filter(r => r.state === rivalState).length : 0,
    };
  }

  // Find top shared recruiting states (states where both teams got 2+ commits)
  const stateCounts: Record<string, { t1: number; t2: number }> = {};
  for (const r of t1Recruits) {
    if (!stateCounts[r.state]) stateCounts[r.state] = { t1: 0, t2: 0 };
    stateCounts[r.state].t1++;
  }
  for (const r of t2Recruits) {
    if (!stateCounts[r.state]) stateCounts[r.state] = { t1: 0, t2: 0 };
    stateCounts[r.state].t2++;
  }
  const sharedStates = Object.entries(stateCounts)
    .filter(([, v]) => v.t1 > 0 && v.t2 > 0)
    .map(([state, v]) => ({ state, t1: v.t1, t2: v.t2 }))
    .sort((a, b) => (b.t1 + b.t2) - (a.t1 + a.t2))
    .slice(0, 6);

  return NextResponse.json({
    t1: stats(t1Recruits, state1, state2),
    t2: stats(t2Recruits, state2, state1),
    t1HomeState: state1,
    t2HomeState: state2,
    sharedStates,
    years: `${START_YEAR}–${CURRENT_YEAR}`,
  } as RecruitingBattleResponse, {
    headers: { 'Cache-Control': 'public, max-age=86400' },
  });
}
