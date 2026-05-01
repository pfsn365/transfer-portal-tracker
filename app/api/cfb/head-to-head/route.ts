import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Maps our team IDs (lowercase) to CFBD school names (lowercased for comparison).
// Only needed for teams where our ID doesn't match CFBD's name when lowercased.
const CFBD_NAME: Record<string, string> = {
  fau: 'florida atlantic',
  usf: 'south florida',
  hawaii: "hawai'i",
  'san jose state': 'san josé state',
};

function toCfbdLower(id: string): string {
  return CFBD_NAME[id] ?? id.toLowerCase();
}

interface CfbdGame {
  season: number;
  week: number;
  season_type: string;
  neutral_site: boolean;
  venue: string | null;
  notes: string | null;
  home_team: string;
  home_points: number | null;
  away_team: string;
  away_points: number | null;
}

export interface H2HGame {
  season: number;
  week: number;
  seasonType: 'regular' | 'postseason';
  neutralSite: boolean;
  venue: string | null;
  notes: string | null;
  homeTeamId: 'team1' | 'team2';
  team1Points: number | null;
  team2Points: number | null;
  winner: 'team1' | 'team2' | 'tie' | null;
  margin: number | null;
}

export interface H2HStats {
  team1Wins: number;
  team2Wins: number;
  ties: number;
  totalGames: number;
  team1WinPct: number;
  currentStreak: { team: 'team1' | 'team2'; count: number } | null;
  longestStreak1: number;
  longestStreak2: number;
  team1AvgMargin: number;
  team2AvgMargin: number;
  atTeam1: { team1W: number; team2W: number; t: number };
  atTeam2: { team1W: number; team2W: number; t: number };
  neutral: { team1W: number; team2W: number; t: number };
  regularSeason: { team1W: number; team2W: number; t: number };
  postseason: { team1W: number; team2W: number; t: number };
  decadeRecords: Record<string, { team1W: number; team2W: number; t: number }>;
  last5: { team1W: number; team2W: number };
  last10: { team1W: number; team2W: number };
  biggestTeam1Win: H2HGame | null;
  biggestTeam2Win: H2HGame | null;
}

export interface H2HResponse {
  games: H2HGame[];
  stats: H2HStats;
  team1: string;
  team2: string;
}

const GAMES_DIR = path.join(process.cwd(), 'public', 'data', 'cfbd');
const START_YEAR = 1950;

function readGamesForYear(year: number): CfbdGame[] {
  const filePath = path.join(GAMES_DIR, `games-${year}.json`);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as CfbdGame[];
  } catch {
    return [];
  }
}

