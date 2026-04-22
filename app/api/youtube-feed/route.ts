import { NextResponse } from 'next/server';

const UPLOADS_PLAYLIST_ID = 'UUiwWI74RHeKeUz9rniL8C6Q'; // UCxxx -> UUxxx for uploads playlist
const BASE = 'https://www.googleapis.com/youtube/v3';

function isoDurationToSeconds(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return parseInt(m[1] || '0') * 3600 + parseInt(m[2] || '0') * 60 + parseInt(m[3] || '0');
}

export async function GET() {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  if (!API_KEY) return NextResponse.json({ videos: [] }, { status: 500 });

  try {
    // Fetch 20 recent uploads so we have enough after filtering out Shorts
    const playlistRes = await fetch(
      `${BASE}/playlistItems?part=snippet&playlistId=${UPLOADS_PLAYLIST_ID}&maxResults=20&key=${API_KEY}`,
      { next: { revalidate: 21600 } }
    );
    if (!playlistRes.ok) return NextResponse.json({ videos: [] }, { status: 502 });

    const playlistData = await playlistRes.json();
    const items: { snippet: { resourceId: { videoId: string }; title: string; publishedAt: string; thumbnails: { maxres?: { url: string }; standard?: { url: string }; high?: { url: string }; medium?: { url: string } } } }[] = playlistData.items || [];

    const candidates = items.map(item => ({
      videoId: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.maxres?.url || item.snippet.thumbnails?.standard?.url || item.snippet.thumbnails?.high?.url || '',
      published: item.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
    }));

    // Fetch durations to filter out Shorts (<= 60 seconds)
    const videoIds = candidates.map(c => c.videoId).join(',');
    const detailsRes = await fetch(
      `${BASE}/videos?part=contentDetails&id=${videoIds}&key=${API_KEY}`,
      { next: { revalidate: 21600 } }
    );
    if (!detailsRes.ok) return NextResponse.json({ videos: [] }, { status: 502 });

    const detailsData = await detailsRes.json();
    const durationMap: Record<string, number> = {};
    for (const item of detailsData.items as { id: string; contentDetails: { duration: string } }[]) {
      durationMap[item.id] = isoDurationToSeconds(item.contentDetails.duration);
    }

    const videos = candidates
      .filter(c => (durationMap[c.videoId] ?? 0) > 60)
      .slice(0, 3);

    return NextResponse.json(
      { videos },
      { headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=3600' } }
    );
  } catch {
    return NextResponse.json({ videos: [] }, { status: 502 });
  }
}
