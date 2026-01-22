import { NextResponse } from 'next/server';
import { getEspnIdFromSlug } from '@/utils/espnTeamIds';
import { getTeamBySlug } from '@/data/teams';

interface ESPNStat {
  name: string;
  displayName: string;
  value: number;
  displayValue: string;
  rank?: number;
  perGameValue?: number;
}

interface ESPNStatCategory {
  name: string;
  displayName: string;
  stats: ESPNStat[];
}

interface ESPNStatsResponse {
  results?: {
    stats?: {
      categories?: ESPNStatCategory[];
    };
  };
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

    // Fetch stats from ESPN API
    const url = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${espnId}/statistics`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`ESPN API returned ${response.status}`);
    }

    const data: ESPNStatsResponse = await response.json();
    const categories = data.results?.stats?.categories || [];

    // Helper function to find a stat value
    const findStat = (categoryName: string, statName: string): number => {
      const category = categories.find(
        (c: ESPNStatCategory) => c.name.toLowerCase() === categoryName.toLowerCase()
      );
      const stat = category?.stats.find(
        (s: ESPNStat) => s.name.toLowerCase() === statName.toLowerCase()
      );
      return stat?.value || 0;
    };

    // Helper function to find a stat rank
    const findStatRank = (categoryName: string, statName: string): number | undefined => {
      const category = categories.find(
        (c: ESPNStatCategory) => c.name.toLowerCase() === categoryName.toLowerCase()
      );
      const stat = category?.stats.find(
        (s: ESPNStat) => s.name.toLowerCase() === statName.toLowerCase()
      );
      return stat?.rank;
    };

    // Get offensive stats
    const passingYPG = findStat('passing', 'netPassingYardsPerGame');
    const rushingYPG = findStat('rushing', 'rushingYardsPerGame');
    const pointsPerGame = findStat('scoring', 'totalPointsPerGame');
    const passingTDs = findStat('passing', 'passingTouchdowns');
    const rushingTDs = findStat('rushing', 'rushingTouchdowns');
    const completionPct = findStat('passing', 'completionPct');
    const yardsPerAttempt = findStat('passing', 'yardsPerPassAttempt');
    const yardsPerRush = findStat('rushing', 'yardsPerRushAttempt');
    const thirdDownPct = findStat('miscellaneous', 'thirdDownConvPct');
    const redzonePct = findStat('miscellaneous', 'redzoneScoringPct');
    const totalFirstDowns = findStat('miscellaneous', 'firstDowns');
    const interceptions = findStat('passing', 'interceptions');
    const fumblesLost = findStat('miscellaneous', 'fumblesLost');

    // Get defensive stats
    const defInterceptions = findStat('defensiveInterceptions', 'interceptions');
    const fumblesRecovered = findStat('general', 'fumblesRecovered');
    const fumblesForced = findStat('general', 'fumblesForced');
    const sacks = findStat('defensive', 'sacks');
    const tacklesForLoss = findStat('defensive', 'tacklesForLoss');
    const passesDefended = findStat('defensive', 'passesDefended');
    const totalTackles = findStat('defensive', 'totalTackles');

    // Get special teams stats
    const fieldGoalPct = findStat('kicking', 'fieldGoalPct');
    const fieldGoalsMade = findStat('kicking', 'fieldGoalsMade');
    const fieldGoalAttempts = findStat('kicking', 'fieldGoalAttempts');
    const puntAvg = findStat('punting', 'grossAvgPuntYards');
    const kickReturnAvg = findStat('returning', 'yardsPerKickReturn');
    const puntReturnAvg = findStat('returning', 'yardsPerPuntReturn');

    // Build stats object
    const stats = {
      offense: {
        pointsPerGame,
        yardsPerGame: passingYPG + rushingYPG,
        passingYardsPerGame: passingYPG,
        rushingYardsPerGame: rushingYPG,
        passingTouchdowns: passingTDs,
        rushingTouchdowns: rushingTDs,
        completionPct,
        yardsPerAttempt,
        yardsPerRush,
        thirdDownPct,
        redzonePct,
        firstDowns: totalFirstDowns,
        turnovers: interceptions + fumblesLost,
      },
      defense: {
        sacks,
        tacklesForLoss,
        interceptions: defInterceptions,
        passesDefended,
        fumblesForced,
        fumblesRecovered,
        totalTackles,
        takeaways: defInterceptions + fumblesRecovered,
      },
      specialTeams: {
        fieldGoalPct,
        fieldGoals: `${fieldGoalsMade}/${fieldGoalAttempts}`,
        puntAvg,
        kickReturnAvg,
        puntReturnAvg,
      },
      rankings: {
        offenseRank: findStatRank('scoring', 'totalPointsPerGame'),
      },
    };

    // Fetch player leaders
    let playerLeaders: any[] = [];
    try {
      // Determine season (same logic as schedule)
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const season = month < 7 ? year - 1 : year;

      const leadersUrl = `https://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/${season}/types/2/teams/${espnId}/leaders`;
      const leadersResponse = await fetch(leadersUrl, { next: { revalidate: 3600 } });

      if (leadersResponse.ok) {
        const leadersData = await leadersResponse.json();
        const categories = leadersData.categories || [];

        // Get top leader for each category
        const leaderPromises = categories.slice(0, 8).map(async (cat: any) => {
          const topLeader = cat.leaders?.[0];
          if (!topLeader) return null;

          // Fetch athlete info
          const athleteRef = topLeader.athlete?.$ref;
          if (!athleteRef) return null;

          try {
            const athleteResponse = await fetch(athleteRef, { next: { revalidate: 3600 } });
            if (athleteResponse.ok) {
              const athleteData = await athleteResponse.json();
              return {
                category: cat.displayName || cat.name,
                categoryAbbr: cat.abbreviation,
                playerName: athleteData.displayName,
                position: athleteData.position?.abbreviation || '',
                value: topLeader.displayValue,
                headshot: athleteData.headshot?.href,
              };
            }
          } catch (e) {
            console.error('Error fetching athlete:', e);
          }
          return null;
        });

        const leaders = await Promise.all(leaderPromises);
        playerLeaders = leaders.filter(Boolean);
      }
    } catch (e) {
      console.error('Error fetching player leaders:', e);
    }

    return NextResponse.json({
      team: team.name,
      stats,
      playerLeaders,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team stats' },
      { status: 500 }
    );
  }
}
