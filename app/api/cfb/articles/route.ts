import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

const CFB_RSS_FEED = 'https://www.profootballnetwork.com/tag/college-football/feed/';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(CFB_RSS_FEED, {
      method: 'GET',
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'User-Agent': 'Mozilla/5.0 (compatible; PFSN-CFB-HQ/1.0)',
        'Referer': 'https://www.profootballnetwork.com/',
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`RSS feed error: ${response.status} ${response.statusText}`);
    }

    const xmlData = await response.text();
    const $ = cheerio.load(xmlData, { xmlMode: true });
    const articles: any[] = [];

    $('item').each((_index, element) => {
      const $item = $(element);

      const title = $item.find('title').text();
      const link = $item.find('link').text();
      const pubDate = $item.find('pubDate').text();
      const author = $item.find('dc\\:creator, creator').text();
      const category = $item.find('category').first().text();

      // Extract featured image from media:thumbnail or description img tag
      let featuredImage = $item.find('media\\:thumbnail').attr('url') || '';

      if (!featuredImage) {
        // Fallback: try to extract from description HTML
        const descriptionHtml = $item.find('description').text();
        const imgMatch = descriptionHtml.match(/src="([^"]+)"/);
        if (imgMatch) {
          featuredImage = imgMatch[1];
        }
      }

      // Clean up description by removing HTML tags
      const cleanDescription = $item.find('description').text()
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();

      // Estimate read time based on content length
      const readTime = Math.max(1, Math.round(cleanDescription.length / 200)) + ' min read';

      articles.push({
        title: title.trim(),
        description: cleanDescription,
        link: link.trim(),
        pubDate: pubDate.trim(),
        author: author.trim() || 'PFSN',
        category: category.trim() || 'College Football',
        readTime,
        featuredImage: featuredImage.trim(),
      });
    });

    // Sort by publication date (newest first)
    articles.sort((a, b) => {
      const dateA = new Date(a.pubDate).getTime();
      const dateB = new Date(b.pubDate).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({
      success: true,
      articles,
      count: articles.length,
      source: 'PFSN CFB RSS Feed',
    });

  } catch (error) {
    console.error('CFB Articles RSS Feed Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch CFB articles',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Enable CORS for this route
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  const allowedOrigins = [
    'https://www.profootballnetwork.com',
    'https://profootballnetwork.com',
    'http://localhost:3000',
  ];

  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
