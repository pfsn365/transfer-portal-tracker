import { NextRequest, NextResponse } from 'next/server';
import { fetchSchedule, fetchScheduleByWeek, ScheduleGame } from '@/lib/espn';

// Fetch all weeks for a season in parallel batches
async function fetchAllSeasonGames(group: '80' | '81'): Promise<ScheduleGame[]> {
  const allGames: ScheduleGame[] = [];

  // Fetch regular season (weeks 0-16) and postseason (weeks 1-5) in parallel batches
  // Use batches of 5 to avoid overwhelming the ESPN API
  const BATCH_SIZE = 5;

  // Regular season weeks 0-16
  for (let batch = 0; batch <= 16; batch += BATCH_SIZE) {
    const weekPromises = [];
    for (let week = batch; week < Math.min(batch + BATCH_SIZE, 17); week++) {
      weekPromises.push(
        fetchScheduleByWeek(week, 2, group).catch(() => [] as ScheduleGame[])
      );
    }
    const results = await Promise.all(weekPromises);
    for (const games of results) {
      allGames.push(...games);
    }
  }

  // Postseason weeks 1-5
  const postseasonPromises = Array.from({ length: 5 }, (_, i) =>
    fetchScheduleByWeek(i + 1, 3, group).catch(() => [] as ScheduleGame[])
  );
  const postResults = await Promise.all(postseasonPromises);
  for (const games of postResults) {
    allGames.push(...games);
  }

  // Deduplicate by game ID
  return Array.from(new Map(allGames.map(game => [game.id, game])).values());
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const week = searchParams.get('week');
    const date = searchParams.get('date');
    const fetchAll = searchParams.get('fetchAll') === 'true';
    const seasonType = searchParams.get('seasonType') || '2'; // 2 = regular season, 3 = postseason
    const group = searchParams.get('group') as '80' | '81' || '80'; // 80 = FBS, 81 = FCS

    let games: ScheduleGame[];

    if (fetchAll) {
      // Bulk fetch all weeks for the entire season
      games = await fetchAllSeasonGames(group);
    } else if (week) {
      // Fetch by week number
      games = await fetchScheduleByWeek(parseInt(week), parseInt(seasonType), group);
    } else if (date) {
      // Fetch by specific date
      games = await fetchSchedule({ dates: date, groups: group });
    } else {
      // Fetch current/today's games
      games = await fetchSchedule({ groups: group });
    }

    // Sort games: Live first, then upcoming by time, then completed
    const sortedGames = [...games].sort((a, b) => {
      // Live games first
      if (a.status.state === 'in' && b.status.state !== 'in') return -1;
      if (a.status.state !== 'in' && b.status.state === 'in') return 1;

      // Then upcoming games
      if (a.status.state === 'pre' && b.status.state === 'post') return -1;
      if (a.status.state === 'post' && b.status.state === 'pre') return 1;

      // Sort by date/time
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    const hasLiveGames = games.some(g => g.status.state === 'in');
    const revalidateTime = hasLiveGames ? 30 : 300;

    return NextResponse.json({
      games: sortedGames,
      totalGames: sortedGames.length,
      hasLiveGames,
      lastUpdated: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': `s-maxage=${revalidateTime}, stale-while-revalidate`,
      },
    });
  } catch (error) {
    console.error('Schedule API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    );
  }
}
