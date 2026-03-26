'use client';

import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/Footer';
import RaptiveHeaderAd from '@/components/RaptiveHeaderAd';
import TransferPortalBanner from '@/components/TransferPortalBanner';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { getApiPath } from '@/utils/api';
import { fetcher, swrConfig } from '@/utils/swr';
import { getTeamLogo } from '@/utils/teamLogos';
import type { TransferPlayer } from '@/types/player';

// Featured FBS teams (popular/successful programs)
const FEATURED_TEAMS = [
  { id: 'ohio-state-buckeyes', name: 'Ohio State', abbr: 'OSU', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/194.png' },
  { id: 'alabama-crimson-tide', name: 'Alabama', abbr: 'ALA', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/333.png' },
  { id: 'georgia-bulldogs', name: 'Georgia', abbr: 'UGA', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/61.png' },
  { id: 'texas-longhorns', name: 'Texas', abbr: 'TEX', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/251.png' },
  { id: 'michigan-wolverines', name: 'Michigan', abbr: 'MICH', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/130.png' },
  { id: 'usc-trojans', name: 'USC', abbr: 'USC', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/30.png' },
  { id: 'notre-dame-fighting-irish', name: 'Notre Dame', abbr: 'ND', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/87.png' },
  { id: 'oregon-ducks', name: 'Oregon', abbr: 'ORE', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2483.png' },
];

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
  { id: 'teams', label: 'Teams' },
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
                <div className="w-5 h-5 relative flex-shrink-0">
                  <Image
                    src={leader.teamLogo}
                    alt="Team"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
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
                {/* Power Rankings Builder */}
                <Link
                  href="/power-rankings-builder"
                  className="group relative bg-white rounded-xl p-6 sm:p-8 border-l-4 border-l-[#0050A0] border border-gray-200 hover:border-[#0050A0] hover:shadow-xl hover:bg-blue-50 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col h-full"
                >
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-[#0050A0] transition-colors mb-2">
                    Power Rankings Builder
                  </h3>
                  <p className="text-gray-600 text-sm mb-5">
                    Create and share your own CFB power rankings
                  </p>
                  <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-lg p-6 text-center flex-grow flex flex-col justify-center min-h-[80px]">
                    <p className="text-lg font-semibold text-gray-700">Drag & Drop Rankings</p>
                  </div>
                  <div className="mt-5 flex items-center text-[#0050A0]">
                    <span className="text-sm font-medium group-hover:underline">Start Building</span>
                    <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>

                {/* Postseason / Playoff */}
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

              {/* Standard Tier — 4 compact cards, horizontal scroll on mobile */}
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
                  href="/rankings"
                  className="min-w-[160px] w-[45vw] flex-shrink-0 snap-start md:min-w-0 md:w-auto md:flex-shrink group relative bg-white rounded-xl p-4 border border-gray-200 hover:border-[#0050A0] hover:shadow-xl hover:bg-blue-50 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col"
                >
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-[#0050A0] transition-colors mb-1">
                    CFB Rankings
                  </h3>
                  <p className="text-gray-500 text-xs mb-3 line-clamp-2">
                    AP, Coaches, and CFP rankings
                  </p>
                  <div className="mt-auto flex items-center text-[#0050A0]">
                    <span className="text-xs font-medium group-hover:underline">View Rankings</span>
                    <svg className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>

                <Link
                  href="/players"
                  className="min-w-[160px] w-[45vw] flex-shrink-0 snap-start md:min-w-0 md:w-auto md:flex-shrink group relative bg-white rounded-xl p-4 border border-gray-200 hover:border-[#0050A0] hover:shadow-xl hover:bg-blue-50 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col"
                >
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-[#0050A0] transition-colors mb-1">
                    CFB Player Pages
                  </h3>
                  <p className="text-gray-500 text-xs mb-3 line-clamp-2">
                    Browse player profiles, stats & career info
                  </p>
                  <div className="mt-auto flex items-center text-[#0050A0]">
                    <span className="text-xs font-medium group-hover:underline">Browse Players</span>
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

      {/* Featured Teams Section */}
      <div id="teams" className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8" style={{ scrollMarginTop: '100px' }}>
        <div className="rounded-xl overflow-hidden border border-gray-200">
          <div className="bg-[#0050A0] px-5 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-[22px] font-bold text-white">Featured Teams</h2>
              <Link href="/teams" className="hidden md:flex items-center gap-1 text-white/80 hover:text-white font-semibold text-sm transition-colors">
                View All Teams →
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-b-xl p-4 sm:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {FEATURED_TEAMS.map((team) => (
                <Link
                  key={team.id}
                  href={`/teams/${team.id}`}
                  className="group relative bg-gray-50 rounded-xl p-3 border border-gray-200 hover:border-[#0050A0] hover:bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col items-center justify-center aspect-square"
                >
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 mb-1">
                    <Image
                      src={team.logo}
                      alt={team.name}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-bold text-gray-900 group-hover:text-[#0050A0] transition-colors">
                      {team.abbr}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* View all teams button for mobile */}
            <div className="mt-6 md:hidden text-center">
              <Link
                href="/teams"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#0050A0] hover:bg-[#003a75] active:scale-[0.98] text-white font-medium rounded-lg transition-all cursor-pointer min-h-[44px]"
              >
                View All Teams
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer currentPage="CFB" />
    </>
  );
}
