import { NextRequest, NextResponse } from 'next/server';

interface StatLeader {
  playerId: string;
  name: string;
  value: string;
  numericValue: number;
  position: string;
  teamId: string;
  teamName: string;
  teamAbbreviation: string;
  teamLogo: string;
  conference: string;
  conferenceId: string;
  gamesPlayed: number;
  classYear: string; // FR, SO, JR, SR
}

interface CategoryData {
  name: string;
  displayName: string;
  group: string;
  leaders: StatLeader[];
}

// Stat categories organized by group
const STAT_CATEGORIES = [
  // Passing
  { key: 'passingYards', name: 'Passing Yards', espnName: 'passingYards', group: 'passing' },
  { key: 'passingTouchdowns', name: 'Passing TDs', espnName: 'passingTouchdowns', group: 'passing' },
  { key: 'completionPct', name: 'Completion %', espnName: 'completionPct', group: 'passing' },
  { key: 'yardsPerPassAttempt', name: 'Yards/Attempt', espnName: 'yardsPerPassAttempt', group: 'passing' },
  { key: 'QBRating', name: 'Passer Rating', espnName: 'QBRating', group: 'passing' },
  { key: 'interceptions', name: 'INTs Thrown', espnName: 'interceptions', group: 'passing' },
  // Rushing
  { key: 'rushingYards', name: 'Rushing Yards', espnName: 'rushingYards', group: 'rushing' },
  { key: 'rushingTouchdowns', name: 'Rushing TDs', espnName: 'rushingTouchdowns', group: 'rushing' },
  { key: 'yardsPerRushAttempt', name: 'Yards/Carry', espnName: 'yardsPerRushAttempt', group: 'rushing' },
  { key: 'longRushing', name: 'Longest Rush', espnName: 'longRushing', group: 'rushing' },
  // Receiving
  { key: 'receivingYards', name: 'Receiving Yards', espnName: 'receivingYards', group: 'receiving' },
  { key: 'receivingTouchdowns', name: 'Receiving TDs', espnName: 'receivingTouchdowns', group: 'receiving' },
  { key: 'receptions', name: 'Receptions', espnName: 'receptions', group: 'receiving' },
  { key: 'yardsPerReception', name: 'Yards/Reception', espnName: 'yardsPerReception', group: 'receiving' },
  { key: 'longReception', name: 'Longest Reception', espnName: 'longReception', group: 'receiving' },
  // Defense
  { key: 'totalTackles', name: 'Tackles', espnName: 'totalTackles', group: 'defense' },
  { key: 'sacks', name: 'Sacks', espnName: 'sacks', group: 'defense' },
  { key: 'defensiveInterceptions', name: 'Interceptions', espnName: 'defensiveInterceptions', group: 'defense' },
  { key: 'tacklesForLoss', name: 'Tackles for Loss', espnName: 'tacklesForLoss', group: 'defense' },
  { key: 'forcedFumbles', name: 'Forced Fumbles', espnName: 'forcedFumbles', group: 'defense' },
  { key: 'passesDefended', name: 'Passes Defended', espnName: 'passesDefended', group: 'defense' },
  // Special Teams
  { key: 'puntReturnYards', name: 'Punt Return Yards', espnName: 'puntReturnYards', group: 'specialTeams' },
  { key: 'kickReturnYards', name: 'Kick Return Yards', espnName: 'kickReturnYards', group: 'specialTeams' },
  { key: 'puntReturnTouchdowns', name: 'Punt Return TDs', espnName: 'puntReturnTouchdowns', group: 'specialTeams' },
  { key: 'kickReturnTouchdowns', name: 'Kick Return TDs', espnName: 'kickReturnTouchdowns', group: 'specialTeams' },
  { key: 'fieldGoalPct', name: 'Field Goal %', espnName: 'fieldGoalPct', group: 'specialTeams' },
];

// Keep original categories for backward compatibility
const TOTAL_CATEGORIES = STAT_CATEGORIES;
const PER_GAME_CATEGORIES = STAT_CATEGORIES;

// Fetch list of teams in a specific division (group 80 = FBS, group 81 = FCS)
async function fetchDivisionTeams(group: '80' | '81', year: number): Promise<Set<string>> {
  const teamIds = new Set<string>();
  try {
    const url = `https://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/${year}/types/2/groups/${group}/teams?limit=200`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CFB-HQ/1.0)' },
      next: { revalidate: 86400 }, // Cache for 24 hours
    });
    if (response.ok) {
      const data = await response.json();
      // Extract team IDs from $ref URLs
      for (const item of data.items || []) {
        const ref = item.$ref || '';
        const match = ref.match(/teams\/(\d+)/);
        if (match) {
          teamIds.add(match[1]);
        }
      }
    }
  } catch (error) {
    console.error(`Failed to fetch ${group === '80' ? 'FBS' : 'FCS'} teams:`, error);
  }
  return teamIds;
}

