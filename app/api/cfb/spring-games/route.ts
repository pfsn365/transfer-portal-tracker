import { NextResponse } from 'next/server';

const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSyMzJ7vYG7nmAS5pMowBs3c0kY2G2_F3EdYAWmxwTyrUAt5r7Hpmd_WEUBZKsGhS8UNW0rRUi355QB/pub?gid=0&single=true&output=csv';

interface SpringGame {
  program: string;
  conference: string;
  date: string;
}

function parseCSV(csv: string): SpringGame[] {
  const lines = csv.trim().split('\n');
  // Skip header row
  const dataLines = lines.slice(1);

  return dataLines
    .map((line) => {
      // Handle commas inside quoted fields
      const fields: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          fields.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      fields.push(current.trim());

      return {
        program: fields[0] || '',
        conference: fields[1] || '',
        date: fields[2] || '',
      };
    })
    .filter((row) => row.program);
}

export async function GET() {
  try {
    const response = await fetch(SHEET_CSV_URL, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`Google Sheets fetch error: ${response.status}`);
    }

    const csv = await response.text();
    const games = parseCSV(csv);

    return NextResponse.json({ games }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    console.error('Spring games API error:', error);

    return NextResponse.json(
      { error: 'Failed to fetch spring game schedule' },
      { status: 500 }
    );
  }
}
