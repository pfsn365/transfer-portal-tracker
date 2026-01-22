import { NextResponse, NextRequest } from 'next/server';
import { TransferPortalAPIResponse } from '@/types/api';
import { transformAPIData } from '@/utils/dataTransform';

const API_URL = 'https://staticj.profootballnetwork.com/assets/sheets/tools/cfb-transfer-portal-tracker/transferPortalTrackerData.json';

export const revalidate = 3600;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const teamFilter = searchParams.get('team')?.toLowerCase();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(API_URL, {
      headers: {
        'User-Agent': 'PFN-Internal-NON-Blocking',
      },
      next: { revalidate: 3600 },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Return 502 for upstream failures
      return NextResponse.json(
        {
          error: 'Upstream service unavailable',
          players: [],
          updatedTime: new Date().toISOString()
        },
        { status: 502 }
      );
    }

    let apiData: TransferPortalAPIResponse;
    try {
      apiData = await response.json();
    } catch {
      return NextResponse.json(
        {
          error: 'Invalid response from upstream service',
          players: [],
          updatedTime: new Date().toISOString()
        },
        { status: 502 }
      );
    }

    // Validate response structure
    if (!apiData || typeof apiData !== 'object') {
      return NextResponse.json(
        {
          error: 'Invalid data format from upstream service',
          players: [],
          updatedTime: new Date().toISOString()
        },
        { status: 502 }
      );
    }

    if (!apiData.collections || apiData.collections.length === 0) {
      return NextResponse.json({
        players: [],
        updatedTime: new Date().toISOString(),
        totalPlayers: 0,
      });
    }

    const sheetData = apiData.collections[0].data;

    if (!Array.isArray(sheetData)) {
      return NextResponse.json(
        {
          error: 'Invalid data structure from upstream service',
          players: [],
          updatedTime: new Date().toISOString()
        },
        { status: 502 }
      );
    }

    let players = transformAPIData(sheetData);

    // Filter by team if parameter provided (much more efficient than client-side filtering)
    if (teamFilter) {
      players = players.filter((player: any) => {
        const newSchoolLower = (player.newSchool || '').toLowerCase();
        const formerSchoolLower = (player.formerSchool || '').toLowerCase();

        const isIncoming = newSchoolLower === teamFilter ||
                          newSchoolLower.includes(teamFilter);
        const isOutgoing = formerSchoolLower === teamFilter ||
                          formerSchoolLower.includes(teamFilter);

        return isIncoming || isOutgoing;
      });
    }

    return NextResponse.json({
      players,
      updatedTime: apiData.updatedTime || new Date().toISOString(),
      totalPlayers: players.length,
    });

  } catch (error) {
    // Handle abort/timeout
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        {
          error: 'Request timeout - upstream service took too long',
          players: [],
          updatedTime: new Date().toISOString()
        },
        { status: 504 }
      );
    }

    console.error('Error fetching transfer portal data:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        players: [],
        updatedTime: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