function computeStats(games: H2HGame[]): H2HStats {
  const completed = games.filter(g => g.winner !== null);
  const byDate = [...completed].sort((a, b) =>
    b.season !== a.season ? b.season - a.season : b.week - a.week
  );

  let team1Wins = 0, team2Wins = 0, ties = 0;
  let t1MSum = 0, t2MSum = 0, t1MCount = 0, t2MCount = 0;
  const atTeam1 = { team1W: 0, team2W: 0, t: 0 };
  const atTeam2 = { team1W: 0, team2W: 0, t: 0 };
  const neutral = { team1W: 0, team2W: 0, t: 0 };
  const regularSeason = { team1W: 0, team2W: 0, t: 0 };
  const postseason = { team1W: 0, team2W: 0, t: 0 };
  const decadeRecords: Record<string, { team1W: number; team2W: number; t: number }> = {};
  let biggestTeam1Win: H2HGame | null = null;
  let biggestTeam2Win: H2HGame | null = null;

  for (const g of completed) {
    const decade = `${Math.floor(g.season / 10) * 10}s`;
    if (!decadeRecords[decade]) decadeRecords[decade] = { team1W: 0, team2W: 0, t: 0 };
    const loc = g.neutralSite ? neutral : g.homeTeamId === 'team1' ? atTeam1 : atTeam2;
    const sea = g.seasonType === 'regular' ? regularSeason : postseason;

    if (g.winner === 'team1') {
      team1Wins++; loc.team1W++; sea.team1W++; decadeRecords[decade].team1W++;
      if (g.margin !== null) { t1MSum += g.margin; t1MCount++; }
      if (!biggestTeam1Win || (g.margin ?? 0) > (biggestTeam1Win.margin ?? 0)) biggestTeam1Win = g;
    } else if (g.winner === 'team2') {
      team2Wins++; loc.team2W++; sea.team2W++; decadeRecords[decade].team2W++;
      if (g.margin !== null) { t2MSum += Math.abs(g.margin); t2MCount++; }
      if (!biggestTeam2Win || Math.abs(g.margin ?? 0) > Math.abs(biggestTeam2Win.margin ?? 0)) biggestTeam2Win = g;
    } else {
      ties++; loc.t++; sea.t++; decadeRecords[decade].t++;
    }
  }

  let currentStreak: H2HStats['currentStreak'] = null;
  for (const g of byDate) {
    if (g.winner === 'tie') continue;
    if (!currentStreak) currentStreak = { team: g.winner as 'team1' | 'team2', count: 1 };
    else if (currentStreak.team === g.winner) currentStreak.count++;
    else break;
  }

  let ls1 = 0, ls2 = 0, c1 = 0, c2 = 0;
  for (const g of [...completed].sort((a, b) => a.season - b.season || a.week - b.week)) {
    if (g.winner === 'team1') { c1++; c2 = 0; ls1 = Math.max(ls1, c1); }
    else if (g.winner === 'team2') { c2++; c1 = 0; ls2 = Math.max(ls2, c2); }
    else { c1 = 0; c2 = 0; }
  }

  const nonTie = byDate.filter(g => g.winner !== 'tie');
  const l5 = nonTie.slice(0, 5);
  const l10 = nonTie.slice(0, 10);

  return {
    team1Wins, team2Wins, ties, totalGames: completed.length,
    team1WinPct: completed.length ? team1Wins / completed.length : 0,
    currentStreak, longestStreak1: ls1, longestStreak2: ls2,
    team1AvgMargin: t1MCount ? Math.round(t1MSum / t1MCount * 10) / 10 : 0,
    team2AvgMargin: t2MCount ? Math.round(t2MSum / t2MCount * 10) / 10 : 0,
    atTeam1, atTeam2, neutral, regularSeason, postseason, decadeRecords,
    last5: { team1W: l5.filter(g => g.winner === 'team1').length, team2W: l5.filter(g => g.winner === 'team2').length },
    last10: { team1W: l10.filter(g => g.winner === 'team1').length, team2W: l10.filter(g => g.winner === 'team2').length },
    biggestTeam1Win, biggestTeam2Win,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const team1 = searchParams.get('team1')?.toLowerCase().trim() ?? '';
  const team2 = searchParams.get('team2')?.toLowerCase().trim() ?? '';

  if (!team1 || !team2 || team1 === team2) {
    return NextResponse.json({ error: 'Two different teams required' }, { status: 400 });
  }

  const t1Lower = toCfbdLower(team1);
  const t2Lower = toCfbdLower(team2);

  const currentYear = new Date().getFullYear();
  const allRaw: CfbdGame[] = [];

  for (let year = START_YEAR; year <= currentYear; year++) {
    const yearGames = readGamesForYear(year);
    for (const g of yearGames) {
      if (!g.home_team || !g.away_team) continue;
      const ht = g.home_team.toLowerCase();
      const at = g.away_team.toLowerCase();
      if (
        (ht === t1Lower || at === t1Lower) &&
        (ht === t2Lower || at === t2Lower)
      ) {
        allRaw.push(g);
      }
    }
  }

  const games: H2HGame[] = allRaw
    .map(g => {
      const homeIsT1 = g.home_team.toLowerCase() === t1Lower;
      const t1Pts = homeIsT1 ? g.home_points : g.away_points;
      const t2Pts = homeIsT1 ? g.away_points : g.home_points;
      let winner: H2HGame['winner'] = null;
      let margin: number | null = null;
      if (t1Pts !== null && t2Pts !== null) {
        margin = t1Pts - t2Pts;
        winner = margin > 0 ? 'team1' : margin < 0 ? 'team2' : 'tie';
      }
      return {
        season: g.season, week: g.week,
        seasonType: (g.season_type === 'regular' ? 'regular' : 'postseason') as H2HGame['seasonType'],
        neutralSite: g.neutral_site, venue: g.venue, notes: g.notes ?? null,
        homeTeamId: (homeIsT1 ? 'team1' : 'team2') as H2HGame['homeTeamId'],
        team1Points: t1Pts, team2Points: t2Pts, winner, margin,
      };
    })
    .sort((a, b) => b.season !== a.season ? b.season - a.season : b.week - a.week);

  const stats = computeStats(games);
  return NextResponse.json({ games, stats, team1, team2 } as H2HResponse, {
    headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' },
  });
}
