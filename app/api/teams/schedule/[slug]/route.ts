import { NextResponse } from 'next/server';
import { getEspnIdFromSlug } from '@/utils/espnTeamIds';
import { getTeamBySlug, getTeamById } from '@/data/teams';

interface ESPNCompetitor {
  id: string;
  team: {
    id: string;
    name: string;
    abbreviation: string;
    displayName: string;
    logo?: string;
  };
  homeAway: 'home' | 'away';
  score?: {
    value: number;
    displayValue: string;
  };
  winner?: boolean;
}

interface ESPNEvent {
  id: string;
  date: string;
  name: string;
  shortName: string;
  season: {
    year: number;
    type: number;
    slug: string;
  };
  week?: {
    number: number;
    text: string;
  };
  competitions: Array<{
    id: string;
    date: string;
    attendance?: number;
    venue?: {
      fullName: string;
      address?: {
        city: string;
        state: string;
      };
    };
    competitors: ESPNCompetitor[];
    status: {
      type: {
        completed: boolean;
        description: string;
      };
    };
    broadcasts?: Array<{
      names: string[];
    }>;
    conferenceCompetition?: boolean;
  }>;
}

interface ESPNScheduleResponse {
  events?: ESPNEvent[];
  team?: {
    id: string;
    displayName: string;
  };
}

