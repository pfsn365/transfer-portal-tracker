import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface Article {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  featuredImage?: string;
  author?: string;
  category?: string;
  readTime?: string;
}

function parseRSSItems(xmlText: string): Article[] {
  const $ = cheerio.load(xmlText, { xmlMode: true });
  const articles: Article[] = [];

  $('item').each((_index, element) => {
    const $item = $(element);

    const title = $item.find('title').text().trim();
    const link = $item.find('link').text().trim();
    const pubDate = $item.find('pubDate').text().trim();
    const author = $item.find('dc\\:creator, creator').text().trim();
    const category = $item.find('category').first().text().trim();

    // Extract featured image from media:thumbnail (primary method)
    let featuredImage = $item.find('media\\:thumbnail').attr('url') || '';

    // Fallback: try media:content
    if (!featuredImage) {
      featuredImage = $item.find('media\\:content').attr('url') || '';
    }

    // Fallback: try enclosure
    if (!featuredImage) {
      featuredImage = $item.find('enclosure').attr('url') || '';
    }

    // Fallback: try to extract from content:encoded HTML
    if (!featuredImage) {
      const contentEncoded = $item.find('content\\:encoded').text();
      const imgMatch = contentEncoded.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch) {
        featuredImage = imgMatch[1];
      }
    }

    // Fallback: try to extract from description HTML
    if (!featuredImage) {
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
      .trim()
      .slice(0, 200);

    // Estimate read time based on content length
    const readTime = Math.max(1, Math.round(cleanDescription.length / 200)) + ' min read';

    if (title && link) {
      articles.push({
        title,
        link,
        pubDate,
        description: cleanDescription,
        featuredImage: featuredImage.trim(),
        author: author || 'PFSN',
        category: category || 'CFB News',
        readTime,
      });
    }
  });

  return articles;
}

// Allowed domains for RSS proxying
const ALLOWED_RSS_DOMAINS = [
  'profootballnetwork.com',
  'www.profootballnetwork.com',
];

function isAllowedRssUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    // Check if hostname matches or is a subdomain of allowed domains
    return ALLOWED_RSS_DOMAINS.some(domain =>
      parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rssUrl = searchParams.get('url');

  if (!rssUrl) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  // Validate URL format and domain
  if (!isAllowedRssUrl(rssUrl)) {
    return NextResponse.json({ error: 'Invalid RSS feed URL' }, { status: 400 });
  }

  try {
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
        'Referer': 'https://www.profootballnetwork.com/',
      },
      cache: 'no-store', // Disable Next.js caching to avoid stale 403 responses
    });

    if (!response.ok) {
      console.warn(`[RSS Proxy] Failed to fetch ${rssUrl}: ${response.status}`);
      return NextResponse.json(
        { error: 'Failed to fetch RSS feed', articles: [] },
        { status: response.status >= 400 && response.status < 600 ? response.status : 502 }
      );
    }

    const xmlText = await response.text();
    const articles = parseRSSItems(xmlText);

    return NextResponse.json({
      articles,
      count: articles.length,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
      },
    });
  } catch (error) {
    console.error('RSS proxy error:', error);
    return NextResponse.json(
      { error: 'RSS proxy error', articles: [] },
      { status: 502 }
    );
  }
}
