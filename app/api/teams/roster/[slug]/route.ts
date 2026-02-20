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

    // Fetch roster from ESPN API
    const url = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${espnId}/roster`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`ESPN API returned ${response.status}`);
    }

    const data: ESPNRosterResponse = await response.json();

    // Flatten the nested position groups into a single array of players
    const allAthletes: ESPNAthlete[] = [];
    (data.athletes || []).forEach((group: ESPNPositionGroup) => {
      if (group.items && Array.isArray(group.items)) {
        allAthletes.push(...group.items);
      }
    });

    // Transform the roster data
    const roster = allAthletes.map((athlete: ESPNAthlete) => {
      // Use displayHeight if available, otherwise calculate from inches
      let heightFormatted = '-';
      if (athlete.displayHeight) {
        heightFormatted = athlete.displayHeight;
      } else if (athlete.height) {
        const feet = Math.floor(athlete.height / 12);
        const inches = Math.round(athlete.height % 12);
        heightFormatted = `${feet}'${inches}"`;
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

    // Get head coach info
    const headCoach = data.coach?.[0]
      ? `${data.coach[0].firstName} ${data.coach[0].lastName}`
      : undefined;

    return NextResponse.json({
      team: team.name,
      roster,
      totalPlayers: roster.length,
      headCoach,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    console.error('Error fetching roster:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roster data' },
      { status: 500 }
    );
  }
}