export async function GET(
  request: Request,
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

    // Get ESPN ID for the team
    const espnId = getEspnIdFromSlug(slug);
    if (!espnId) {
      return NextResponse.json(
        { error: 'ESPN ID not found for team' },
        { status: 404 }
      );
    }

    // Determine the appropriate season (CFB runs Aug-Jan, so Jan 2026 = 2025 season)
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed
    // If we're in Jan-Jul, use previous year's season; Aug-Dec use current year
    const season = month < 7 ? year - 1 : year;

    // Fetch schedule from ESPN API (regular season + postseason)
    // ESPN uses seasontype: 2 = regular season, 3 = postseason
    const baseUrl = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${espnId}/schedule?season=${season}`;

    // Fetch both regular season and postseason schedules in parallel
    const [regularResponse, postseasonResponse] = await Promise.all([
      fetch(baseUrl, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 1800 },
      }),
      fetch(`${baseUrl}&seasontype=3`, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 1800 },
      }),
    ]);

    if (!regularResponse.ok) {
      throw new Error(`ESPN API returned ${regularResponse.status}`);
    }

    const regularData: ESPNScheduleResponse = await regularResponse.json();
    let postseasonData: ESPNScheduleResponse = { events: [] };

    if (postseasonResponse.ok) {
      postseasonData = await postseasonResponse.json();
    }

    // Combine regular season and postseason events
    const allEvents = [
      ...(regularData.events || []),
      ...(postseasonData.events || []),
    ];

    // Deduplicate events by ID (in case any overlap)
    const eventIds = new Set<string>();
    const data: ESPNScheduleResponse = {
      events: allEvents.filter(event => {
        if (eventIds.has(event.id)) return false;
        eventIds.add(event.id);
        return true;
      }),
      team: regularData.team,
    };

    // Transform the schedule data
    const schedule = (data.events || []).map((event: ESPNEvent) => {
      const competition = event.competitions[0];
      const teamCompetitor = competition.competitors.find(
        (c: ESPNCompetitor) => c.team.id === espnId.toString()
      );
      const opponentCompetitor = competition.competitors.find(
        (c: ESPNCompetitor) => c.team.id !== espnId.toString()
      );

      if (!teamCompetitor || !opponentCompetitor || !opponentCompetitor.team) {
        return null;
      }

      const isHome = teamCompetitor.homeAway === 'home';
      const isCompleted = competition.status?.type?.completed || false;

      // Try to find opponent's slug for linking (safely handle undefined names)
      const opponentDisplayName = opponentCompetitor.team.displayName;
      const opponentName = opponentCompetitor.team.name;
      const opponentTeam = (opponentDisplayName ? getTeamById(opponentDisplayName) : undefined) ||
                           (opponentName ? getTeamById(opponentName) : undefined);

      // Determine if this is a conference game by checking if opponent is in same conference
      const isConferenceGame = opponentTeam ? opponentTeam.conference === team.conference : false;

      // Determine result
      let result: 'W' | 'L' | 'T' | undefined;
      let score: { team: number; opponent: number } | undefined;

      if (isCompleted && teamCompetitor.score && opponentCompetitor.score) {
        const teamScore = teamCompetitor.score.value;
        const opponentScore = opponentCompetitor.score.value;
        score = { team: teamScore, opponent: opponentScore };

        if (teamScore > opponentScore) {
          result = 'W';
        } else if (teamScore < opponentScore) {
          result = 'L';
        } else {
          result = 'T';
        }
      }

      // Get TV broadcast
      const tv = competition.broadcasts?.[0]?.names?.[0] || undefined;

      // Format date
      const gameDate = new Date(event.date);
      const dateFormatted = gameDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      // Get time if game hasn't happened
      const timeFormatted = !isCompleted
        ? gameDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short',
          })
        : undefined;

      // Detect postseason games (season.type 3 = postseason)
      const isPostseason = event.season.type === 3;

      // For postseason, use the event name as a label (e.g., "CFP First Round", "Chick-fil-A Peach Bowl")
      const bowlName = isPostseason ? (event.name || event.shortName || 'Postseason') : undefined;

      return {
        week: event.week?.number || (isPostseason ? 99 : event.season.type), // Give postseason high week number for sorting
        date: dateFormatted,
        rawDate: gameDate.toISOString(), // For sorting
        opponent: opponentCompetitor.team.displayName,
        opponentLogo: opponentCompetitor.team.logo || `https://a.espncdn.com/i/teamlogos/ncaa/500/${opponentCompetitor.team.id}.png`,
        opponentSlug: opponentTeam?.slug,
        isHome,
        isConference: isConferenceGame,
        isPostseason,
        bowlName,
        time: timeFormatted,
        tv,
        venue: competition.venue?.fullName || (isHome ? 'Home' : 'Away'),
        result,
        score,
        isBye: false,
      };
    }).filter(Boolean);

    // Separate regular season and postseason games
    const regularSeasonGames = schedule.filter((g: any) => !g.isPostseason);
    const postseasonGames = schedule.filter((g: any) => g.isPostseason);

    // Add bye weeks only for regular season (exclude postseason from calculation)
    const playedWeeks = new Set(regularSeasonGames.map((g: any) => g.week));
    if (playedWeeks.size > 0) {
      const maxWeek = Math.max(...Array.from(playedWeeks) as number[]);
      const minWeek = Math.min(...Array.from(playedWeeks) as number[]);

      for (let week = minWeek; week <= maxWeek; week++) {
        if (!playedWeeks.has(week)) {
          regularSeasonGames.push({
            week,
            date: '',
            rawDate: '',
            opponent: 'BYE WEEK',
            opponentLogo: '',
            opponentSlug: '',
            isHome: true,
            isConference: false,
            isPostseason: false,
            bowlName: undefined,
            time: '',
            tv: '',
            venue: '',
            result: undefined as 'W' | 'L' | 'T' | undefined,
            score: undefined as { team: number; opponent: number } | undefined,
            isBye: true,
          });
        }
      }
    }

    // Sort regular season by week, postseason by date
    regularSeasonGames.sort((a: any, b: any) => a.week - b.week);
    postseasonGames.sort((a: any, b: any) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime());

    // Combine: regular season first, then postseason
    const finalSchedule = [...regularSeasonGames, ...postseasonGames];

    return NextResponse.json({
      team: team.name,
      schedule: finalSchedule,
    });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedule data' },
      { status: 500 }
    );
  }
}
