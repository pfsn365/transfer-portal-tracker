'use client';

import Link from 'next/link';
import Image from 'next/image';
import CFBPlayoffBracket from '@/components/CFBPlayoffBracket';
import Footer from '@/components/Footer';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getApiPath } from '@/utils/api';

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
  { id: 'playoff', label: 'Playoff' },
  { id: 'stat-leaders', label: 'Stat Leaders' },
  { id: 'tools', label: 'Tools' },
  { id: 'teams', label: 'Teams' },
] as const;

export default function CFBHomePageContent() {
  const [statLeaders, setStatLeaders] = useState<CategoryData[]>([]);
  const [statLeadersLoading, setStatLeadersLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>(SECTIONS[0].id);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const pillNavRef = useRef<HTMLDivElement>(null);

  // Update scroll indicators for pill nav
  const updateScrollIndicators = useCallback(() => {
    const nav = pillNavRef.current;
    if (!nav) return;
    setCanScrollLeft(nav.scrollLeft > 2);
    setCanScrollRight(nav.scrollLeft < nav.scrollWidth - nav.clientWidth - 2);
  }, []);

  // Scroll active pill into view
  const scrollActivePillIntoView = useCallback((sectionId: string) => {
    const nav = pillNavRef.current;
    if (!nav) return;
    const pill = nav.querySelector(`[data-section="${sectionId}"]`) as HTMLElement | null;
    if (!pill) return;
    const navRect = nav.getBoundingClientRect();
    const pillRect = pill.getBoundingClientRect();
    if (pillRect.left < navRect.left) {
      nav.scrollBy({ left: pillRect.left - navRect.left - 16, behavior: 'smooth' });
    } else if (pillRect.right > navRect.right) {
      nav.scrollBy({ left: pillRect.right - navRect.right + 16, behavior: 'smooth' });
    }
  }, []);

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
          // Pick the section with the highest intersection ratio
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
            scrollActivePillIntoView(bestId);
          }
        },
        { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: '-120px 0px -40% 0px' }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [scrollActivePillIntoView]);

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

  // Fetch all data on mount
  useEffect(() => {
    const abortController = new AbortController();

    async function fetchStatLeaders() {
      try {
        const response = await fetch(getApiPath('api/cfb/stat-leaders'), {
          signal: abortController.signal,
        });
        if (abortController.signal.aborted) return;
        if (response.ok) {
          const data = await response.json();
          // Get 4 main categories
          const categories = (data.categories || []).slice(0, 4);
          setStatLeaders(categories);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('Error fetching stat leaders:', err);
      } finally {
        if (!abortController.signal.aborted) {
          setStatLeadersLoading(false);
        }
      }
    }

    fetchStatLeaders();

    return () => {
      abortController.abort();
    };
  }, []);

  return (
    <>
      {/* Header */}
      <header
        className="text-white shadow-lg"
          style={{
            background: 'linear-gradient(180deg, #800000 0%, #600000 100%)',
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

        {/* Raptive Header Ad */}
        <div className="container mx-auto px-4 min-h-[110px]">
          <div className="raptive-pfn-header-90"></div>
        </div>

        {/* Sticky Pill Navigation */}
        <div className="lg:hidden sticky top-[88px] z-[9] bg-white border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-4 relative">
            {/* Left fade */}
            {canScrollLeft && (
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            )}
            {/* Right fade */}
            {canScrollRight && (
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
            )}
            <div
              ref={pillNavRef}
              className="flex gap-2 py-2.5 overflow-x-auto scrollbar-hide"
            >
              {SECTIONS.map(({ id, label }) => (
                <button
                  key={id}
                  data-section={id}
                  onClick={() => handlePillClick(id)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                    activeSection === id
                      ? 'bg-[#800000] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CFB Playoff Bracket */}
        <div id="playoff" className="container mx-auto px-4 sm:px-6 lg:px-8 mb-8 scroll-mt-[140px] lg:scroll-mt-[92px]">
          <CFBPlayoffBracket />
        </div>

        {/* Stat Leaders Section */}
        <div id="stat-leaders" className="container mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-[140px] lg:scroll-mt-[92px]">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Stat Leaders</h2>
              <Link
                href="/stat-leaders"
                className="text-[#800000] hover:text-[#600000] font-semibold text-sm transition-colors"
              >
                View All Stats →
              </Link>
            </div>

            {statLeadersLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                    <div className="space-y-2">
                      {[1, 2, 3].map((j) => (
                        <div key={j} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-4 h-4 bg-gray-200 rounded"></div>
                            <div className="h-3 bg-gray-200 rounded flex-1"></div>
                          </div>
                          <div className="h-3 bg-gray-200 rounded w-8"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : statLeaders.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {statLeaders.slice(0, 4).map((category) => (
                  <div key={category.name} className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-xs font-bold text-gray-600 uppercase mb-3">{category.displayName}</h3>
                    <div className="space-y-2">
                      {category.leaders.slice(0, 3).map((leader, idx) => (
                        <div key={leader.playerId} className="flex items-center justify-between text-base">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-gray-600 font-semibold w-4">{idx + 1}</span>
                            {leader.teamLogo && (
                              <div className="w-4 h-4 relative flex-shrink-0">
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
                          <span className="font-bold text-[#800000] ml-2">{leader.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Stat leaders data unavailable</p>
                <Link href="/stat-leaders" className="text-[#800000] hover:underline text-sm mt-2 inline-block">
                  View stat leaders page →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Tools & Features Grid */}
        <div id="tools" className="container mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-[140px] lg:scroll-mt-[92px]">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Tools & Resources
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Transfer Portal Tracker */}
              <Link
                href="/transfer-portal-tracker"
                className="group relative bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-[#800000] hover:bg-white transition-all duration-300 hover:shadow-lg flex flex-col h-full"
              >
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#800000] transition-colors">
                    Transfer Portal Tracker
                  </h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Track every player in the college football transfer portal
                </p>
                <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-lg p-4 text-center flex-grow flex flex-col justify-center">
                  <p className="text-sm font-semibold text-gray-700">Real-time Portal Updates</p>
                  <p className="text-xs text-gray-600 mt-1">Filter by position & school</p>
                </div>
                <div className="mt-4 flex items-center text-[#800000] opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-sm font-medium">View Tracker</span>
                  <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>

              {/* CFB Standings */}
              <Link
                href="/standings"
                className="group relative bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-[#800000] hover:bg-white transition-all duration-300 hover:shadow-lg flex flex-col h-full"
              >
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#800000] transition-colors">
                    CFB Standings
                  </h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Conference standings for FBS and FCS teams
                </p>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 text-center flex-grow flex flex-col justify-center">
                  <p className="text-sm font-semibold text-gray-700">Conference Rankings</p>
                  <p className="text-xs text-gray-600 mt-1">FBS & FCS standings</p>
                </div>
                <div className="mt-4 flex items-center text-[#800000] opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-sm font-medium">View Standings</span>
                  <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>

              {/* CFB Schedule */}
              <Link
                href="/schedule"
                className="group relative bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-[#800000] hover:bg-white transition-all duration-300 hover:shadow-lg flex flex-col h-full"
              >
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#800000] transition-colors">
                    CFB Schedule
                  </h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Full college football schedule with live scores
                </p>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 text-center flex-grow flex flex-col justify-center">
                  <p className="text-sm font-semibold text-gray-700">Week-by-Week Games</p>
                  <p className="text-xs text-gray-600 mt-1">Live scores & broadcasts</p>
                </div>
                <div className="mt-4 flex items-center text-[#800000] opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-sm font-medium">View Schedule</span>
                  <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>

              {/* CFB Rankings */}
              <Link
                href="/rankings"
                className="group relative bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-[#800000] hover:bg-white transition-all duration-300 hover:shadow-lg flex flex-col h-full"
              >
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#800000] transition-colors">
                    CFB Rankings
                  </h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  AP, Coaches, and CFP rankings
                </p>
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-4 text-center flex-grow flex flex-col justify-center">
                  <p className="text-sm font-semibold text-gray-700">Top 25 Polls</p>
                  <p className="text-xs text-gray-600 mt-1">Weekly updated rankings</p>
                </div>
                <div className="mt-4 flex items-center text-[#800000] opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-sm font-medium">View Rankings</span>
                  <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>

              {/* Power Rankings Builder */}
              <Link
                href="/power-rankings-builder"
                className="group relative bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-[#800000] hover:bg-white transition-all duration-300 hover:shadow-lg flex flex-col h-full"
              >
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#800000] transition-colors">
                    Power Rankings Builder
                  </h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Create and share your own CFB power rankings
                </p>
                <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-lg p-4 text-center flex-grow flex flex-col justify-center">
                  <p className="text-sm font-semibold text-gray-700">Drag & Drop Rankings</p>
                  <p className="text-xs text-gray-600 mt-1">Download & share your list</p>
                </div>
                <div className="mt-4 flex items-center text-[#800000] opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-sm font-medium">Start Building</span>
                  <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>

              {/* CFB Player Pages */}
              <Link
                href="/players"
                className="group relative bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-[#800000] hover:bg-white transition-all duration-300 hover:shadow-lg flex flex-col h-full"
              >
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#800000] transition-colors">
                    CFB Player Pages
                  </h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Browse player profiles and stats
                </p>
                <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-lg p-4 text-center flex-grow flex flex-col justify-center">
                  <p className="text-sm font-semibold text-gray-700">Player Directory</p>
                  <p className="text-xs text-gray-600 mt-1">Search by name or position</p>
                </div>
                <div className="mt-4 flex items-center text-[#800000] opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-sm font-medium">Browse Players</span>
                  <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </div>
          </div>

          {/* Featured Teams Section */}
          <div id="teams" className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8 scroll-mt-[140px] lg:scroll-mt-[92px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Featured Teams
              </h2>
              <Link
                href="/teams"
                className="hidden md:flex items-center gap-2 text-[#800000] hover:text-[#600000] font-semibold text-sm transition-colors"
              >
                View All Teams →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {FEATURED_TEAMS.map((team) => (
                <Link
                  key={team.id}
                  href={`/teams/${team.id}`}
                  className="group relative bg-gray-50 rounded-xl p-3 border border-gray-200 hover:border-[#800000] hover:bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col items-center justify-center aspect-square"
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
                    <div className="text-xs font-bold text-gray-900 group-hover:text-[#800000] transition-colors">
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
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#800000] hover:bg-[#600000] active:scale-[0.98] text-white font-medium rounded-lg transition-all cursor-pointer min-h-[44px]"
              >
                View All Teams
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

        </div>

      <Footer currentPage="CFB" />
    </>
  );
}
