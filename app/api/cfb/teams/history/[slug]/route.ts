import { NextRequest, NextResponse } from 'next/server';
import { getTeamBySlug } from '@/data/teams';
import fs from 'fs';
import path from 'path';

// Yearly record structure
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

// Helper to read history data from JSON file
function getHistoryData(teamSlug: string): HistoryData | null {
  const historyDir = path.join(process.cwd(), 'data', 'history');

  // Try direct file path first (most common case)
  const directPath = path.join(historyDir, `${teamSlug}.json`);
  try {
    if (fs.existsSync(directPath)) {
      return JSON.parse(fs.readFileSync(directPath, 'utf-8'));
    }
  } catch (error) {
    // Fall through to directory scan
  }

  // Fallback: scan directory only if direct match fails
  try {
    const files = fs.readdirSync(historyDir);
    const teamIdPart = teamSlug.split('-')[0];
    const matchingFile = files.find(file =>
      file.startsWith(teamIdPart) || file.replace('.json', '').includes(teamIdPart)
    );

    if (matchingFile) {
      const filePath = path.join(historyDir, matchingFile);
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (error) {
    console.error('Error reading history data:', error);
  }

  return null;
}

// Get history statistics summary
function getHistoryStats(records: YearlyRecord[]) {
  if (!records.length) {
    return {
      totalSeasons: 0,
      totalWins: 0,
      totalLosses: 0,
      winPercentage: '0.000',
      bowlAppearances: 0,
      bowlWins: 0,
      bowlLosses: 0,
      apTop25Finishes: 0,
      apTop10Finishes: 0,
      cfpAppearances: 0,
      nationalChampionships: 0,
      coaches: [],
      bestSeason: null,
      currentStreak: null,
    };
  }

  const totalWins = records.reduce((sum, r) => sum + r.wins, 0);
  const totalLosses = records.reduce((sum, r) => sum + r.losses, 0);
  const totalGames = totalWins + totalLosses;
  const winPercentage = totalGames > 0 ? (totalWins / totalGames).toFixed(3) : '0.000';

  // Bowl stats
  const bowlGames = records.filter(r => r.bowl);
  const bowlWins = bowlGames.filter(r => r.bowl?.includes('(W)')).length;
  const bowlLosses = bowlGames.filter(r => r.bowl?.includes('(L)')).length;

  // Rankings stats
  const apTop25Finishes = records.filter(r => r.apPost && r.apPost <= 25).length;
  const apTop10Finishes = records.filter(r => r.apPost && r.apPost <= 10).length;
  const cfpAppearances = records.filter(r => r.cfpFinal && r.cfpFinal <= 4).length;

  // National Championships (CFP era + BCS)
  const nationalChampionships = records.filter(r =>
    (r.bowl?.includes('CFP National Championship (W)') || r.bowl?.includes('BCS Championship (W)'))
  ).length;

  // Unique coaches with their records
  // Skip combined coach entries (e.g., "Tommy Bowden / Dabo Swinney") - these are transition years
  const coachMap = new Map<string, { wins: number; losses: number; years: number[] }>();
  records.forEach(r => {
    // Skip combined coach entries for the coaching summary
    if (r.coach.includes(' / ')) return;

    const existing = coachMap.get(r.coach) || { wins: 0, losses: 0, years: [] };
    existing.wins += r.wins;
    existing.losses += r.losses;
    existing.years.push(r.year);
    coachMap.set(r.coach, existing);
  });

  const coaches = Array.from(coachMap.entries()).map(([name, stats]) => ({
    name,
    wins: stats.wins,
    losses: stats.losses,
    seasons: stats.years.length,
    yearStart: Math.min(...stats.years),
    yearEnd: Math.max(...stats.years),
  })).sort((a, b) => b.yearEnd - a.yearEnd);

  // Best season (by win percentage, then total wins)
  const bestSeason = [...records].sort((a, b) => {
    const aWinPct = a.wins / (a.wins + a.losses);
    const bWinPct = b.wins / (b.wins + b.losses);
    if (bWinPct !== aWinPct) return bWinPct - aWinPct;
    return b.wins - a.wins;
  })[0];

  // Current streak (consecutive winning/losing seasons)
  let currentStreak = { type: 'neutral' as 'winning' | 'losing' | 'neutral', count: 0 };
  const sortedRecords = [...records].sort((a, b) => b.year - a.year);
  for (const record of sortedRecords) {
    const isWinning = record.wins > record.losses;
    const isLosing = record.losses > record.wins;

    if (currentStreak.count === 0) {
      if (isWinning) {
        currentStreak = { type: 'winning', count: 1 };
      } else if (isLosing) {
        currentStreak = { type: 'losing', count: 1 };
      }
    } else if (currentStreak.type === 'winning' && isWinning) {
      currentStreak.count++;
    } else if (currentStreak.type === 'losing' && isLosing) {
      currentStreak.count++;
    } else {
      break;
    }
  }

  return {
    totalSeasons: records.length,
    totalWins,
    totalLosses,
    winPercentage,
    bowlAppearances: bowlGames.length,
    bowlWins,
    bowlLosses,
    apTop25Finishes,
    apTop10Finishes,
    cfpAppearances,
    nationalChampionships,
    coaches,
    bestSeason: bestSeason ? {
      year: bestSeason.year,
      record: `${bestSeason.wins}-${bestSeason.losses}`,
      bowl: bestSeason.bowl,
      apPost: bestSeason.apPost,
    } : null,
    currentStreak: currentStreak.count > 0 ? currentStreak : null,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Get team info
    const team = getTeamBySlug(slug);
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Get history data
    const historyData = getHistoryData(team.slug);

    if (!historyData) {
      // Return empty data structure if no history file found
      return NextResponse.json({
        team: team.name,
        teamId: team.id,
        slug: team.slug,
        conference: team.conference,
        yearlyRecords: [],
        stats: getHistoryStats([]),
        lastUpdated: new Date().toISOString(),
      }, {
        headers: {
          'Cache-Control': 's-maxage=86400, stale-while-revalidate=172800',
        },
      });
    }

    // Sort records by year (most recent first)
    const sortedRecords = [...historyData.yearlyRecords].sort((a, b) => b.year - a.year);
    const stats = getHistoryStats(sortedRecords);

    return NextResponse.json({
      team: team.name,
      teamId: team.id,
      slug: team.slug,
      conference: team.conference,
      yearlyRecords: sortedRecords,
      stats,
      lastUpdated: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 's-maxage=86400, stale-while-revalidate=172800',
      },
    });

  } catch (error) {
    console.error('History API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history data' },
      { status: 500 }
    );
  }
}
