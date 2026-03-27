'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import RaptiveHeaderAd from '@/components/RaptiveHeaderAd';
import TransferPortalBanner from '@/components/TransferPortalBanner';
import Pagination from '@/components/Pagination';
import { getApiPath } from '@/utils/api';
import { getTeamLogo } from '@/utils/teamLogos';
import { allTeams } from '@/data/teams';

interface Recruit {
  id: number;
  name: string;
  position: string;
  city: string;
  state: string;
  height: string;
  weight: number;
  highSchool: string;
  classYear: number;
  stars: number;
  rating: number;
  rating247Raw?: number;
  nationalRank: number;
  positionRank: number;
  stateRank: number;
  imageUrl: string;
  committedSchoolLogo?: string;
  status: string;
  commitStatus: string;
  committedTo?: string;
  source: string;
}

const SOURCES = [
  { id: 'composite', label: 'Composite' },
  { id: '247', label: '247Sports' },
  { id: 'espn', label: 'ESPN' },
  { id: 'on3', label: 'On3' },
] as const;

const STAR_OPTIONS = [
  { value: '5', label: '5★' },
  { value: '4', label: '4★' },
  { value: '3', label: '3★' },
];

// Multi-select dropdown with checkboxes
function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const displayText = selected.length === 0
    ? label
    : selected.length <= 2
      ? selected.map(v => options.find(o => o.value === v)?.label || v).join(', ')
      : `${selected.length} selected`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full px-3 py-2 border rounded-lg text-sm text-left flex items-center justify-between cursor-pointer transition-colors ${
          selected.length > 0
            ? 'border-[#0050A0] text-[#0050A0] bg-blue-50/50'
            : 'border-gray-300 text-gray-700'
        } focus:outline-none focus:ring-2 focus:ring-[#0050A0]`}
      >
        <span className="truncate">{displayText}</span>
        <svg className={`w-4 h-4 ml-1 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.map(opt => (
            <label
              key={opt.value}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => toggle(opt.value)}
                className="w-4 h-4 rounded border-gray-300 text-[#0050A0] focus:ring-[#0050A0] cursor-pointer"
              />
              <span>{opt.label}</span>
            </label>
          ))}
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="w-full px-3 py-2 text-xs text-gray-500 hover:text-gray-700 border-t border-gray-100 text-center cursor-pointer"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function StarRating({ stars }: { stars: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${i <= stars ? 'text-yellow-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

function RecruitAvatar({ recruit }: { recruit: Recruit }) {
  const [error, setError] = useState(false);
  const initials = recruit.name.split(' ').map(n => n[0]).join('').slice(0, 2);

  if (!recruit.imageUrl || error) {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-semibold text-gray-500">{initials}</span>
      </div>
    );
  }

  return (
    <img
      src={recruit.imageUrl}
      alt={recruit.name}
      className="w-10 h-10 rounded-full object-cover bg-gray-100 flex-shrink-0"
      onError={() => setError(true)}
    />
  );
}

interface TeamRanking {
  rank: number;
  school: string;
  totalCommits: number;
  avgStars: number;
  fiveStars: number;
  fourStars: number;
  threeStars: number;
  twoStars: number;
  oneStars: number;
  zeroStars: number;
  compositePoints: number;
  topRecruit: string;
}

interface PipelineEntryType {
  rank: number;
  school: string;
  totalRecruits: number;
  totalScore: number;
  fiveStars: number;
  fourStars: number;
  threeStars: number;
  avgStars: number;
  avgClassScore: number;
  bestYear: number;
  bestYearScore: number;
  classByYear: Record<number, { recruits: number; score: number; fiveStars: number; avgStars: number }>;
}

function StatusCell({ recruit, getTeamSlug }: { recruit: Recruit; getTeamSlug: (name: string) => string | null }) {
  const isCommitted = recruit.commitStatus === 'committed' || recruit.status === 'Enrolled' || recruit.status === 'Signed' || recruit.status === 'HardCommit';

  if (!isCommitted) {
    return <span className="text-xs font-semibold text-red-600">Uncommitted</span>;
  }

  const slug = getTeamSlug(recruit.committedTo || '');
  const statusText = recruit.status === 'Enrolled' ? 'Enrolled' : recruit.status === 'Signed' ? 'Signed' : 'Committed';
  const statusColor = recruit.status === 'Enrolled' || recruit.status === 'Signed' ? 'text-green-600' : 'text-blue-600';

  const logo = recruit.committedSchoolLogo
    ? <img src={recruit.committedSchoolLogo} alt="" className="w-5 h-5 object-contain" />
    : recruit.committedTo
      ? <img src={getTeamLogo(recruit.committedTo)} alt="" className="w-5 h-5 object-contain" />
      : null;

  const content = (
    <div className="flex flex-col items-center gap-1">
      {logo}
      <span className={`text-xs font-semibold ${statusColor}`}>{statusText}</span>
    </div>
  );

  if (slug) {
    return (
      <Link href={`/teams/${slug}/recruiting`} className="hover:opacity-80 transition-opacity cursor-pointer">
        {content}
      </Link>
    );
  }

  return content;
}

export default function RecruitingClient() {
  const [recruits, setRecruits] = useState<Recruit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  // View toggle
  const [activeView, setActiveView] = useState<'players' | 'team-rankings' | 'pipeline'>('players');

  // Team rankings state
  const [teamRankings, setTeamRankings] = useState<TeamRanking[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamSortKey, setTeamSortKey] = useState<string>('compositePoints');
  const [teamConferenceFilter, setTeamConferenceFilter] = useState('');

  // Pipeline state
  const [pipelineData, setPipelineData] = useState<PipelineEntryType[]>([]);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [pipelineYearMin, setPipelineYearMin] = useState('2020');
  const [pipelineYearMax, setPipelineYearMax] = useState('2026');
  const [pipelinePosition, setPipelinePosition] = useState('');
  const [pipelineConference, setPipelineConference] = useState('');
  const [pipelineSortKey, setPipelineSortKey] = useState<string>('totalScore');
  const [expandedPipelineSchool, setExpandedPipelineSchool] = useState<string | null>(null);
  const [pipelinePositions, setPipelinePositions] = useState<string[]>([]);

  // School name to conference lookup
  const schoolConference = useMemo(() => {
    const map: Record<string, string> = {};
    allTeams.forEach(t => {
      // Map by team ID and name without mascot
      map[t.id.toLowerCase()] = t.conference;
      const nameBase = t.name.split(' ').slice(0, -1).join(' ').toLowerCase();
      if (nameBase) map[nameBase] = t.conference;
    });
    return map;
  }, []);

  const getSchoolConference = useCallback((school: string): string => {
    const lower = school.toLowerCase();
    if (schoolConference[lower]) return schoolConference[lower];
    // Try partial match
    for (const [key, conf] of Object.entries(schoolConference)) {
      if (lower.startsWith(key) || key.startsWith(lower)) return conf;
    }
    return '';
  }, [schoolConference]);

  const sortedTeamRankings = useMemo(() => {
    let filtered = [...teamRankings];
    if (teamConferenceFilter) {
      filtered = filtered.filter(t => getSchoolConference(t.school) === teamConferenceFilter);
    }
    const sorted = filtered.sort((a, b) => {
      const aVal = (a as unknown as Record<string, number>)[teamSortKey] || 0;
      const bVal = (b as unknown as Record<string, number>)[teamSortKey] || 0;
      return (bVal || 0) - (aVal || 0);
    });
    return sorted.map((t, i) => ({ ...t, rank: i + 1 }));
  }, [teamRankings, teamSortKey, teamConferenceFilter, getSchoolConference]);

  // Summary stats
  const [starDistribution, setStarDistribution] = useState<Record<number, number>>({});
  const [positionDistribution, setPositionDistribution] = useState<Record<string, number>>({});

  // Filters
  const [year, setYear] = useState('2026');
  const [source, setSource] = useState('composite');
  const [search, setSearch] = useState('');
  const [positions, setPositions] = useState<string[]>([]);
  const [starValues, setStarValues] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [committed, setCommitted] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Filter options from API
  const [availableYears, setAvailableYears] = useState<number[]>([2026, 2027, 2028]);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availablePositions, setAvailablePositions] = useState<string[]>([]);

  // Debounce all filter changes to prevent API spam on rapid clicks
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [debouncedPositions, setDebouncedPositions] = useState<string[]>([]);
  const [debouncedStars, setDebouncedStars] = useState<string[]>([]);
  const [debouncedStates, setDebouncedStates] = useState<string[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedPositions(positions), 150);
    return () => clearTimeout(timer);
  }, [positions]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedStars(starValues), 150);
    return () => clearTimeout(timer);
  }, [starValues]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedStates(states), 150);
    return () => clearTimeout(timer);
  }, [states]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [year, source, debouncedSearch, debouncedPositions, debouncedStars, debouncedStates, committed]);

  // Fetch recruits (only when player rankings view is active)
  useEffect(() => {
    if (activeView !== 'players') return;
    const controller = new AbortController();
    setLoading(true);
    setError('');

    const params = new URLSearchParams({
      year,
      source,
      page: String(currentPage),
      limit: String(itemsPerPage),
    });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (debouncedPositions.length) params.set('position', debouncedPositions.join(','));
    if (debouncedStars.length) params.set('stars', debouncedStars.join(','));
    if (debouncedStates.length) params.set('state', debouncedStates.join(','));
    if (committed) params.set('committed', committed);

    fetch(getApiPath(`api/cfb/recruits?${params}`), { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load recruits');
        return res.json();
      })
      .then(data => {
        setRecruits(data.recruits || []);
        setTotal(data.total || 0);
        if (data.availableYears?.length) setAvailableYears(data.availableYears);
        if (data.states?.length) setAvailableStates(data.states);
        if (data.positions?.length) setAvailablePositions(data.positions);
        if (data.starDistribution) setStarDistribution(data.starDistribution);
        if (data.positionDistribution) setPositionDistribution(data.positionDistribution);
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [activeView, year, source, currentPage, itemsPerPage, debouncedSearch, debouncedPositions, debouncedStars, debouncedStates, committed]);

  // Fetch team rankings
  useEffect(() => {
    if (activeView !== 'team-rankings') return;
    const controller = new AbortController();
    setTeamLoading(true);

    fetch(getApiPath(`api/cfb/recruits?year=${year}&source=composite&view=team-rankings`), { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        setTeamRankings(data.teamRankings || []);
        if (data.availableYears?.length) setAvailableYears(data.availableYears);
      })
      .catch(err => { if (err.name !== 'AbortError') console.error(err); })
      .finally(() => setTeamLoading(false));

    return () => controller.abort();
  }, [activeView, year]);

  // Fetch pipeline data
  useEffect(() => {
    if (activeView !== 'pipeline') return;
    const controller = new AbortController();
    setPipelineLoading(true);

    const params = new URLSearchParams({ view: 'pipeline', yearMin: pipelineYearMin, yearMax: pipelineYearMax });
    if (pipelinePosition) params.set('position', pipelinePosition);

    fetch(getApiPath(`api/cfb/recruits?${params}`), { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        setPipelineData(data.pipeline || []);
        if (data.availableYears?.length) setAvailableYears(data.availableYears);
        if (data.positions?.length) setPipelinePositions(data.positions);
      })
      .catch(err => { if (err.name !== 'AbortError') console.error(err); })
      .finally(() => setPipelineLoading(false));

    return () => controller.abort();
  }, [activeView, pipelineYearMin, pipelineYearMax, pipelinePosition]);

  // Sorted pipeline with conference filter
  const sortedPipeline = useMemo(() => {
    let filtered = [...pipelineData];
    if (pipelineConference) {
      filtered = filtered.filter(t => getSchoolConference(t.school) === pipelineConference);
    }
    filtered.sort((a, b) => {
      const aVal = (a as unknown as Record<string, number>)[pipelineSortKey] || 0;
      const bVal = (b as unknown as Record<string, number>)[pipelineSortKey] || 0;
      return bVal - aVal;
    });
    return filtered.map((t, i) => ({ ...t, rank: i + 1 }));
  }, [pipelineData, pipelineSortKey, pipelineConference, getSchoolConference]);

  // Lookup team slug from school name for linking
  const getTeamSlug = useCallback((schoolName: string): string | null => {
    if (!schoolName) return null;
    const lower = schoolName.toLowerCase();
    const team = allTeams.find(t =>
      t.id.toLowerCase() === lower ||
      t.name.toLowerCase().startsWith(lower) ||
      lower.startsWith(t.name.split(' ').slice(0, -1).join(' ').toLowerCase())
    );
    return team?.slug || null;
  }, []);

  const posOrder = ['ATH','QB','RB','WR','TE','OT','OG','OC','OL','DT','EDGE','LB','CB','SAF','K','P'];
  const sortedPositions = posOrder.filter(p => (positionDistribution[p] || 0) > 0);

  return (
    <>
      {/* Hero Header */}
      <header
        className="text-white shadow-lg"
        style={{
          background: 'linear-gradient(180deg, #0050A0 0%, #003a75 100%)',
          boxShadow: 'inset 0 -30px 40px -30px rgba(0,0,0,0.15), 0 4px 6px -1px rgba(0,0,0,0.1)',
        }}
      >
        <div className="container mx-auto px-4 pt-6 sm:pt-7 md:pt-8 lg:pt-10 pb-3 sm:pb-4 md:pb-5 lg:pb-6">
          <h1 className="text-4xl lg:text-5xl font-extrabold mb-2">Recruiting Hub</h1>
          <p className="text-lg opacity-90 font-medium">
            CFB recruit rankings from 247Sports, ESPN, On3, and Rivals
          </p>
        </div>
      </header>
      <TransferPortalBanner />
      <RaptiveHeaderAd />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {/* View Toggle */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveView('players')}
            className={`px-5 py-2 rounded-lg font-semibold text-sm transition-colors cursor-pointer ${
              activeView === 'players'
                ? 'bg-[#0050A0] text-white'
                : 'border border-gray-300 text-gray-700 hover:border-[#0050A0] hover:text-[#0050A0]'
            }`}
          >
            Player Rankings
          </button>
          <button
            onClick={() => setActiveView('team-rankings')}
            className={`px-5 py-2 rounded-lg font-semibold text-sm transition-colors cursor-pointer ${
              activeView === 'team-rankings'
                ? 'bg-[#0050A0] text-white'
                : 'border border-gray-300 text-gray-700 hover:border-[#0050A0] hover:text-[#0050A0]'
            }`}
          >
            Team Class Rankings
          </button>
          <button
            onClick={() => setActiveView('pipeline')}
            className={`px-5 py-2 rounded-lg font-semibold text-sm transition-colors cursor-pointer ${
              activeView === 'pipeline'
                ? 'bg-[#0050A0] text-white'
                : 'border border-gray-300 text-gray-700 hover:border-[#0050A0] hover:text-[#0050A0]'
            }`}
          >
            Recruiting Pipeline
          </button>
        </div>

        {/* ═══ TEAM CLASS RANKINGS VIEW ═══ */}
        {activeView === 'team-rankings' && (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-gray-900">Class of {year} Team Rankings</h2>
              <div className="flex gap-2">
                <select
                  value={teamConferenceFilter}
                  onChange={e => setTeamConferenceFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] cursor-pointer"
                >
                  <option value="">All Conferences</option>
                  {['SEC', 'Big Ten', 'Big 12', 'ACC', 'American', 'Pac-12', 'Mountain West', 'Sun Belt', 'Conference USA', 'MAC', 'Independent'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select
                  value={year}
                  onChange={e => setYear(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] cursor-pointer"
                >
                  {availableYears.map(y => (
                    <option key={y} value={y}>Class of {y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0050A0] text-white">
                    <th className="px-3 py-3 text-center font-semibold w-12">#</th>
                    <th className="px-3 py-3 text-left font-semibold">School</th>
                    {([
                      { key: 'totalCommits', label: 'Commits', hide: '' },
                      { key: 'avgStars', label: 'Avg ★', hide: '' },
                      { key: 'fiveStars', label: '5★', hide: '' },
                      { key: 'fourStars', label: '4★', hide: '' },
                      { key: 'threeStars', label: '3★', hide: 'hidden sm:table-cell' },
                    ] as const).map(col => (
                      <th
                        key={col.key}
                        onClick={() => setTeamSortKey(col.key)}
                        className={`px-3 py-3 text-center font-semibold cursor-pointer hover:bg-[#003a75] transition-colors select-none ${col.hide}`}
                      >
                        {col.label} {teamSortKey === col.key && '▼'}
                      </th>
                    ))}
                    <th
                      onClick={() => setTeamSortKey('compositePoints')}
                      className="px-3 py-3 text-center font-semibold hidden md:table-cell cursor-help hover:bg-[#003a75] transition-colors select-none"
                      title="PFSN Score: 5★=160pts, 4★=70pts, 3★=30pts, 2★=12pts, 1★=4pts, 0★=1pt"
                    >
                      <span className="inline-flex items-center gap-1">
                        PFSN Score
                        <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {teamSortKey === 'compositePoints' && '▼'}
                      </span>
                    </th>
                    <th className="px-3 py-3 text-left font-semibold hidden lg:table-cell">Top Recruit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {teamLoading ? (
                    Array.from({ length: 15 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {Array.from({ length: 9 }).map((_, j) => (
                          <td key={j} className="px-3 py-3"><div className="h-4 bg-gray-200 rounded w-12 mx-auto"></div></td>
                        ))}
                      </tr>
                    ))
                  ) : sortedTeamRankings.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-12 text-gray-500">No team rankings data available</td></tr>
                  ) : (
                    sortedTeamRankings.map((team, idx) => (
                      <tr
                        key={team.school}
                        className={`hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                      >
                        <td className="px-3 py-3 text-center tabular-nums font-semibold text-gray-500">{team.rank}</td>
                        <td className="px-3 py-3">
                          {(() => {
                            const slug = getTeamSlug(team.school);
                            const content = (
                              <div className="flex items-center gap-2">
                                <img src={getTeamLogo(team.school)} alt="" className="w-6 h-6 object-contain" />
                                <span className="font-medium text-gray-900">{team.school}</span>
                              </div>
                            );
                            return slug ? (
                              <Link href={`/teams/${slug}/recruiting`} className="hover:text-[#0050A0] transition-colors">
                                {content}
                              </Link>
                            ) : content;
                          })()}
                        </td>
                        <td className="px-3 py-3 text-center tabular-nums font-semibold">{team.totalCommits}</td>
                        <td className="px-3 py-3 text-center tabular-nums">
                          <span className="font-bold text-[#0050A0]">{team.avgStars.toFixed(1)}</span>
                        </td>
                        <td className="px-3 py-3 text-center tabular-nums font-semibold text-yellow-600">{team.fiveStars || '—'}</td>
                        <td className="px-3 py-3 text-center tabular-nums">{team.fourStars || '—'}</td>
                        <td className="px-3 py-3 text-center tabular-nums hidden sm:table-cell">{team.threeStars || '—'}</td>
                        <td className="px-3 py-3 text-center tabular-nums font-medium hidden md:table-cell">{team.compositePoints.toFixed(0)}</td>
                        <td className="px-3 py-3 text-gray-600 hidden lg:table-cell truncate max-w-[150px]">{team.topRecruit}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ═══ RECRUITING PIPELINE VIEW ═══ */}
        {activeView === 'pipeline' && (
          <>
            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recruiting Pipeline ({pipelineYearMin}–{pipelineYearMax})</h2>
              <div className="flex gap-2 flex-wrap">
                <select
                  value={pipelineConference}
                  onChange={e => setPipelineConference(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] cursor-pointer"
                >
                  <option value="">All Conferences</option>
                  {['SEC', 'Big Ten', 'Big 12', 'ACC', 'American', 'Pac-12', 'Mountain West', 'Sun Belt', 'Conference USA', 'MAC', 'Independent'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select
                  value={pipelinePosition}
                  onChange={e => setPipelinePosition(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] cursor-pointer"
                >
                  <option value="">All Positions</option>
                  {['ATH','QB','RB','WR','TE','OT','OG','OC','OL','DT','EDGE','LB','CB','SAF','K','P']
                    .filter(p => pipelinePositions.includes(p))
                    .map(p => (<option key={p} value={p}>{p}</option>))}
                </select>
                <select
                  value={pipelineYearMin}
                  onChange={e => setPipelineYearMin(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] cursor-pointer"
                >
                  {availableYears.map(y => (<option key={y} value={y}>From {y}</option>))}
                </select>
                <select
                  value={pipelineYearMax}
                  onChange={e => setPipelineYearMax(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] cursor-pointer"
                >
                  {availableYears.map(y => (<option key={y} value={y}>To {y}</option>))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0050A0] text-white">
                    <th className="px-3 py-3 text-center font-semibold w-12">#</th>
                    <th className="px-3 py-3 text-left font-semibold">School</th>
                    {([
                      { key: 'totalRecruits', label: 'Recruits' },
                      { key: 'avgStars', label: 'Avg ★' },
                      { key: 'fiveStars', label: '5★' },
                      { key: 'fourStars', label: '4★' },
                      { key: 'threeStars', label: '3★', hide: 'hidden sm:table-cell' },
                      { key: 'avgClassScore', label: 'Avg Class', hide: 'hidden md:table-cell' },
                    ] as const).map(col => (
                      <th
                        key={col.key}
                        onClick={() => setPipelineSortKey(col.key)}
                        className={`px-3 py-3 text-center font-semibold cursor-pointer hover:bg-[#003a75] transition-colors select-none ${'hide' in col ? col.hide : ''}`}
                      >
                        {col.label} {pipelineSortKey === col.key && '▼'}
                      </th>
                    ))}
                    <th
                      onClick={() => setPipelineSortKey('totalScore')}
                      className="px-3 py-3 text-center font-semibold cursor-help hover:bg-[#003a75] transition-colors select-none"
                      title="PFSN Score: 5★=160pts, 4★=70pts, 3★=30pts, 2★=12pts, 1★=4pts, 0★=1pt"
                    >
                      <span className="inline-flex items-center gap-1">
                        PFSN Score
                        <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {pipelineSortKey === 'totalScore' && '▼'}
                      </span>
                    </th>
                    <th className="px-3 py-3 text-center font-semibold hidden lg:table-cell">Best Class</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pipelineLoading ? (
                    Array.from({ length: 15 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {Array.from({ length: 10 }).map((_, j) => (
                          <td key={j} className="px-3 py-3"><div className="h-4 bg-gray-200 rounded w-12 mx-auto"></div></td>
                        ))}
                      </tr>
                    ))
                  ) : sortedPipeline.length === 0 ? (
                    <tr><td colSpan={10} className="text-center py-12 text-gray-500">No pipeline data available</td></tr>
                  ) : (
                    sortedPipeline.map((school, idx) => {
                      const isExpanded = expandedPipelineSchool === school.school;
                      const slug = getTeamSlug(school.school);
                      return (
                        <React.Fragment key={school.school}>
                          <tr
                            onClick={() => setExpandedPipelineSchool(isExpanded ? null : school.school)}
                            className={`hover:bg-blue-50 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                          >
                            <td className="px-3 py-3 text-center tabular-nums font-semibold text-gray-500">{school.rank}</td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                <svg className={`w-3 h-3 text-gray-400 transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                <img src={getTeamLogo(school.school)} alt="" className="w-6 h-6 object-contain" />
                                {slug ? (
                                  <Link href={`/teams/${slug}/recruiting`} onClick={e => e.stopPropagation()} className="font-medium text-gray-900 hover:text-[#0050A0]">
                                    {school.school}
                                  </Link>
                                ) : (
                                  <span className="font-medium text-gray-900">{school.school}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-3 text-center tabular-nums font-semibold">{school.totalRecruits}</td>
                            <td className="px-3 py-3 text-center tabular-nums font-bold text-[#0050A0]">{school.avgStars.toFixed(1)}</td>
                            <td className="px-3 py-3 text-center tabular-nums font-semibold text-yellow-600">{school.fiveStars || '—'}</td>
                            <td className="px-3 py-3 text-center tabular-nums">{school.fourStars || '—'}</td>
                            <td className="px-3 py-3 text-center tabular-nums hidden sm:table-cell">{school.threeStars || '—'}</td>
                            <td className="px-3 py-3 text-center tabular-nums hidden md:table-cell">{school.avgClassScore}</td>
                            <td className="px-3 py-3 text-center tabular-nums font-medium">{school.totalScore.toLocaleString()}</td>
                            <td className="px-3 py-3 text-center tabular-nums hidden lg:table-cell">{school.bestYear} ({school.bestYearScore})</td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={10} className="bg-gray-50 p-0">
                                <div className="px-4 sm:px-6 py-3">
                                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Year-by-Year Recruiting Classes</h4>
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="text-xs text-gray-400 uppercase">
                                        <th className="text-left py-1 pr-4 font-medium">Year</th>
                                        <th className="text-center py-1 pr-4 font-medium">Recruits</th>
                                        <th className="text-center py-1 pr-4 font-medium">5★</th>
                                        <th className="text-center py-1 pr-4 font-medium">PFSN Score</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {Object.entries(school.classByYear)
                                        .sort(([a], [b]) => parseInt(b) - parseInt(a))
                                        .map(([yr, cls]) => (
                                          <tr key={yr} className="border-t border-gray-200">
                                            <td className="py-1.5 pr-4 tabular-nums text-gray-600">{yr}</td>
                                            <td className="py-1.5 pr-4 text-center tabular-nums">{cls.recruits}</td>
                                            <td className="py-1.5 pr-4 text-center tabular-nums text-yellow-600">{cls.fiveStars || '—'}</td>
                                            <td className="py-1.5 pr-4 text-center tabular-nums font-medium">{cls.score}</td>
                                          </tr>
                                        ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {!pipelineLoading && (
              <p className="text-xs text-gray-500 mt-3">
                Showing {sortedPipeline.length} FBS schools
              </p>
            )}
          </>
        )}

        {/* ═══ PLAYER RANKINGS VIEW ═══ */}
        {activeView === 'players' && (<>
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by name, high school, or city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] focus:border-transparent"
            />
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            <select
              value={source}
              onChange={e => setSource(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] cursor-pointer"
            >
              {SOURCES.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>

            <select
              value={year}
              onChange={e => setYear(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] cursor-pointer"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>Class of {y}</option>
              ))}
            </select>

            <MultiSelectDropdown
              label="All Positions"
              options={['ATH','QB','RB','WR','TE','OT','OG','OC','OL','DT','EDGE','LB','CB','SAF','K','P']
                .filter(p => availablePositions.includes(p))
                .map(p => ({ value: p, label: p }))}
              selected={positions}
              onChange={setPositions}
            />

            <MultiSelectDropdown
              label="All Stars"
              options={STAR_OPTIONS}
              selected={starValues}
              onChange={setStarValues}
            />

            <MultiSelectDropdown
              label="All States"
              options={availableStates.map(s => ({ value: s, label: s }))}
              selected={states}
              onChange={setStates}
            />

            <select
              value={committed}
              onChange={e => setCommitted(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="enrolled">Enrolled</option>
              <option value="signed">Signed</option>
              <option value="committed">Committed</option>
              <option value="uncommitted">Uncommitted</option>
            </select>

            <button
              onClick={() => {
                setSearch('');
                setPositions([]);
                setStarValues([]);
                setStates([]);
                setCommitted('');
              }}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-sm text-gray-500 mb-3">
            Showing {recruits.length} of {total.toLocaleString()} recruits
          </p>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0050A0] text-white">
                <th className="px-3 py-3 text-center font-semibold w-12">Rank</th>
                <th className="px-3 py-3 text-left font-semibold">Recruit</th>
                <th className="px-3 py-3 text-center font-semibold">Pos</th>
                <th className="px-3 py-3 text-center font-semibold">Stars</th>
                <th className="px-3 py-3 text-left font-semibold hidden md:table-cell">High School</th>
                <th className="px-3 py-3 text-left font-semibold hidden lg:table-cell">Location</th>
                <th className="px-3 py-3 text-center font-semibold hidden sm:table-cell">Height</th>
                <th className="px-3 py-3 text-center font-semibold hidden sm:table-cell">Weight</th>
                <th className="px-3 py-3 text-center font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 15 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-3 py-3"><div className="h-4 bg-gray-200 rounded w-8 mx-auto"></div></td>
                    <td className="px-3 py-3"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                    <td className="px-3 py-3"><div className="h-4 bg-gray-200 rounded w-8 mx-auto"></div></td>
                    <td className="px-3 py-3"><div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div></td>
                    <td className="px-3 py-3 hidden md:table-cell"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td className="px-3 py-3 hidden lg:table-cell"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                    <td className="px-3 py-3 hidden sm:table-cell"><div className="h-4 bg-gray-200 rounded w-10 mx-auto"></div></td>
                    <td className="px-3 py-3 hidden sm:table-cell"><div className="h-4 bg-gray-200 rounded w-10 mx-auto"></div></td>
                    <td className="px-3 py-3"><div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div></td>
                  </tr>
                ))
              ) : recruits.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-500">
                    No recruits found matching your filters
                  </td>
                </tr>
              ) : (
                recruits.map((recruit, idx) => (
                  <tr
                    key={`${recruit.id}-${idx}`}
                    className={`hover:bg-blue-50 transition-colors ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    <td className="px-3 py-3 text-center tabular-nums text-gray-500 font-medium">
                      {recruit.nationalRank || ((currentPage - 1) * itemsPerPage + idx + 1)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <RecruitAvatar recruit={recruit} />
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 truncate">{recruit.name}</div>
                          <div className="text-xs text-gray-500 md:hidden">{recruit.highSchool}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center text-gray-700">{recruit.position}</td>
                    <td className="px-3 py-3">
                      <div className="flex justify-center">
                        <StarRating stars={recruit.stars} />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-600 hidden md:table-cell truncate max-w-[200px]">
                      {recruit.highSchool}
                    </td>
                    <td className="px-3 py-3 text-gray-600 hidden lg:table-cell whitespace-nowrap">
                      {recruit.city}{recruit.state ? `, ${recruit.state}` : ''}
                    </td>
                    <td className="px-3 py-3 text-center text-gray-600 hidden sm:table-cell tabular-nums">
                      {recruit.height || '—'}
                    </td>
                    <td className="px-3 py-3 text-center text-gray-600 hidden sm:table-cell tabular-nums">
                      {recruit.weight || '—'}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <StatusCell recruit={recruit} getTeamSlug={getTeamSlug} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && total > 0 && (
          <div className="mt-4">
            <Pagination
              totalItems={total}
              totalPages={Math.ceil(total / itemsPerPage)}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
            />
          </div>
        )}
        </>)}
      </div>

      <Footer currentPage="Recruiting Hub" />
    </>
  );
}
