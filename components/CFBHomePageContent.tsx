'use client';

import Link from 'next/link';
import Footer from '@/components/Footer';
import RaptiveHeaderAd from '@/components/RaptiveHeaderAd';
import TransferPortalBanner from '@/components/TransferPortalBanner';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { getApiPath } from '@/utils/api';
import { fetcher, swrConfig } from '@/utils/swr';
import { getTeamLogo } from '@/utils/teamLogos';
import type { TransferPlayer } from '@/types/player';

interface StatLeader {
  playerId: string;
  name: string;
  value: string;
  teamLogo: string;
}

interface CategoryData {
  name: string;
  displayName: string;
  leaders: StatLeader[];
}

const SECTIONS = [
  { id: 'transfer-portal', label: 'Transfer Portal' },
  { id: 'stat-leaders', label: 'Stat Leaders' },
  { id: 'tools', label: 'Tools' },
  { id: 'articles', label: 'Articles' },
] as const;

export default function CFBHomePageContent() {
  // Transfer portal state
  const [portalPlayers, setPortalPlayers] = useState<TransferPlayer[]>([]);
  const [portalLoading, setPortalLoading] = useState(true);

  // Stat leaders
  const { data: statLeadersRaw, isLoading: statLeadersLoading } = useSWR(
    getApiPath('api/cfb/stat-leaders'),
    fetcher,
    swrConfig.stable
  );

  const statLeaders = useMemo<CategoryData[]>(() => {
    return (statLeadersRaw?.categories || []).slice(0, 3);
  }, [statLeadersRaw]);

  // Articles state
  interface Article {
    title: string;
    link: string;
    pubDate: string;
    description: string;
    featuredImage?: string;
    author?: string;
  }
  const [latestArticles, setLatestArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);

  // YouTube state
  interface YTVideo {
    videoId: string;
    title: string;
    url: string;
    thumbnail: string;
    published: string;
  }
  const [ytVideos, setYtVideos] = useState<YTVideo[]>([]);
  const [ytLoading, setYtLoading] = useState(true);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  useEffect(() => {
    const controller = new AbortController();
    fetch(getApiPath(`api/proxy-rss?url=${encodeURIComponent('https://www.profootballnetwork.com/feed/cfb-feed/')}`), { signal: controller.signal })
      .then(res => res.json())
      .then(data => { setLatestArticles((data.articles || []).slice(0, 5)); })
      .catch(() => {})
      .finally(() => setArticlesLoading(false));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(getApiPath('api/youtube-feed'), { signal: controller.signal })
      .then(res => res.json())
      .then(data => { setYtVideos(data.videos || []); })
      .catch(() => {})
      .finally(() => setYtLoading(false));
    return () => controller.abort();
  }, []);

  // Pill nav state
  const [activeSection, setActiveSection] = useState<string>(SECTIONS[0].id);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const pillNavRef = useRef<HTMLDivElement>(null);
  const activePillRef = useRef<HTMLButtonElement>(null);

  // Scroll indicators
  const updateScrollIndicators = useCallback(() => {
    const nav = pillNavRef.current;
    if (!nav) return;
    setCanScrollLeft(nav.scrollLeft > 2);
    setCanScrollRight(nav.scrollLeft < nav.scrollWidth - nav.clientWidth - 2);
  }, []);

  // Auto-scroll active pill into view
  useEffect(() => {
    if (activePillRef.current && pillNavRef.current) {
      const pill = activePillRef.current;
      const nav = pillNavRef.current;
      requestAnimationFrame(() => {
        const pillRect = pill.getBoundingClientRect();
        const navRect = nav.getBoundingClientRect();
        const pillLeft = pillRect.left - navRect.left + nav.scrollLeft;
        const pillRight = pillLeft + pillRect.width;
        const navWidth = nav.clientWidth;
        if (pillLeft < nav.scrollLeft) {
          nav.scrollTo({ left: pillLeft - 20, behavior: 'auto' });
        } else if (pillRight > nav.scrollLeft + navWidth) {
          nav.scrollTo({ left: pillRight - navWidth + 20, behavior: 'auto' });
        }
      });
    }
  }, [activeSection]);

  // IntersectionObserver scroll-spy
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const visibleSections = new Map<string, number>();

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              visibleSections.set(id, entry.intersectionRatio);
            } else {
              visibleSections.delete(id);
            }
          });
          let bestId = '';
          let bestRatio = 0;
          visibleSections.forEach((ratio, sId) => {
            if (ratio > bestRatio) {
              bestRatio = ratio;
              bestId = sId;
            }
          });
          if (bestId) {
            setActiveSection(bestId);
          }
        },
        { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: '-120px 0px -40% 0px' }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // Track pill nav scroll indicators
  useEffect(() => {
    const nav = pillNavRef.current;
    if (!nav) return;
    updateScrollIndicators();
    nav.addEventListener('scroll', updateScrollIndicators, { passive: true });
    window.addEventListener('resize', updateScrollIndicators);
    return () => {
      nav.removeEventListener('scroll', updateScrollIndicators);
      window.removeEventListener('resize', updateScrollIndicators);
    };
  }, [updateScrollIndicators]);

  const handlePillClick = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Fetch transfer portal data
  useEffect(() => {
    const controller = new AbortController();
    async function fetchPortal() {
      try {
        const res = await fetch(getApiPath('api/transfer-portal'), { signal: controller.signal });
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        const players: TransferPlayer[] = data.players || [];
        const committed = players
          .filter((p) => p.status === 'Committed' && p.commitDate && p.newSchool && p.newSchool !== p.formerSchool)
          .sort((a, b) => new Date(b.commitDate!).getTime() - new Date(a.commitDate!).getTime())
          .slice(0, 18);
        setPortalPlayers(committed);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error('Error fetching portal:', err);
      } finally {
        if (!controller.signal.aborted) setPortalLoading(false);
      }
    }
    fetchPortal();
    return () => controller.abort();
  }, []);

  // Helper to render a stat leader card (sidebar style)
  const renderStatCard = (category: CategoryData) => (
    <div key={category.name} className="rounded-xl overflow-hidden border border-gray-200">
      <div className="bg-[#0050A0] px-5 py-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wide">{category.displayName}</h3>
      </div>
      <div className="bg-white rounded-b-xl">
        {category.leaders.slice(0, 5).map((leader, idx) => (
          <div key={leader.playerId} className={`flex items-center justify-between px-4 py-2.5 ${idx < category.leaders.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-gray-50 transition-colors`}>
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <span className="text-gray-400 font-semibold text-xs w-4">{idx + 1}</span>
              {leader.teamLogo && (
                <img
                  src={leader.teamLogo}
                  alt="Team"
                  className="w-5 h-5 object-contain flex-shrink-0"
                />
              )}
              <span className="font-medium text-gray-900 truncate text-sm">{leader.name}</span>
            </div>
            <span className="font-bold text-[#0050A0] text-sm ml-2">{leader.value}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // Format commit date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`;
  };

  return (
    <>
      {/* Header */}
      <header
        className="text-white shadow-lg"
        style={{
          background: 'linear-gradient(180deg, #0050A0 0%, #003a75 100%)',
          boxShadow: 'inset 0 -30px 40px -30px rgba(0,0,0,0.15), 0 4px 6px -1px rgba(0,0,0,0.1)'
        }}
      >
        <div className="container mx-auto px-4 pt-6 sm:pt-7 md:pt-8 lg:pt-10 pb-3 sm:pb-4 md:pb-5 lg:pb-6">
          <h1 className="text-4xl lg:text-5xl font-extrabold mb-2">
            College Football HQ
          </h1>
          <p className="text-lg opacity-90 font-medium">
            Your destination for college football tools, stats, and data
          </p>
        </div>
      </header>
      <TransferPortalBanner />

      {/* Raptive Header Ad */}
      <RaptiveHeaderAd />

      {/* Sticky Pill Navigation — mobile only */}
      <div className="lg:hidden sticky top-[88px] z-[9] bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 relative">
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-12 pointer-events-none z-10" style={{ background: 'linear-gradient(to right, rgb(255,255,255) 0%, rgba(255,255,255,0) 100%)' }} />
          )}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-24 pointer-events-none z-10" style={{ background: 'linear-gradient(to left, rgb(255,255,255) 0%, rgb(255,255,255) 30%, rgba(255,255,255,0) 100%)' }} />
          )}
          <div
            ref={pillNavRef}
            className="flex gap-2 py-2.5 overflow-x-auto scrollbar-hide"
          >
            {SECTIONS.map(({ id, label }) => (
              <button
                key={id}
                ref={activeSection === id ? activePillRef : null}
                data-section={id}
                onClick={() => handlePillClick(id)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                  activeSection === id
                    ? 'bg-[#0050A0] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== MAIN 3-COLUMN GRID: Transfer Portal (2 cols) + Stat Leaders Sidebar (1 col) ===== */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT: Transfer Portal Tracker — spans 2 columns on desktop */}
          <div id="transfer-portal" className="lg:col-span-2" style={{ scrollMarginTop: '100px' }}>
            <div className="rounded-xl overflow-hidden border border-gray-200">
              {/* Blue card header */}
              <div className="bg-[#0050A0] px-5 py-4">
                <h2 className="text-xl sm:text-[22px] font-bold text-white">CFB Transfer Portal Tracker</h2>
                <p className="text-[13px] text-white/70 mt-0.5">Latest committed transfers in college football</p>
              </div>

              {/* Table */}
              <div className="bg-white rounded-b-xl">
                {portalLoading ? (
                  <div className="p-4">
                    <div className="animate-pulse space-y-3">
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className="h-10 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </div>
                ) : portalPlayers.length > 0 ? (
                  <div className="table-scroll-container overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="py-2 px-2 sm:px-3 text-left text-sm font-semibold text-gray-600">Player</th>
                          <th className="py-2 px-1.5 sm:px-3 text-center text-sm font-semibold text-gray-600">Pos</th>
                          <th className="py-2 px-2 sm:px-3 text-center text-sm font-semibold text-gray-600">Previous School</th>
                          <th className="py-2 px-2 sm:px-3 text-center text-sm font-semibold text-gray-600">New School</th>
                          <th className="py-2 px-2 sm:px-3 text-center text-sm font-semibold text-gray-600 hidden sm:table-cell">Impact Grade</th>
                          <th className="py-2 px-2 sm:px-3 text-center text-sm font-semibold text-gray-600 hidden sm:table-cell">Commit Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {portalPlayers.map((player, index) => {
                          const formerLogo = getTeamLogo(player.formerSchool);
                          const newLogo = player.newSchool ? getTeamLogo(player.newSchool) : '';

                          return (
                            <tr key={player.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50 transition-colors group`}>
                              <td className="px-2 sm:px-3 py-2 text-sm font-semibold text-gray-900 group-hover:text-[#0050A0] transition-colors">
                                <Link href="/transfer-portal-tracker" className="truncate block">
                                  {player.name}
                                </Link>
                              </td>
                              <td className="px-1.5 sm:px-3 py-2 whitespace-nowrap text-sm text-center text-gray-900">
                                {player.position}
                              </td>
                              <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-sm text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  {formerLogo && (
                                    <img src={formerLogo} alt="" className="w-5 h-5 object-contain" />
                                  )}
                                  <span className="text-gray-700 hidden md:inline">{player.formerSchool}</span>
                                </div>
                              </td>
                              <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-sm text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  {newLogo && (
                                    <img src={newLogo} alt="" className="w-5 h-5 object-contain" />
                                  )}
                                  <span className="text-gray-900 font-medium hidden md:inline">{player.newSchool}</span>
                                </div>
                              </td>
                              <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-sm text-center hidden sm:table-cell">
                                {player.rating ? (
                                  <span className="font-bold text-[#0050A0]">{player.rating.toFixed(1)}</span>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-sm text-center text-gray-600 hidden sm:table-cell">
                                {formatDate(player.commitDate)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Transfer portal data unavailable</p>
                  </div>
                )}

                {/* CTA footer */}
                <Link
                  href="/transfer-portal-tracker"
                  className="group flex items-center justify-center gap-2 bg-[#0050A0] px-6 py-3.5 text-white font-bold text-sm hover:bg-[#003a75] transition-colors rounded-b-xl"
                >
                  View Full Portal
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT: Stat Leaders Sidebar — 1 column on desktop */}
          <div id="stat-leaders" className="lg:col-start-3 lg:row-start-1 space-y-4" style={{ scrollMarginTop: '100px' }}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-gray-900">CFB Stat Leaders</h2>
              <Link href="/stat-leaders" className="text-[#0050A0] hover:text-[#003a75] font-semibold text-sm transition-colors">
                View All →
              </Link>
            </div>

            {statLeadersLoading ? (
              <div className="space-y-4">
                {['Passing', 'Rushing', 'Receiving'].map((stat) => (
                  <div key={stat} className="rounded-xl overflow-hidden border border-gray-200">
                    <div className="bg-[#0050A0] px-5 py-3">
                      <div className="h-4 bg-white/20 rounded w-24"></div>
                    </div>
                    <div className="bg-white p-3 animate-pulse space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-8 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : statLeaders.length > 0 ? (
              <div className="space-y-4">
                {statLeaders.map((category) => renderStatCard(category))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Stat leaders data unavailable</p>
                <Link href="/stat-leaders" className="text-[#0050A0] hover:underline text-sm mt-2 inline-block">
                  View stat leaders page →
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ===== FULL-WIDTH: Tools & Features ===== */}
      <section id="tools" className="py-8 sm:py-10 lg:py-12" style={{ scrollMarginTop: '100px' }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl overflow-hidden border border-gray-200">
            <div className="bg-[#0050A0] px-5 py-4">
              <h2 className="text-xl sm:text-[22px] font-bold text-white">Tools & Resources</h2>
              <p className="text-[13px] text-white/70 mt-0.5">Explore college football data with our interactive tools</p>
            </div>

            <div className="bg-white rounded-b-xl p-4 sm:p-6">
              {/* Hero Tier — 2 large cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                {/* Recruiting Hub */}
                <Link
                  href="/recruiting"
                  className="group relative bg-white rounded-xl p-6 sm:p-8 border-l-4 border-l-[#0050A0] border border-gray-200 hover:border-[#0050A0] hover:shadow-xl hover:bg-blue-50 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col h-full"
                >
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-[#0050A0] transition-colors mb-2">
                    Recruiting Hub
                  </h3>
                  <p className="text-gray-600 text-sm mb-5">
                    Top CFB recruiting rankings for players and team classes
                  </p>
                  <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-lg p-6 text-center flex-grow flex flex-col justify-center min-h-[80px]">
                    <p className="text-lg font-semibold text-gray-700">Composite Rankings & Team Classes</p>
                  </div>
                  <div className="mt-5 flex items-center text-[#0050A0]">
                    <span className="text-sm font-medium group-hover:underline">Explore Recruiting</span>
                    <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>

                {/* Postseason */}
                <Link
                  href="/postseason"
                  className="group relative bg-white rounded-xl p-6 sm:p-8 border-l-4 border-l-[#0050A0] border border-gray-200 hover:border-[#0050A0] hover:shadow-xl hover:bg-blue-50 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col h-full"
                >
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-[#0050A0] transition-colors mb-2">
                    CFB Playoff & Postseason
                  </h3>
                  <p className="text-gray-600 text-sm mb-5">
                    College Football Playoff bracket, bowl games, and champions
                  </p>
                  <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-lg p-6 text-center flex-grow flex flex-col justify-center min-h-[80px]">
                    <p className="text-lg font-semibold text-gray-700">Bracket & Bowl Games</p>
                  </div>
                  <div className="mt-5 flex items-center text-[#0050A0]">
                    <span className="text-sm font-medium group-hover:underline">View Postseason</span>
                    <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              </div>

              {/* Standard Tier — compact cards, horizontal scroll on mobile */}
              <div className="flex overflow-x-auto scrollbar-hide gap-3 -mx-4 px-4 snap-x snap-mandatory pb-2 md:grid md:grid-cols-4 md:gap-4 md:mx-0 md:px-0 md:overflow-visible md:pb-0 md:snap-none">

                <Link
                  href="/standings"
                  className="min-w-[160px] w-[45vw] flex-shrink-0 snap-start md:min-w-0 md:w-auto md:flex-shrink group relative bg-white rounded-xl p-4 border border-gray-200 hover:border-[#0050A0] hover:shadow-xl hover:bg-blue-50 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col"
                >
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-[#0050A0] transition-colors mb-1">
                    CFB Standings
                  </h3>
                  <p className="text-gray-500 text-xs mb-3 line-clamp-2">
                    Conference standings for FBS and FCS teams
                  </p>
                  <div className="mt-auto flex items-center text-[#0050A0]">
                    <span className="text-xs font-medium group-hover:underline">View Standings</span>
                    <svg className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>

                <Link
                  href="/schedule"
                  className="min-w-[160px] w-[45vw] flex-shrink-0 snap-start md:min-w-0 md:w-auto md:flex-shrink group relative bg-white rounded-xl p-4 border border-gray-200 hover:border-[#0050A0] hover:shadow-xl hover:bg-blue-50 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col"
                >
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-[#0050A0] transition-colors mb-1">
                    CFB Schedule
                  </h3>
                  <p className="text-gray-500 text-xs mb-3 line-clamp-2">
                    Full college football schedule with live scores
                  </p>
                  <div className="mt-auto flex items-center text-[#0050A0]">
                    <span className="text-xs font-medium group-hover:underline">View Schedule</span>
                    <svg className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>

                <Link
                  href="/power-rankings-builder"
                  className="min-w-[160px] w-[45vw] flex-shrink-0 snap-start md:min-w-0 md:w-auto md:flex-shrink group relative bg-white rounded-xl p-4 border border-gray-200 hover:border-[#0050A0] hover:shadow-xl hover:bg-blue-50 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col"
                >
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-[#0050A0] transition-colors mb-1">
                    Power Rankings
                  </h3>
                  <p className="text-gray-500 text-xs mb-3 line-clamp-2">
                    Create and share your own CFB power rankings
                  </p>
                  <div className="mt-auto flex items-center text-[#0050A0]">
                    <span className="text-xs font-medium group-hover:underline">Start Building</span>
                    <svg className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>

                <Link
                  href="/draft-history"
                  className="min-w-[160px] w-[45vw] flex-shrink-0 snap-start md:min-w-0 md:w-auto md:flex-shrink group relative bg-white rounded-xl p-4 border border-gray-200 hover:border-[#0050A0] hover:shadow-xl hover:bg-blue-50 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col"
                >
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-[#0050A0] transition-colors mb-1">
                    CFB Draft History
                  </h3>
                  <p className="text-gray-500 text-xs mb-3 line-clamp-2">
                    NFL Draft picks by college program since 1967
                  </p>
                  <div className="mt-auto flex items-center text-[#0050A0]">
                    <span className="text-xs font-medium group-hover:underline">View History</span>
                    <svg className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest CFB Articles & YouTube Section */}
      <section id="articles" className="pt-2 pb-8 sm:pb-10 lg:pb-12" style={{ scrollMarginTop: '100px' }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

          {/* ── Row 1: Articles ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">Latest CFB Articles from PFSN</span>
                <div className="flex-1 h-px bg-gray-200 min-w-[20px]" />
              </div>
              <Link
                href="/articles"
                className="ml-4 flex-shrink-0 text-xs font-bold uppercase tracking-widest text-[#0050A0] hover:text-[#003a75] transition-colors"
              >
                View More →
              </Link>
            </div>

            {articlesLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="w-full aspect-video bg-gray-200 rounded-lg mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : latestArticles.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {latestArticles.map((article, index) => (
                  <a
                    key={`${article.link}-${index}`}
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group cursor-pointer"
                  >
                    <div className="w-full aspect-video overflow-hidden rounded-lg bg-gray-200 mb-3">
                      {article.featuredImage ? (
                        <img
                          src={article.featuredImage}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#0050A0] to-[#003a75] flex items-center justify-center">
                          <span className="text-white text-2xl font-bold opacity-30">PFSN</span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#0050A0] line-clamp-2 transition-colors leading-snug mb-1">
                      {article.title}
                    </h3>
                    <p className="text-xs text-gray-400">{getRelativeTime(article.pubDate)}</p>
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          {/* ── Row 2: YouTube / FDC365 ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">Latest from Football Debate Club</span>
                <div className="flex-1 h-px bg-gray-200 min-w-[20px]" />
              </div>
              <a
                href="https://www.youtube.com/@FDC365?sub_confirmation=1"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-4 flex-shrink-0 flex items-center gap-1.5 bg-[#0050A0] hover:bg-[#003a75] text-white text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                Subscribe
              </a>
            </div>

            {ytLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="w-full aspect-video bg-gray-200 rounded-lg mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : ytVideos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {ytVideos.map((video) => (
                  <div key={video.videoId} className="group cursor-pointer">
                    <div className="w-full aspect-video overflow-hidden rounded-lg bg-gray-900 mb-3 relative">
                      {activeVideoId === video.videoId ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1`}
                          title={video.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        />
                      ) : (
                        <>
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div
                            className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors duration-200"
                            onClick={() => setActiveVideoId(video.videoId)}
                          >
                            <div className="bg-[#0050A0] rounded-full w-14 h-14 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-200">
                              <svg className="w-6 h-6 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <h3
                      className="text-sm font-bold text-gray-900 group-hover:text-[#0050A0] line-clamp-2 transition-colors leading-snug mb-1 cursor-pointer"
                      onClick={() => setActiveVideoId(video.videoId)}
                    >
                      {video.title}
                    </h3>
                    <p className="text-xs text-gray-400">{getRelativeTime(video.published)}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

        </div>
      </section>

      <Footer currentPage="CFB" />
    </>
  );
}
