import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const dir = path.join(process.cwd(), 'public', 'player-images');
  let slugs: string[] = [];
  if (fs.existsSync(dir)) {
    slugs = fs.readdirSync(dir)
      .filter(f => f.endsWith('.png'))
      .map(f => f.replace('.png', ''));
  }
  return NextResponse.json({ slugs }, {
    headers: { 'Cache-Control': 'public, max-age=300' },
  });
}
