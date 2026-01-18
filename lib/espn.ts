/**
 * ESPN API integration for College Football scores
 */

// ESPN API Response Types
export interface ESPNTeam {
  id: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  logo: string;
  color?: string;
  alternateColor?: string;
}

export interface ESPNCompetitor {
  id: string;
  homeAway: 'home' | 'away';
  team: ESPNTeam;
  score?: string;
  winner?: boolean;
  curatedRank?: {
    current: number;
  };
  records?: Array<{
    name: string;
    type: string;
    summary: string;
  }>;
}

export interface ESPNStatus {
  type: {
    id: string;
    name: string;
    state: 'pre' | 'in' | 'post';
    completed: boolean;
    description: string;
    detail: string;
    shortDetail: string;
  };
  period?: number;
  displayClock?: string;
}

export interface ESPNSituation {
  possession?: string;
  downDistanceText?: string;
  shortDownDistanceText?: string;
  possessionText?: string;
  isRedZone?: boolean;
}

export interface ESPNCompetition {
  id: string;
  date: string;
  competitors: ESPNCompetitor[];
  status: ESPNStatus;
  situation?: ESPNSituation;
  venue?: {
    fullName: string;
    address: {
      city: string;
      state: string;
    };
  };
  broadcasts?: Array<{
    names: string[];
  }>;
  leaders?: Array<{
    name: string;
    displayName: string;
    leaders: Array<{
      displayValue: string;
      value: number;
      athlete: {
        id: string;
        fullName: string;
        shortName: string;
        headshot?: string;
        position?: {
          abbreviation: string;
        };
        team?: {
          id: string;
        };
      };
    }>;
  }>;
  notes?: Array<{
    type: string;
    headline: string;
  }>;
}

export interface ESPNEvent {
  id: string;
  date: string;
  name: string;
  shortName: string;
  competitions: ESPNCompetition[];
}

export interface ESPNScoreboardResponse {
  events: ESPNEvent[];
  leagues?: Array<{
    id: string;
    name: string;
    season: {
      year: number;
      type: number;
    };
  }>;
}

// Ticker-specific game interface (lightweight)
export interface TickerGame {
  id: string;
  awayTeam: {
    abbr: string;
    logo: string;
    score?: number;
    rank?: number;
    hasPossession?: boolean;
  };
  homeTeam: {
    abbr: string;
    logo: string;
    score?: number;
    rank?: number;
    hasPossession?: boolean;
  };
  statusDetail: string;
  startDate: string;
  isLive: boolean;
  isFinal: boolean;
}

/**
 * Fetch scoreboard data from ESPN College Football API
 */