// Helper to safely fetch JSON with caching
async function fetchJson(url: string, revalidate: number = 3600): Promise<unknown | null> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CFB-HQ/1.0)' },
      next: { revalidate },
    });
    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Return null on error
  }
  return null;
}

// Process a single leader with batched fetches using Promise.all
async function processLeader(
  leader: { athlete?: { $ref?: string; id?: string; displayName?: string; fullName?: string; position?: { abbreviation?: string }; team?: { $ref?: string }; experience?: { year?: number; abbreviation?: string } }; team?: { $ref?: string }; statistics?: { $ref?: string }; displayValue?: string; value?: number },
  divisionTeamIds: Set<string>,
  statType: 'total' | 'perGame'
): Promise<StatLeader | null> {
  const athlete = leader.athlete;
  if (!athlete) return null;

  // Get team ID from the leader's team ref first for early filtering
  let teamId = '';
  const teamRef = leader.team?.$ref || '';
  const teamIdMatch = teamRef.match(/teams\/(\d+)/);
  if (teamIdMatch) {
    teamId = teamIdMatch[1];
  }

  // Skip if team is not in the requested division (and we have division data)
  if (divisionTeamIds.size > 0 && teamId && !divisionTeamIds.has(teamId)) {
    return null;
  }

  // Batch fetch athlete, stats in parallel
  const [athleteData, statsData] = await Promise.all([
    athlete.$ref ? fetchJson(athlete.$ref, 3600) : Promise.resolve(athlete),
    leader.statistics?.$ref ? fetchJson(leader.statistics.$ref, 3600) : Promise.resolve(null),
  ]);

  const typedAthleteData = (athleteData || athlete) as {
    id?: string;
    displayName?: string;
    fullName?: string;
    position?: { abbreviation?: string };
    team?: { $ref?: string; id?: string; displayName?: string; name?: string; abbreviation?: string; logos?: { href?: string }[]; groups?: { $ref?: string } };
    experience?: { year?: number; abbreviation?: string };
  };

  // Fetch team data if we have a ref
  let teamData = typedAthleteData.team || {};
  if (teamData.$ref) {
    const fetchedTeam = await fetchJson(teamData.$ref, 3600);
    if (fetchedTeam) {
      teamData = fetchedTeam as typeof teamData;
    }
  }

  // Double-check team ID after fetching full team data
  const finalTeamId = teamData.id || teamId || '';
  if (divisionTeamIds.size > 0 && finalTeamId && !divisionTeamIds.has(finalTeamId)) {
    return null;
  }

  // Get games played from statistics
  let gamesPlayed = 13; // Default estimate for CFB season
  if (statsData) {
    const typedStats = statsData as { splits?: { categories?: { stats?: { name: string; value: number }[] }[] } };
    const gpStat = typedStats.splits?.categories
      ?.flatMap((c) => c.stats || [])
      ?.find((s) => s.name === 'gamesPlayed');
    if (gpStat?.value && gpStat.value > 0) {
      gamesPlayed = gpStat.value;
    }
  }

  // Calculate display value based on stat type
  let displayValue = leader.displayValue || String(leader.value);
  let numericValue = leader.value || 0;

  if (statType === 'perGame') {
    const perGameValue = numericValue / gamesPlayed;
    numericValue = perGameValue;
    displayValue = perGameValue.toFixed(1);
  }

  // Fetch conference info (only if we have team data with groups ref)
  let conference = '';
  let conferenceId = '';
  if (teamData.groups?.$ref) {
    const groupsData = await fetchJson(teamData.groups.$ref, 86400);
    if (groupsData) {
      const typedGroups = groupsData as { items?: { isConference?: boolean; shortName?: string; name?: string; id?: string }[] };
      const confGroup = typedGroups.items?.find((g) => g.isConference);
      if (confGroup) {
        conference = confGroup.shortName || confGroup.name || '';
        conferenceId = confGroup.id || '';
      }
    }
  }

  // Get athlete class year
  let classYear = '';
  const experience = typedAthleteData.experience;
  if (experience) {
    const year = experience.year;
    if (year === 1 || experience.abbreviation === 'FR') classYear = 'FR';
    else if (year === 2 || experience.abbreviation === 'SO') classYear = 'SO';
    else if (year === 3 || experience.abbreviation === 'JR') classYear = 'JR';
    else if (year === 4 || experience.abbreviation === 'SR') classYear = 'SR';
    else if (year && year >= 5) classYear = 'SR';
    else classYear = experience.abbreviation || '';
  }

  return {
    playerId: typedAthleteData.id || '',
    name: typedAthleteData.displayName || typedAthleteData.fullName || 'Unknown',
    value: displayValue,
    numericValue: numericValue,
    position: typedAthleteData.position?.abbreviation || 'N/A',
    teamId: finalTeamId,
    teamName: teamData.displayName || teamData.name || 'Unknown',
    teamAbbreviation: teamData.abbreviation || '',
    teamLogo: teamData.logos?.[0]?.href || '',
    conference: conference,
    conferenceId: conferenceId,
    gamesPlayed: gamesPlayed,
    classYear: classYear,
  };
}

