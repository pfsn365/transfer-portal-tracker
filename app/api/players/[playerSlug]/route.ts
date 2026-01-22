import { NextResponse } from 'next/server';

// Placeholder API route for individual CFB player profile
// This will be implemented later with actual player data sources

export async function GET(
  request: Request,
  { params }: { params: Promise<{ playerSlug: string }> }
) {
  try {
    const { playerSlug } = await params;

    // Placeholder response - to be implemented with actual player data
    return NextResponse.json(
      {
        error: 'Player not found',
        message: 'Individual player API coming soon',
      },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error fetching player:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player' },
      { status: 500 }
    );
  }
}
