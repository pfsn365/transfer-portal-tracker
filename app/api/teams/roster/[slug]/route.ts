import { NextResponse } from 'next/server';
import { getEspnIdFromSlug } from '@/utils/espnTeamIds';
import { getTeamBySlug } from '@/data/teams';

interface ESPNAthlete {
  id: string;
  fullName: string;
  displayName: string;
  jersey?: string;
  position?: {
    abbreviation: string;
    name: string;
  };
  height?: number;
  displayHeight?: string;
  weight?: number;
  displayWeight?: string;
  experience?: {
    years: number;
    displayValue: string;
  };
  birthPlace?: {
    city?: string;
    state?: string;
    country?: string;
  };
  headshot?: {
    href: string;
  };
}

interface ESPNPositionGroup {
  position: string;
  items: ESPNAthlete[];
}

interface ESPNCoach {
  id: string;
  firstName: string;
  lastName: string;
  experience?: number;
}

interface ESPNRosterResponse {
  athletes?: ESPNPositionGroup[];
  coach?: ESPNCoach[];
  team?: {
    id: string;
    name: string;
  };
}

interface CFBDPlayer {
  id: number;
  first_name: string;
  last_name: string;
  team: string;
  weight?: number;
  height?: number;
  jersey?: string | number;
  year?: number;
  position?: string;
  home_city?: string;
  home_state?: string;
  home_country?: string;
  headshot_url?: string;
}

const yearToClass: Record<number, string> = { 1: 'FR', 2: 'SO', 3: 'JR', 4: 'SR', 5: '5th' };

function formatHeight(inches: number): string {
  const feet = Math.floor(inches / 12);
  const rem = Math.round(inches % 12);
  return `${feet}'${rem}"`;
}

async function fetchCFBDRoster(teamId: string) {
  const apiKey = process.env.CFBD_API_KEY;
  if (!apiKey) return null;

  const url = `https://api.collegefootballdata.com/roster?team=${encodeURIComponent(teamId)}&year=2025`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
    next: { revalidate: 3600 },
  });
  if (!response.ok) return null;

  const data: CFBDPlayer[] = await response.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  return data.map((p) => ({
    id: String(p.id),
    name: `${p.first_name} ${p.last_name}`.trim(),
    jersey: p.jersey != null ? String(p.jersey) : '-',
    position: p.position || '-',
    height: p.height ? formatHeight(p.height) : '-',
    weight: p.weight ? `${p.weight} lbs` : '-',
    class: p.year != null ? (yearToClass[p.year] ?? '-') : '-',
    hometown: [p.home_city, p.home_state].filter(Boolean).join(', ') || '-',
    headshot: p.headshot_url || undefined,
  }));
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const team = getTeamBySlug(slug);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const espnId = getEspnIdFromSlug(slug);

    let roster: ReturnType<typeof Array.prototype.map> = [];
    let headCoach: string | undefined;

    if (espnId) {
      const url = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${espnId}/roster`;
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 3600 },
      });

      if (response.ok) {
        const data: ESPNRosterResponse = await response.json();

        const allAthletes: ESPNAthlete[] = [];
        (data.athletes || []).forEach((group: ESPNPositionGroup) => {
          if (group.items && Array.isArray(group.items)) {
            allAthletes.push(...group.items);
          }
        });

        roster = allAthletes.map((athlete: ESPNAthlete) => {
          let heightFormatted = '-';
          if (athlete.displayHeight) {
            heightFormatted = athlete.displayHeight;
          } else if (athlete.height) {
            heightFormatted = formatHeight(athlete.height);
          }

          const hometown = athlete.birthPlace
            ? [athlete.birthPlace.city, athlete.birthPlace.state].filter(Boolean).join(', ')
            : '-';

          return {
            id: athlete.id,
            name: athlete.displayName || athlete.fullName,
            jersey: athlete.jersey || '-',
            position: athlete.position?.abbreviation || '-',
            height: heightFormatted,
            weight: athlete.displayWeight || (athlete.weight ? `${athlete.weight} lbs` : '-'),
            class: athlete.experience?.displayValue || '-',
            hometown,
            headshot: athlete.headshot?.href,
          };
        });

        headCoach = data.coach?.[0]
          ? `${data.coach[0].firstName} ${data.coach[0].lastName}`
          : undefined;
      }
    }

    // CFBD fallback when ESPN returns nothing
    if (roster.length === 0) {
      const cfbdRoster = await fetchCFBDRoster(team.id);
      if (cfbdRoster) roster = cfbdRoster;
    }

    return NextResponse.json({
      team: team.name,
      roster,
      totalPlayers: roster.length,
      headCoach,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800' },
    });
  } catch (error) {
    console.error('Error fetching roster:', error);
    return NextResponse.json({ error: 'Failed to fetch roster data' }, { status: 500 });
  }
}
