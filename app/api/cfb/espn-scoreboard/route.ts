import { NextRequest, NextResponse } from 'next/server';
import {
  fetchTickerGames,
  fetchGamesByDate,
  TickerGame,
} from '@/lib/espn';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const ticker = searchParams.get('ticker') === 'true';

    let games: TickerGame[];
    let hasLiveGames = false;

    if (date) {
      // Fetch games for specific date (YYYY-MM-DD or YYYYMMDD format)
      games = await fetchGamesByDate(date);
    } else {
      // Default: fetch current/today's games
      games = await fetchTickerGames();
    }

    // Filter out games older than 1 week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentGames = games.filter(g => {
      const gameDate = new Date(g.startDate);
      return gameDate >= oneWeekAgo;
    });

    hasLiveGames = recentGames.some(g => g.isLive);

    // Sort games: Live first, then upcoming, then concluded (Final)
    const sortedGames = [...recentGames].sort((a, b) => {
      // Live games always first
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;

      // Both live - sort by start time
      if (a.isLive && b.isLive) {
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      }

      // Upcoming games (not live, not final) come before concluded games
      const aIsUpcoming = !a.isLive && !a.isFinal;
      const bIsUpcoming = !b.isLive && !b.isFinal;

      if (aIsUpcoming && !bIsUpcoming) return -1;
      if (!aIsUpcoming && bIsUpcoming) return 1;

      // Both upcoming - sort by start time (earliest first)
      if (aIsUpcoming && bIsUpcoming) {
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      }

      // Both concluded - sort by start time (most recent first)
      if (a.isFinal && b.isFinal) {
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      }

      return 0;
    });

    // Determine cache time based on game status
    // Live games: 30 seconds, otherwise 5 minutes
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
    console.error('ESPN Scoreboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ESPN data' },
      { status: 500 }
    );
  }
}
