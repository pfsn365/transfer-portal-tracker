import { NextResponse } from 'next/server';
import { TransferPortalAPIResponse } from '@/types/api';
import { transformAPIData } from '@/utils/dataTransform';

const API_URL = 'https://staticj.profootballnetwork.com/assets/sheets/tools/cfb-transfer-portal-tracker/transferPortalTrackerData.json';

export const dynamic = 'force-dynamic'; // Ensure fresh data on each request
export const revalidate = 3600; // Revalidate every hour (3600 seconds)

export async function GET() {
  try {
    // Fetch data from external API
    const response = await fetch(API_URL, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const apiData: TransferPortalAPIResponse = await response.json();

    // Check if data exists
    if (!apiData.collections || apiData.collections.length === 0) {
      return NextResponse.json({
        players: [],
        updatedTime: new Date().toISOString(),
        error: 'No data available'
      });
    }

    // Get the first sheet's data
    const sheetData = apiData.collections[0].data;

    // Transform the data
    const players = transformAPIData(sheetData);

    // Return transformed data with metadata
    return NextResponse.json({
      players,
      updatedTime: apiData.updatedTime || new Date().toISOString(),
      totalPlayers: players.length,
    });

  } catch (error) {
    console.error('Error fetching transfer portal data:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch transfer portal data',
        players: [],
        updatedTime: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
