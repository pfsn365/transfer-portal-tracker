'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Pagination from '@/components/Pagination';
import TransferPortalBanner from '@/components/TransferPortalBanner';
import RaptiveHeaderAd from '@/components/RaptiveHeaderAd';
import Footer from '@/components/Footer';
import { getApiPath } from '@/utils/api';

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

const CFB_FEED_URL = 'https://www.profootballnetwork.com/feed/cfb-feed/';

export default function ArticlesClient() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load items per page from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cfb-articles-per-page');
      if (stored) {
        const parsed = parseInt(stored, 10);
        if ([12, 24, 48].includes(parsed)) {
          setItemsPerPage(parsed);
        }
      }
    }
  }, []);

  // Fetch articles
  const fetchArticles = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        getApiPath(`api/proxy-rss?url=${encodeURIComponent(CFB_FEED_URL)}`),
        { signal }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }

      const data = await response.json();
      setArticles(data.articles || []);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.error('Error fetching articles:', err);
      setError('Failed to load articles. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchArticles]);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (count: number) => {
    localStorage.setItem('cfb-articles-per-page', count.toString());
    setItemsPerPage(count);
    setCurrentPage(1);
  };

  const handleImageError = (link: string) => {
    setImageErrors(prev => new Set(prev).add(link));
  };

  // Format relative time
  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  // Paginate articles
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedArticles = articles.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(articles.length / itemsPerPage);

  return (
    <main id="main-content">
      {/* Hero Header */}
      <header
        className="text-white shadow-lg"
        style={{
          background: 'linear-gradient(180deg, #0050A0 0%, #003a75 100%)',
          boxShadow: 'inset 0 -30px 40px -30px rgba(0,0,0,0.15), 0 4px 6px -1px rgba(0,0,0,0.1)',
        }}
      >
        <div className="container mx-auto px-4 pt-6 sm:pt-7 md:pt-8 lg:pt-10 pb-3 sm:pb-4 md:pb-5 lg:pb-6">
          <h1 className="text-4xl lg:text-5xl font-extrabold mb-2">CFB Articles</h1>
          <p className="text-lg opacity-90 font-medium">Latest college football news and analysis</p>
        </div>
      </header>

      <TransferPortalBanner />
      <RaptiveHeaderAd />

      {/* Content */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-[1200px]">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Browse Articles</h2>

        {/* Articles Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Loading State */}
          {loading && (
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg overflow-hidden animate-pulse">
                    <div className="w-full aspect-video bg-gray-200" />
                    <div className="p-4">
                      <div className="h-6 w-3/4 bg-gray-200 rounded mb-2" />
                      <div className="h-4 w-full bg-gray-200 rounded mb-1" />
                      <div className="h-4 w-5/6 bg-gray-200 rounded mb-4" />
                      <div className="flex justify-between">
                        <div className="h-3 w-20 bg-gray-200 rounded" />
                        <div className="h-3 w-16 bg-gray-200 rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="p-8 text-center">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 inline-block">
                <p className="text-red-700 mb-4">{error}</p>
                <button
                  onClick={() => fetchArticles()}
                  className="px-4 py-2 bg-[#0050A0] text-white rounded-lg hover:bg-[#003a75] transition-colors cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Articles Grid */}
          {!loading && !error && (
            <>
              {articles.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No articles found
                </div>
              ) : (
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedArticles.map((article, index) => (
                      <a
                        key={`${article.link}-${index}`}
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                      >
                        {/* Featured Image */}
                        {article.featuredImage && !imageErrors.has(article.link) ? (
                          <div className="aspect-video overflow-hidden bg-gray-200">
                            <img
                              src={article.featuredImage}
                              alt={article.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                              onError={() => handleImageError(article.link)}
                            />
                          </div>
                        ) : (
                          <div className="aspect-video bg-gradient-to-br from-[#0050A0] to-[#003a75] flex items-center justify-center">
                            <span className="text-white text-4xl font-bold opacity-30">PFSN</span>
                          </div>
                        )}

                        {/* Article Content */}
                        <div className="p-4">
                          {/* Category Badge */}
                          {article.category && (
                            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded mb-2">
                              {article.category}
                            </span>
                          )}
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#0050A0] mb-2 line-clamp-2 transition-colors">
                            {article.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {article.description}
                          </p>
                          {/* Meta row */}
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-2">
                              <span>{getRelativeTime(article.pubDate)}</span>
                              {article.author && (
                                <>
                                  <span className="text-gray-300">|</span>
                                  <span>{article.author}</span>
                                </>
                              )}
                            </div>
                            {article.readTime && (
                              <span className="flex-shrink-0">{article.readTime}</span>
                            )}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Pagination */}
              {articles.length > 0 && totalPages > 1 && (
                <div className="bg-gray-50 px-4 border-t border-gray-200">
                  <Pagination
                    totalPages={totalPages}
                    totalItems={articles.length}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    itemsPerPageOptions={[12, 24, 48]}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Footer currentPage="Articles" />
    </main>
  );
}
