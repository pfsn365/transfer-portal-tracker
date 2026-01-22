import { NextResponse } from 'next/server';
import { teamSlugToEspnId } from '@/utils/espnTeamIds';
import { allTeams } from '@/data/teams';

// Global player index: playerSlug -> { player data, team info }
interface PlayerIndexEntry {
  player: any;
  teamSlug: string;
  espnTeamId: number;
  teamInfo: any;
}

let playerIndex: Map<string, PlayerIndexEntry> | null = null;
let playerIndexTimestamp = 0;
const INDEX_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let indexBuildPromise: Promise<void> | null = null;

async function fetchWithRetry(url: string, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CFB-Hub/1.0)',
        },
        cache: 'no-store',
      });
      if (response.ok) return response;
      if (i === retries) return response;
    } catch (error) {
      if (i === retries) throw error;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Fetch failed');
}

// Build the global player index by fetching all rosters in parallel
async function buildPlayerIndex(): Promise<void> {
  const newIndex = new Map<string, PlayerIndexEntry>();

  // Only fetch FBS teams (major conferences)
  const fbsTeams = Object.entries(teamSlugToEspnId);

  // Fetch all team rosters in parallel (batch to avoid overwhelming ESPN)
  const batchSize = 20;
  for (let i = 0; i < fbsTeams.length; i += batchSize) {
    const batch = fbsTeams.slice(i, i + batchSize);

    const rosterPromises = batch.map(async ([teamSlug, espnTeamId]) => {
      try {
        const url = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${espnTeamId}/roster`;
        const response = await fetchWithRetry(url);

        if (!response.ok) {
          console.error(`Failed to fetch roster for ${teamSlug}: ${response.status}`);
          return null;
        }

        const data = await response.json();
        return { teamSlug, espnTeamId, data };
      } catch (error) {
        console.error(`Error fetching roster for ${teamSlug}:`, error);
        return null;
      }
    });

    const results = await Promise.all(rosterPromises);

    // Build the index from all successful roster fetches
    for (const result of results) {
      if (!result) continue;

      const { teamSlug, espnTeamId, data } = result;
      const athletes: any[] = [];

      // Flatten position groups
      (data.athletes || []).forEach((group: any) => {
        if (group.items && Array.isArray(group.items)) {
          athletes.push(...group.items);
        }
      });

      const teamInfo = data.team || null;

      for (const athlete of athletes) {
        const athleteName = athlete.fullName || athlete.displayName;
        const slug = slugify(athleteName);

        newIndex.set(slug, {
          player: athlete,
          teamSlug,
          espnTeamId,
          teamInfo,
        });
      }
    }

    // Small delay between batches
    if (i + batchSize < fbsTeams.length) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  playerIndex = newIndex;
  playerIndexTimestamp = Date.now();
  console.log(`CFB Player index built with ${newIndex.size} players`);
}

// Get or build the player index (with deduplication for concurrent requests)
async function getPlayerIndex(): Promise<Map<string, PlayerIndexEntry>> {
  const now = Date.now();

  // If index is fresh, return it
  if (playerIndex && now - playerIndexTimestamp < INDEX_CACHE_TTL) {
    return playerIndex;
  }

  // If another request is already building the index, wait for it
  if (indexBuildPromise) {
    await indexBuildPromise;
    if (playerIndex) return playerIndex;
  }

  // Build the index (only one concurrent build at a time)
  indexBuildPromise = buildPlayerIndex();
  try {
    await indexBuildPromise;
  } finally {
    indexBuildPromise = null;
  }

  if (!playerIndex) {
    throw new Error('Failed to build player index');
  }

  return playerIndex;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Transfer portal API URL
const TRANSFER_PORTAL_API = 'https://staticj.profootballnetwork.com/assets/sheets/tools/cfb-transfer-portal-tracker/transferPortalTrackerData.json';

// Cache for transfer portal data
let transferPortalCache: any[] | null = null;
let transferPortalCacheTimestamp = 0;
const TRANSFER_PORTAL_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function getTransferPortalData(): Promise<any[]> {
  const now = Date.now();
  if (transferPortalCache && now - transferPortalCacheTimestamp < TRANSFER_PORTAL_CACHE_TTL) {
    return transferPortalCache;
  }

  try {
    const response = await fetch(TRANSFER_PORTAL_API, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CFB-Hub/1.0)' },
      next: { revalidate: 600 },
    });

    if (!response.ok) return [];

    const data = await response.json();
    const sheetData = data?.collections?.[0]?.data || [];

    // Skip header row and transform
    const players = sheetData.slice(1).map((row: string[], idx: number) => ({
      name: row[0]?.trim() || '',
      position: row[1]?.trim() || '',
      class: row[2]?.trim() || '',
      formerSchool: row[3]?.trim() || '',
      formerConference: row[4]?.trim() || '',
      newSchool: row[5]?.trim() || '',
      newConference: row[6]?.trim() || '',
      status: row[7]?.trim() || '',
      date: row[8]?.trim() || '',
      impactGrade: row[9]?.trim() || '',
    }));

    transferPortalCache = players;
    transferPortalCacheTimestamp = now;
    return players;
  } catch (error) {
    console.error('Error fetching transfer portal data:', error);
    return transferPortalCache || [];
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ playerSlug: string }> }
) {
  try {
    const { playerSlug } = await params;
    const url = new URL(request.url);
    const seasonParam = url.searchParams.get('season');

    // Look up player from the global index (O(1) lookup)
    const index = await getPlayerIndex();
    const playerEntry = index.get(playerSlug);

    if (!playerEntry) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const { player: foundPlayer, teamSlug: foundTeamSlug, espnTeamId: foundEspnTeamId, teamInfo: foundTeamInfo } = playerEntry;
    const athleteId = foundPlayer.id;
    const playerName = foundPlayer.fullName || foundPlayer.displayName;

    // Get team data for additional info
    const teamData = allTeams.find(t => t.slug === foundTeamSlug);

    // Build game log URL with optional season parameter
    const gameLogUrl = seasonParam
      ? `https://site.web.api.espn.com/apis/common/v3/sports/football/college-football/athletes/${athleteId}/gamelog?season=${seasonParam}`
      : `https://site.web.api.espn.com/apis/common/v3/sports/football/college-football/athletes/${athleteId}/gamelog`;

    // Fetch additional player data from ESPN and transfer portal in parallel
    const [statsResponse, gameLogResponse, athleteResponse, transferPortalData] = await Promise.all([
      fetchWithRetry(
        `https://site.web.api.espn.com/apis/common/v3/sports/football/college-football/athletes/${athleteId}/stats`
      ).catch(() => null),
      fetchWithRetry(gameLogUrl).catch(() => null),
      fetchWithRetry(
        `https://site.web.api.espn.com/apis/common/v3/sports/football/college-football/athletes/${athleteId}`
      ).catch(() => null),
      getTransferPortalData(),
    ]);

    let statsData: any = null;
    let gameLogData: any = null;
    let athleteData: any = null;

    if (statsResponse?.ok) {
      statsData = await statsResponse.json();
    }

    if (gameLogResponse?.ok) {
      gameLogData = await gameLogResponse.json();
    }

    if (athleteResponse?.ok) {
      athleteData = await athleteResponse.json();
    }

    // Find transfer portal entry for this player (fuzzy match on name)
    const playerNameLower = playerName.toLowerCase();
    const transferEntry = transferPortalData.find((p: any) => {
      const portalNameLower = p.name.toLowerCase();
      return portalNameLower === playerNameLower ||
        portalNameLower.includes(playerNameLower) ||
        playerNameLower.includes(portalNameLower);
    });

    // Build transfer portal history if found
    let transferPortalHistory: any = null;
    if (transferEntry) {
      transferPortalHistory = {
        status: transferEntry.status === 'Committed' || transferEntry.newSchool ? 'Committed' : 'In Portal',
        enteredDate: transferEntry.date || null,
        formerSchool: transferEntry.formerSchool || null,
        formerConference: transferEntry.formerConference || null,
        newSchool: transferEntry.newSchool || null,
        newConference: transferEntry.newConference || null,
        impactGrade: transferEntry.impactGrade ? parseFloat(transferEntry.impactGrade) : null,
        position: transferEntry.position || null,
        class: transferEntry.class || null,
      };
    }

    // Extract current season stats and career stats from ESPN API
    let currentSeasonStats: any = null;
    const careerStats: any[] = [];

    if (statsData?.categories) {
      // CFB stats are organized by category (passing, rushing, receiving, etc.)
      for (const category of statsData.categories) {
        if (category.statistics && category.labels) {
          const labels = category.labels;
          const sortedStats = [...category.statistics].sort(
            (a: any, b: any) => (b.season?.year || 0) - (a.season?.year || 0)
          );

          if (sortedStats.length > 0) {
            // Build career stats for this category
            const categoryCareerStats = sortedStats.map((season: any) => ({
              season: season.season?.displayName || `${season.season?.year}`,
              team: season.team?.displayName || '',
              teamAbbr: season.team?.abbreviation || '',
              stats: {
                categories: labels,
                values: season.stats.map((s: string) => {
                  const parsed = parseFloat(s);
                  return isNaN(parsed) ? s : parsed;
                }),
                labels: labels,
              },
            }));

            // Add to career stats with category name
            careerStats.push({
              category: category.name,
              displayName: category.displayName || category.name,
              seasons: categoryCareerStats,
            });

            // Set current season stats (most recent)
            if (!currentSeasonStats) {
              currentSeasonStats = {};
            }
            currentSeasonStats[category.name] = {
              categories: labels,
              values: sortedStats[0].stats.map((s: string) => {
                const parsed = parseFloat(s);
                return isNaN(parsed) ? s : parsed;
              }),
              labels: labels,
            };
          }
        }
      }
    }

    // Extract game log
    let gameLog: any[] = [];
    if (gameLogData?.events && typeof gameLogData.events === 'object') {
      const labels = gameLogData.labels || [];

      // Build a map of eventId to stats from seasonTypes
      const statsMap: Record<string, string[]> = {};
      if (gameLogData.seasonTypes) {
        for (const seasonType of gameLogData.seasonTypes) {
          for (const category of seasonType.categories || []) {
            for (const event of category.events || []) {
              if (event.eventId && event.stats) {
                statsMap[event.eventId] = event.stats;
              }
            }
          }
        }
      }

      // Convert events object to array and sort by date
      const eventsArray = Object.values(gameLogData.events) as any[];
      const sortedEvents = eventsArray.sort((a, b) =>
        new Date(b.gameDate).getTime() - new Date(a.gameDate).getTime()
      );

      gameLog = sortedEvents.slice(0, 15).map((event: any) => {
        const stats = statsMap[event.id] || [];
        return {
          gameId: event.id,
          date: event.gameDate,
          opponent: event.opponent?.displayName || '',
          opponentAbbr: event.opponent?.abbreviation || '',
          opponentLogo: event.opponent?.logo || '',
          homeAway: event.atVs === '@' ? 'away' : 'home',
          result: event.gameResult,
          score: event.score,
          stats: {
            categories: labels,
            values: stats.map((s: string) => {
              const parsed = parseFloat(s);
              return isNaN(parsed) ? s : parsed;
            }),
            labels: labels,
          },
        };
      });
    }

    // Get available seasons for game log from filters
    let availableSeasons: { value: string; displayValue: string }[] = [];
    if (gameLogData?.filters) {
      const seasonFilter = gameLogData.filters.find((f: any) => f.name === 'season');
      if (seasonFilter?.options) {
        availableSeasons = seasonFilter.options.map((opt: any) => ({
          value: opt.value,
          displayValue: opt.displayValue,
        }));
      }
    }

    // Format height
    let heightFormatted = '—';
    if (foundPlayer.displayHeight) {
      heightFormatted = foundPlayer.displayHeight;
    } else if (foundPlayer.height) {
      const feet = Math.floor(foundPlayer.height / 12);
      const inches = Math.round(foundPlayer.height % 12);
      heightFormatted = `${feet}'${inches}"`;
    }

    // Format hometown
    const hometown = foundPlayer.birthPlace
      ? [foundPlayer.birthPlace.city, foundPlayer.birthPlace.state].filter(Boolean).join(', ')
      : '';

    // Get team primary color
    const teamPrimaryColor = teamData?.conference
      ? getConferenceColor(teamData.conference)
      : '#800000';

    // Build player profile response
    const playerProfile = {
      id: athleteId,
      slug: playerSlug,
      name: foundPlayer.fullName || foundPlayer.displayName,
      firstName: foundPlayer.firstName || '',
      lastName: foundPlayer.lastName || '',
      jersey: foundPlayer.jersey || '',
      position: foundPlayer.position?.abbreviation || '',
      positionName: foundPlayer.position?.name || '',
      height: heightFormatted,
      weight: foundPlayer.displayWeight || (foundPlayer.weight ? `${foundPlayer.weight} lbs` : '—'),
      class: foundPlayer.experience?.displayValue || '',
      hometown,
      highSchool: '', // ESPN doesn't provide reliable high school data for CFB
      birthDate: foundPlayer.dateOfBirth || '',
      headshot: foundPlayer.headshot?.href || `https://a.espncdn.com/i/headshots/college-football/players/full/${athleteId}.png`,
      team: {
        id: String(foundEspnTeamId),
        slug: foundTeamSlug,
        name: foundTeamInfo?.displayName || foundTeamInfo?.name || '',
        abbreviation: foundTeamInfo?.abbreviation || '',
        logo: foundTeamInfo?.logo || `https://a.espncdn.com/i/teamlogos/ncaa/500/${foundEspnTeamId}.png`,
        primaryColor: teamPrimaryColor,
      },
      currentSeasonStats,
      careerStats,
      gameLog,
      availableSeasons,
      transferPortalHistory,
    };

    return NextResponse.json(playerProfile);
  } catch (error) {
    console.error('Error fetching player:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player data' },
      { status: 500 }
    );
  }
}

// Helper to get conference-based team color
function getConferenceColor(conference: string): string {
  const colors: Record<string, string> = {
    'SEC': '#800000',
    'Big Ten': '#0033a0',
    'Big 12': '#004c00',
    'ACC': '#013ca6',
    'Pac-12': '#1c4c1c',
    'American': '#cc0000',
    'Mountain West': '#1e4d8c',
    'Sun Belt': '#ffc222',
    'MAC': '#006400',
    'Conference USA': '#003087',
    'Independent': '#0c2340',
  };
  return colors[conference] || '#800000';
}