async function fetchLeadersData(group: '80' | '81' = '80', statType: 'total' | 'perGame' = 'total'): Promise<CategoryData[]> {
  const categories: CategoryData[] = [];
  const CATEGORIES = statType === 'total' ? TOTAL_CATEGORIES : PER_GAME_CATEGORIES;

  // Current CFB season is 2025-26, ESPN uses the starting year
  const yearsToTry = [2025, 2024];

  for (const year of yearsToTry) {
    try {
      // Fetch the list of teams in the requested division first
      const divisionTeamIds = await fetchDivisionTeams(group, year);

      // Fetch all leaders with increased limit (ESPN groups parameter doesn't filter properly)
      const url = `https://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/${year}/types/2/leaders?limit=100`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CFB-HQ/1.0)',
        },
        next: { revalidate: 3600 },
      });

      if (!response.ok) continue;

      const data = await response.json();

      // The ESPN v2 API returns categories array
      if (data.categories) {
        // Process all categories in parallel
        const categoryPromises = data.categories.map(async (espnCategory: { name?: string; displayName?: string; leaders?: unknown[] }) => {
          const espnCategoryName = espnCategory.name?.toLowerCase() || '';
          const categoryConfig = CATEGORIES.find(c => {
            const espnName = c.espnName.toLowerCase();
            const baseEspnName = espnName.replace('pergame', '');
            return espnCategoryName === baseEspnName || espnCategoryName.includes(baseEspnName);
          });

          if (!categoryConfig) return null;

          const categoryLeaders = espnCategory.leaders || [];

          // Process leaders in batches of 10 for better parallelism without overwhelming
          const BATCH_SIZE = 10;
          const leaders: StatLeader[] = [];

          for (let i = 0; i < Math.min(categoryLeaders.length, 100) && leaders.length < 50; i += BATCH_SIZE) {
            const batch = categoryLeaders.slice(i, i + BATCH_SIZE);
            const batchResults = await Promise.all(
              batch.map(leader => processLeader(leader as Parameters<typeof processLeader>[0], divisionTeamIds, statType))
            );

            for (const result of batchResults) {
              if (result && leaders.length < 50) {
                leaders.push(result);
              }
            }
          }

          if (leaders.length > 0) {
            // Re-sort by numericValue for per-game stats
            if (statType === 'perGame') {
              leaders.sort((a, b) => b.numericValue - a.numericValue);
            }

            return {
              name: categoryConfig.key || espnCategory.name || 'unknown',
              displayName: categoryConfig.name || espnCategory.displayName || 'Unknown',
              group: categoryConfig.group || 'other',
              leaders,
            };
          }

          return null;
        });

        const results = await Promise.all(categoryPromises);
        for (const result of results) {
          if (result) {
            categories.push(result);
          }
        }
      }

      // If we got data, return it
      if (categories.length > 0) {
        return categories;
      }
    } catch (error) {
      console.error(`Failed to fetch leaders for year ${year}:`, error);
    }
  }

  return categories;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const group = searchParams.get('group') as '80' | '81' || '80';
    const statType = searchParams.get('statType') as 'total' | 'perGame' || 'total';

    const categories = await fetchLeadersData(group, statType);

    return NextResponse.json({
      categories,
      totalCategories: categories.length,
      lastUpdated: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
      },
    });
  } catch (error) {
    console.error('Stat Leaders API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stat leaders', categories: [] },
      { status: 500 }
    );
  }
}