export async function fetchESPNScoreboard(options?: {
  dates?: string;
  groups?: string; // Conference group (80 = FBS, 81 = FCS)
  limit?: number;
  revalidate?: number;
}): Promise<ESPNScoreboardResponse | null> {
  try {
    // College Football endpoint
    const url = new URL('https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard');

    if (options?.dates) {
      url.searchParams.set('dates', options.dates);
    }
    if (options?.groups) {
      url.searchParams.set('groups', options.groups);
    }
    if (options?.limit) {
      url.searchParams.set('limit', String(options.limit));
    }

    // Determine cache time based on typical game schedules
    // College football games are typically Saturdays, with some Thursday/Friday games
    const now = new Date();
    const day = now.getUTCDay();
    const hour = now.getUTCHours();

    // Saturday games (day 6), Thursday evening (day 4), Friday evening (day 5)
    const isDuringGames =
      day === 6 || // Saturday
      (day === 4 && hour >= 23) || // Thursday late
      (day === 5 && hour >= 18) || // Friday evening
      (day === 0 && hour < 6); // Sunday early morning (late Saturday games)

    const cacheTime = options?.revalidate ?? (isDuringGames ? 15 : 60);

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CFB-HQ/1.0)',
      },
      next: { revalidate: cacheTime },
    });

    if (!response.ok) {
      console.error(`ESPN API error: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('ESPN API fetch error:', error);
    return null;
  }
}

/**
 * Transform ESPN event to lightweight ticker game format
 */
export function transformToTickerGame(event: ESPNEvent): TickerGame | null {
  const competition = event.competitions[0];
  if (!competition) return null;

  const awayCompetitor = competition.competitors.find(c => c.homeAway === 'away');
  const homeCompetitor = competition.competitors.find(c => c.homeAway === 'home');

  if (!awayCompetitor || !homeCompetitor) return null;

  const isLive = competition.status.type.state === 'in';
  const isFinal = competition.status.type.state === 'post';
  const hasScore = isLive || isFinal;

  const possessionTeamId = competition.situation?.possession;

  return {
    id: event.id,
    awayTeam: {
      abbr: awayCompetitor.team.abbreviation,
      logo: awayCompetitor.team.logo,
      score: hasScore ? parseInt(awayCompetitor.score || '0') : undefined,
      rank: awayCompetitor.curatedRank?.current,
      hasPossession: isLive && possessionTeamId === awayCompetitor.id,
    },
    homeTeam: {
      abbr: homeCompetitor.team.abbreviation,
      logo: homeCompetitor.team.logo,
      score: hasScore ? parseInt(homeCompetitor.score || '0') : undefined,
      rank: homeCompetitor.curatedRank?.current,
      hasPossession: isLive && possessionTeamId === homeCompetitor.id,
    },
    statusDetail: competition.status.type.shortDetail,
    startDate: event.date,
    isLive,
    isFinal,
  };
}

/**
 * Fetch games formatted for the ticker display
 */
export async function fetchTickerGames(): Promise<TickerGame[]> {
  // Fetch FBS games (group 80)
  const data = await fetchESPNScoreboard({ groups: '80', limit: 50 });
  if (!data?.events) return [];

  return data.events
    .map(transformToTickerGame)
    .filter((game): game is TickerGame => game !== null);
}

/**
 * Fetch games for a specific date
 */
export async function fetchGamesByDate(date: string): Promise<TickerGame[]> {
  const data = await fetchESPNScoreboard({ dates: date, groups: '80', limit: 50 });
  if (!data?.events) return [];

  return data.events
    .map(transformToTickerGame)
    .filter((game): game is TickerGame => game !== null);
}

// ============================================
// STANDINGS API
// ============================================

export interface StandingsTeam {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  wins: number;
  losses: number;
  conferenceWins: number;
  conferenceLosses: number;
  rank?: number;
  streak?: string;
  homeRecord?: string;
  awayRecord?: string;
}

export interface ConferenceStandings {
  id: string;
  name: string;
  shortName: string;
  teams: StandingsTeam[];
}

/**
 * Fetch CFB standings from ESPN API
 * @param group - 80 for FBS, 81 for FCS (default: 80)
 */
export async function fetchStandings(group: '80' | '81' = '80'): Promise<ConferenceStandings[]> {
  try {
    // CFB season runs Aug-Jan, so use 2025 for the 2025-26 season
    // The current season is 2025-26, which ESPN calls "2025"
    const seasonYear = 2025;
    const url = `https://site.api.espn.com/apis/v2/sports/football/college-football/standings?group=${group}&season=${seasonYear}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CFB-HQ/1.0)',
      },
      next: { revalidate: 300 }, // 5 minute cache
    });

    if (!response.ok) {
      console.error(`ESPN Standings API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const conferences: ConferenceStandings[] = [];

    // Helper to parse "W-L" record format
    const parseRecord = (displayValue: string): { wins: number; losses: number } => {
      if (!displayValue || !displayValue.includes('-')) return { wins: 0, losses: 0 };
      const parts = displayValue.split('-');
      return {
        wins: parseInt(parts[0]) || 0,
        losses: parseInt(parts[1]) || 0,
      };
    };

    // Helper to parse standings entries into teams
    const parseStandingsEntries = (entries: unknown[]): StandingsTeam[] => {
      const teams: StandingsTeam[] = [];
      for (const entry of entries) {
        const typedEntry = entry as { team?: { id: string; displayName?: string; name?: string; abbreviation?: string; logos?: Array<{ href: string }> }; stats?: Array<{ name: string; displayValue?: string }> };
        const team = typedEntry.team;
        if (!team) continue;

        const stats = typedEntry.stats || [];

        // Find overall record (name="overall") and conference record (name="vs. Conf.")
        const overallStat = stats.find((s: { name: string }) => s.name === 'overall');
        const confStat = stats.find((s: { name: string }) => s.name === 'vs. Conf.');
        const streakStat = stats.find((s: { name: string }) => s.name === 'streak');
        const homeStat = stats.find((s: { name: string }) => s.name === 'Home');
        const awayStat = stats.find((s: { name: string }) => s.name === 'Away');

        const overallRecord = parseRecord(overallStat?.displayValue || '');
        const confRecord = parseRecord(confStat?.displayValue || '');

        teams.push({
          id: team.id,
          name: team.displayName || team.name || '',
          abbreviation: team.abbreviation || '',
          logo: team.logos?.[0]?.href || '',
          wins: overallRecord.wins,
          losses: overallRecord.losses,
          conferenceWins: confRecord.wins,
          conferenceLosses: confRecord.losses,
          streak: streakStat?.displayValue || '',
          homeRecord: homeStat?.displayValue || '',
          awayRecord: awayStat?.displayValue || '',
        });
      }
      return teams;
    };

    // Helper to sort teams by conference wins, then conference losses, then overall wins
    const sortTeams = (teams: StandingsTeam[]) => {
      teams.sort((a, b) => {
        if (b.conferenceWins !== a.conferenceWins) {
          return b.conferenceWins - a.conferenceWins;
        }
        if (a.conferenceLosses !== b.conferenceLosses) {
          return a.conferenceLosses - b.conferenceLosses;
        }
        return b.wins - a.wins;
      });
    };

    // Parse the standings response
    if (data.children) {
      for (const conference of data.children) {
        // Check if conference has divisions (children) or direct standings
        if (conference.children && Array.isArray(conference.children)) {
          // Conference has divisions (e.g., Sun Belt East/West, SWAC East/West)
          // Create separate entries for each division
          for (const division of conference.children) {
            const divisionStandings: ConferenceStandings = {
              id: division.id || `${conference.id}-${division.name}`,
              name: division.name || '',
              shortName: division.shortName || division.abbreviation || '',
              teams: [],
            };

            const divisionEntries = division.standings?.entries || [];
            divisionStandings.teams = parseStandingsEntries(divisionEntries);
            sortTeams(divisionStandings.teams);

            if (divisionStandings.teams.length > 0) {
              conferences.push(divisionStandings);
            }
          }
        } else {
          // Conference has direct standings (no divisions)
          const confStandings: ConferenceStandings = {
            id: conference.id || '',
            name: conference.name || '',
            shortName: conference.shortName || conference.abbreviation || '',
            teams: [],
          };

          const entries = conference.standings?.entries || [];
          confStandings.teams = parseStandingsEntries(entries);
          sortTeams(confStandings.teams);

          if (confStandings.teams.length > 0) {
            conferences.push(confStandings);
          }
        }
      }
    }

    // Sort conferences alphabetically
    conferences.sort((a, b) => a.name.localeCompare(b.name));

    return conferences;
  } catch (error) {
    console.error('ESPN Standings fetch error:', error);
    return [];
  }
}

// ============================================
// SCHEDULE API (Enhanced for Schedule Page)
// ============================================

export interface GameLeader {
  name: string;
  displayValue: string;
  value: number;
  headshot?: string;
  position?: string;
  teamId?: string;
}

export interface ScheduleGame {
  id: string;
  date: string;
  name: string;
  shortName: string;
  week?: number;
  seasonType?: string;
  venue?: {
    name: string;
    city?: string;
    state?: string;
  };
  broadcasts?: string[];
  awayTeam: {
    id: string;
    name: string;
    abbreviation: string;
    logo: string;
    score?: number;
    rank?: number;
    record?: string;
  };
  homeTeam: {
    id: string;
    name: string;
    abbreviation: string;
    logo: string;
    score?: number;
    rank?: number;
    record?: string;
  };
  status: {
    state: 'pre' | 'in' | 'post';
    detail: string;
    shortDetail: string;
    completed: boolean;
  };
  isConferenceGame?: boolean;
  leaders?: {
    passing?: GameLeader;
    rushing?: GameLeader;
    receiving?: GameLeader;
  };
  note?: string; // Bowl game name or special event (e.g., "Rose Bowl", "CFP Semifinal")
}

/**
 * Transform ESPN event to schedule game format
 */
export function transformToScheduleGame(event: ESPNEvent): ScheduleGame | null {
  if (!event.competitions || event.competitions.length === 0) return null;
  const competition = event.competitions[0];
  if (!competition) return null;

  const awayCompetitor = competition.competitors.find(c => c.homeAway === 'away');
  const homeCompetitor = competition.competitors.find(c => c.homeAway === 'home');

  if (!awayCompetitor || !homeCompetitor) return null;

  const isLive = competition.status.type.state === 'in';
  const isFinal = competition.status.type.state === 'post';
  const hasScore = isLive || isFinal;

  // Get broadcast info
  const broadcasts: string[] = [];
  if (competition.broadcasts) {
    for (const broadcast of competition.broadcasts) {
      if (broadcast.names) {
        broadcasts.push(...broadcast.names);
      }
    }
  }

  // Extract team records (overall record)
  const getTeamRecord = (competitor: ESPNCompetitor): string | undefined => {
    const overallRecord = competitor.records?.find(r => r.type === 'total');
    return overallRecord?.summary;
  };

  // Extract bowl/event name from notes
  const getEventNote = (): string | undefined => {
    if (competition.notes && competition.notes.length > 0) {
      const eventNote = competition.notes.find(n => n.type === 'event');
      return eventNote?.headline;
    }
    return undefined;
  };

  return {
    id: event.id,
    date: event.date,
    name: event.name,
    shortName: event.shortName,
    venue: competition.venue ? {
      name: competition.venue.fullName,
      city: competition.venue.address?.city,
      state: competition.venue.address?.state,
    } : undefined,
    broadcasts,
    awayTeam: {
      id: awayCompetitor.id,
      name: awayCompetitor.team.displayName,
      abbreviation: awayCompetitor.team.abbreviation,
      logo: awayCompetitor.team.logo,
      score: hasScore ? parseInt(awayCompetitor.score || '0') : undefined,
      rank: awayCompetitor.curatedRank?.current,
      record: getTeamRecord(awayCompetitor),
    },
    homeTeam: {
      id: homeCompetitor.id,
      name: homeCompetitor.team.displayName,
      abbreviation: homeCompetitor.team.abbreviation,
      logo: homeCompetitor.team.logo,
      score: hasScore ? parseInt(homeCompetitor.score || '0') : undefined,
      rank: homeCompetitor.curatedRank?.current,
      record: getTeamRecord(homeCompetitor),
    },
    status: {
      state: competition.status.type.state,
      detail: competition.status.type.detail,
      shortDetail: competition.status.type.shortDetail,
      completed: competition.status.type.completed,
    },
    leaders: extractGameLeaders(competition),
    note: getEventNote(),
  };
}

/**
 * Extract game leaders from competition data
 */
function extractGameLeaders(competition: ESPNCompetition): ScheduleGame['leaders'] | undefined {
  if (!competition.leaders || competition.leaders.length === 0) {
    return undefined;
  }

  const leaders: ScheduleGame['leaders'] = {};

  for (const leaderCategory of competition.leaders) {
    const topLeader = leaderCategory.leaders?.[0];
    if (!topLeader) continue;

    const leaderData: GameLeader = {
      name: topLeader.athlete.shortName || topLeader.athlete.fullName,
      displayValue: topLeader.displayValue,
      value: topLeader.value,
      headshot: topLeader.athlete.headshot,
      position: topLeader.athlete.position?.abbreviation,
      teamId: topLeader.athlete.team?.id,
    };

    switch (leaderCategory.name) {
      case 'passingYards':
        leaders.passing = leaderData;
        break;
      case 'rushingYards':
        leaders.rushing = leaderData;
        break;
      case 'receivingYards':
        leaders.receiving = leaderData;
        break;
    }
  }

  // Only return leaders if we have at least one
  if (leaders.passing || leaders.rushing || leaders.receiving) {
    return leaders;
  }

  return undefined;
}

/**
 * Fetch schedule/games with full details
 * @param options.groups - 80 for FBS, 81 for FCS (default: 80)
 */
export async function fetchSchedule(options?: {
  dates?: string;
  week?: number;
  groups?: '80' | '81';
  limit?: number;
}): Promise<ScheduleGame[]> {
  const data = await fetchESPNScoreboard({
    dates: options?.dates,
    groups: options?.groups || '80',
    limit: options?.limit || 100,
  });

  if (!data?.events) return [];

  return data.events
    .map(transformToScheduleGame)
    .filter((game): game is ScheduleGame => game !== null);
}

/**
 * Fetch schedule for a specific week
 * @param group - 80 for FBS, 81 for FCS (default: 80)
 */
export async function fetchScheduleByWeek(week: number, seasonType: number = 2, group: '80' | '81' = '80'): Promise<ScheduleGame[]> {
  try {
    const url = new URL('https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard');
    url.searchParams.set('groups', group);
    url.searchParams.set('week', String(week));
    url.searchParams.set('seasontype', String(seasonType));
    url.searchParams.set('limit', '100');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CFB-HQ/1.0)',
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error(`ESPN Schedule API error: ${response.status}`);
      return [];
    }

    const data: ESPNScoreboardResponse = await response.json();

    return data.events
      .map(transformToScheduleGame)
      .filter((game): game is ScheduleGame => game !== null);
  } catch (error) {
    console.error('ESPN Schedule fetch error:', error);
    return [];
  }
}
