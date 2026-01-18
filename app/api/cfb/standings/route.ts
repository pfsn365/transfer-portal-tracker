import { NextRequest, NextResponse } from 'next/server';
import { fetchStandings } from '@/lib/espn';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const group = searchParams.get('group') as '80' | '81' || '80';

    const standings = await fetchStandings(group);

    return NextResponse.json({
      conferences: standings,
      totalConferences: standings.length,
      lastUpdated: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate',
      },
    });
  } catch (error) {
    console.error('Standings API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch standings' },
      { status: 500 }
    );
  }
}
