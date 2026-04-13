import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

const CHANNEL_ID = 'UCiwWI74RHeKeUz9rniL8C6Q'; // Football Debate Club (@FDC365)
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

export async function GET() {
  try {
    const response = await fetch(FEED_URL, {
      headers: { 'User-Agent': 'PFN-Internal-NON-Blocking' },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return NextResponse.json({ videos: [] }, { status: 502 });
    }

    const xml = await response.text();
    const $ = cheerio.load(xml, { xmlMode: true });

    const videos: { videoId: string; title: string; url: string; thumbnail: string; published: string }[] = [];

    $('entry').each((_i, el) => {
      const videoId = $(el).find('yt\\:videoId').text().trim();
      const title = $(el).find('title').text().trim();
      const url = $(el).find('link[rel="alternate"]').attr('href') || `https://www.youtube.com/watch?v=${videoId}`;
      const thumbnail = $(el).find('media\\:thumbnail').attr('url') || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      const published = $(el).find('published').text().trim();

      // Skip YouTube Shorts
      if (videoId && title && !url.includes('/shorts/')) {
        videos.push({ videoId, title, url, thumbnail, published });
      }
    });

    return NextResponse.json(
      { videos: videos.slice(0, 3) },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800' } }
    );
  } catch {
    return NextResponse.json({ videos: [] }, { status: 502 });
  }
}
