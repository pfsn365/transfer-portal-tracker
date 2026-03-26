'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import RaptiveHeaderAd from '@/components/RaptiveHeaderAd';
import TransferPortalBanner from '@/components/TransferPortalBanner';
import Pagination from '@/components/Pagination';
import { getTeamLogo } from '@/utils/teamLogos';
import { getApiPath } from '@/utils/api';
import { allTeams } from '@/data/teams';

// ── Types ──────────────────────────────────────────────────────────────────────

interface PipelineEntry {
  teamName: string;
  teamSlug: string;
  teamId: string;
  totalPicks: number;
  firstRoundPicks: number;
  recentPicks: number;
  picksByDecade: Record<string, number>;
  topPlayers: {
    year: number;
    round: number;
    pick: number;
    name: string;
    position: string;
    nflTeam: string;
  }[];
}

interface DraftPick {
  year: number;
  round: number;
  pick: number;
  name: string;
  position: string;
  nflTeam: string;
  schoolName: string;
  schoolSlug: string;
}

type Tab = 'pipeline' | 'history';
type SortKey = 'totalPicks' | 'firstRoundPicks' | 'recentPicks' | '2020s' | '2010s' | '2000s';

const DECADES = ['2020s', '2010s', '2000s'] as const;
const YEAR_MIN = 1967;
const YEAR_MAX = 2025;
const YEAR_OPTIONS = Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => YEAR_MAX - i);
const CONFERENCES = ['SEC', 'Big Ten', 'Big 12', 'ACC', 'American', 'Pac-12', 'Mountain West', 'Sun Belt', 'Conference USA', 'MAC', 'Independent'] as const;
const POSITIONS = [
  'QB', 'RB', 'WR', 'TE', 'OL', 'OT', 'OG', 'C',
  'DL', 'DE', 'DT', 'LB', 'CB', 'S', 'DB', 'K', 'P',
] as const;

const PIPELINE_POSITION_FILTERS = [
  'All', 'QB', 'RB', 'WR', 'TE', 'OL', 'OT', 'OG', 'OC', 'DL', 'DT', 'EDGE', 'LB', 'DB', 'CB', 'SAF', 'K/P',
] as const;

// ── Skeleton helpers ───────────────────────────────────────────────────────────

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

function TableSkeleton({ cols, rows = 10 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function DraftHistoryClient() {
  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>('pipeline');

  // Pipeline state
  const [pipelineData, setPipelineData] = useState<PipelineEntry[]>([]);
  const [pipelineLoading, setPipelineLoading] = useState(true);
  const [pipelineSearch, setPipelineSearch] = useState('');
  const [pipelineSort, setPipelineSort] = useState<SortKey>('totalPicks');
  const [conferenceFilter, setConferenceFilter] = useState('');
  const [pipelinePosition, setPipelinePosition] = useState('All');
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  // History state
  const [historyPicks, setHistoryPicks] = useState<DraftPick[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [schoolFilter, setSchoolFilter] = useState('');
  const [yearMin, setYearMin] = useState('');
  const [yearMax, setYearMax] = useState('');
  const [roundFilter, setRoundFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const [error, setError] = useState('');
  const [allSchools, setAllSchools] = useState<{ slug: string; name: string }[]>([]);

  const pipelineAbort = useRef<AbortController | null>(null);
  const historyAbort = useRef<AbortController | null>(null);

  // ── Fetch pipeline data ──────────────────────────────────────────────────────

  useEffect(() => {
    if (activeTab !== 'pipeline') return;
    pipelineAbort.current?.abort();
    const controller = new AbortController();
    pipelineAbort.current = controller;

    setPipelineLoading(true);
    setError('');

    const posParam = pipelinePosition !== 'All' ? `&position=${pipelinePosition}` : '';
    fetch(getApiPath(`api/cfb/draft-data?view=pipeline${posParam}`), { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load pipeline data');
        return res.json();
      })
      .then((data: PipelineEntry[]) => {
        setPipelineData(data);
        setPipelineLoading(false);
      })
      .catch((err) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err.message);
        setPipelineLoading(false);
      });

    return () => controller.abort();
  }, [activeTab, pipelinePosition]);

  // ── Fetch history data ───────────────────────────────────────────────────────

  useEffect(() => {
    if (activeTab !== 'history') return;
    historyAbort.current?.abort();
    const controller = new AbortController();
    historyAbort.current = controller;

    setHistoryLoading(true);
    setError('');

    const params = new URLSearchParams({ view: 'history' });
    if (schoolFilter) params.set('school', schoolFilter);
    if (yearMin) params.set('yearMin', yearMin);
    if (yearMax) params.set('yearMax', yearMax);
    if (roundFilter) params.set('round', roundFilter);
    if (positionFilter) params.set('position', positionFilter);

    fetch(getApiPath(`api/cfb/draft-data?${params.toString()}`), { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load draft history');
        return res.json();
      })
      .then((data: { picks: DraftPick[]; total: number }) => {
        setHistoryPicks(data.picks);
        setHistoryTotal(data.total);
        setCurrentPage(1);
        setHistoryLoading(false);
      })
      .catch((err) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err.message);
        setHistoryLoading(false);
      });

    return () => controller.abort();
  }, [activeTab, schoolFilter, yearMin, yearMax, roundFilter, positionFilter]);

  // ── Derived pipeline data ────────────────────────────────────────────────────

  // Team slug to conference lookup
  const teamConference = useMemo(() => {
    const map: Record<string, string> = {};
    allTeams.forEach((t) => { map[t.slug] = t.conference; });
    return map;
  }, []);

  // Summary stats
  const summaryStats = useMemo(() => {
    const totalPicks = pipelineData.reduce((sum, t) => sum + t.totalPicks, 0);
    const firstRounders = pipelineData.reduce((sum, t) => sum + t.firstRoundPicks, 0);
    return { schools: pipelineData.length, totalPicks, firstRounders };
  }, [pipelineData]);

  const filteredPipeline = useMemo(() => {
    let list = [...pipelineData];

    if (pipelineSearch.trim()) {
      const q = pipelineSearch.toLowerCase();
      list = list.filter((t) => t.teamName.toLowerCase().includes(q));
    }

    if (conferenceFilter) {
      list = list.filter((t) => teamConference[t.teamSlug] === conferenceFilter);
    }

    list.sort((a, b) => {
      const decadeKeys = ['2020s', '2010s', '2000s'] as const;
      if (decadeKeys.includes(pipelineSort as typeof decadeKeys[number])) {
        return (b.picksByDecade[pipelineSort] || 0) - (a.picksByDecade[pipelineSort] || 0);
      }
      return (b[pipelineSort as keyof PipelineEntry] as number) - (a[pipelineSort as keyof PipelineEntry] as number);
    });
    return list;
  }, [pipelineData, pipelineSearch, pipelineSort, conferenceFilter]);

  // ── Derived history data (pagination) ────────────────────────────────────────

  const totalPages = Math.ceil(historyTotal / itemsPerPage);
  const paginatedPicks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return historyPicks.slice(start, start + itemsPerPage);
  }, [historyPicks, currentPage, itemsPerPage]);

  // School list for the dropdown — uses allSchools (unfiltered) so position filter doesn't reduce options
  const schoolOptions = useMemo(() => {
    const source = allSchools.length > 0 ? allSchools : pipelineData.map((t) => ({ slug: t.teamSlug, name: t.teamName }));
    return [...source].sort((a, b) => a.name.localeCompare(b.name));
  }, [allSchools, pipelineData]);

  // Fetch full school list once for the history tab dropdown (no position filter)
  useEffect(() => {
    if (allSchools.length > 0) return;
    fetch(getApiPath('api/cfb/draft-data?view=pipeline'))
      .then((res) => res.json())
      .then((data: PipelineEntry[]) => {
        setAllSchools(data.map((t) => ({ slug: t.teamSlug, name: t.teamName })));
        // Seed pipeline data if it hasn't been loaded yet (avoids a duplicate request)
        setPipelineData((prev) => (prev.length > 0 ? prev : data));
      })
      .catch(() => {});
  }, [allSchools.length]);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Hero */}
      <header
        className="text-white shadow-lg"
        style={{
          background: 'linear-gradient(180deg, #0050A0 0%, #003a75 100%)',
          boxShadow:
            'inset 0 -30px 40px -30px rgba(0,0,0,0.15), 0 4px 6px -1px rgba(0,0,0,0.1)',
        }}
      >
        <div className="container mx-auto px-4 pt-6 sm:pt-7 md:pt-8 lg:pt-10 pb-3 sm:pb-4 md:pb-5 lg:pb-6">
          <h1 className="text-4xl lg:text-5xl font-extrabold mb-2">
            CFB Draft History
          </h1>
          <p className="text-lg opacity-90 font-medium">
            NFL Draft picks by college program, spanning the modern era (1967–2025)
          </p>
        </div>
      </header>
      <TransferPortalBanner />
      <RaptiveHeaderAd />

      {/* Content */}
      <main className="container mx-auto px-4 py-6 flex-1 max-w-7xl">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-5 py-2 rounded-lg font-semibold text-sm transition-colors cursor-pointer ${
              activeTab === 'pipeline'
                ? 'bg-[#0050A0] text-white'
                : 'border border-gray-300 text-gray-700 hover:border-[#0050A0] hover:text-[#0050A0]'
            }`}
          >
            School Pipeline
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-5 py-2 rounded-lg font-semibold text-sm transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'bg-[#0050A0] text-white'
                : 'border border-gray-300 text-gray-700 hover:border-[#0050A0] hover:text-[#0050A0]'
            }`}
          >
            Draft Picks By Year
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* ── Pipeline Tab ─────────────────────────────────────────────────── */}
        {activeTab === 'pipeline' && (
          <section>
            {/* Summary Stats Bar */}
            {!pipelineLoading && pipelineData.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <div className="text-2xl font-bold text-[#0050A0] tabular-nums">{summaryStats.schools}</div>
                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">Schools</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <div className="text-2xl font-bold text-[#0050A0] tabular-nums">{summaryStats.totalPicks.toLocaleString()}</div>
                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">Total Picks</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <div className="text-2xl font-bold text-[#0050A0] tabular-nums">{summaryStats.firstRounders.toLocaleString()}</div>
                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">First Rounders</div>
                </div>
              </div>
            )}

            {/* Position Filter Pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {PIPELINE_POSITION_FILTERS.map((pos) => (
                <button
                  key={pos}
                  onClick={() => setPipelinePosition(pos)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                    pipelinePosition === pos
                      ? 'bg-[#0050A0] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                type="text"
                placeholder="Search schools..."
                value={pipelineSearch}
                onChange={(e) => setPipelineSearch(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] focus:border-transparent"
              />
              <select
                value={conferenceFilter}
                onChange={(e) => setConferenceFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] focus:border-transparent cursor-pointer"
              >
                <option value="">All Conferences</option>
                {CONFERENCES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0050A0] text-white">
                    <th className="px-4 py-3 text-left font-semibold w-12">#</th>
                    <th className="px-4 py-3 text-left font-semibold">School</th>
                    {([
                      { key: 'totalPicks' as SortKey, label: 'Total' },
                      { key: 'firstRoundPicks' as SortKey, label: '1st Rd' },
                      { key: 'recentPicks' as SortKey, label: 'Last 10 Yrs' },
                    ]).map(({ key, label }) => (
                      <th
                        key={key}
                        onClick={() => setPipelineSort(key)}
                        className="px-4 py-3 text-right font-semibold tabular-nums cursor-pointer hover:bg-[#003a75] transition-colors select-none"
                      >
                        {label} {pipelineSort === key && '▼'}
                      </th>
                    ))}
                    {DECADES.map((d) => (
                      <th
                        key={d}
                        onClick={() => setPipelineSort(d as SortKey)}
                        className="px-4 py-3 text-right font-semibold tabular-nums hidden lg:table-cell cursor-pointer hover:bg-[#003a75] transition-colors select-none"
                      >
                        {d} {pipelineSort === d && '▼'}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pipelineLoading ? (
                    <TableSkeleton cols={5 + DECADES.length} />
                  ) : filteredPipeline.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5 + DECADES.length}
                        className="text-center py-12 text-gray-500"
                      >
                        No schools found
                      </td>
                    </tr>
                  ) : (
                    filteredPipeline.map((team, idx) => {
                      const isExpanded = expandedTeam === team.teamSlug;
                      const colCount = 5 + DECADES.length;
                      return (
                        <React.Fragment key={team.teamSlug}>
                          <tr
                            onClick={() => setExpandedTeam(isExpanded ? null : team.teamSlug)}
                            className={`border-t border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer ${
                              isExpanded ? 'bg-blue-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                            }`}
                          >
                            <td className="px-4 py-3 text-gray-500 tabular-nums">
                              {idx + 1}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2 font-medium text-gray-900">
                                <svg className={`w-3 h-3 text-gray-400 transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                <img
                                  src={getTeamLogo(team.teamName)}
                                  alt=""
                                  className="w-6 h-6 object-contain"
                                  loading="lazy"
                                />
                                <span className="hidden sm:inline">{team.teamName}</span>
                                <span className="sm:hidden">
                                  {team.teamName.split(' ').slice(0, -1).join(' ') || team.teamName}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold tabular-nums">
                              {team.totalPicks}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums">
                              {team.firstRoundPicks}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums">
                              {team.recentPicks}
                            </td>
                            {DECADES.map((d) => (
                              <td
                                key={d}
                                className="px-4 py-3 text-right tabular-nums hidden lg:table-cell"
                              >
                                {team.picksByDecade[d] || 0}
                              </td>
                            ))}
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={colCount} className="bg-gray-50 p-0">
                                <div className="px-4 sm:px-6 py-3">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                      {pipelinePosition !== 'All' ? `Recent ${pipelinePosition} ` : 'Recent '}Draft Picks
                                    </h4>
                                    <Link
                                      href={`/teams/${team.teamSlug}/draft`}
                                      className="text-xs text-[#0050A0] hover:underline font-medium cursor-pointer"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      View Full Draft History →
                                    </Link>
                                  </div>
                                  {team.topPlayers.length > 0 ? (
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="text-xs text-gray-400 uppercase">
                                          <th className="text-left py-1 pr-4 font-medium">Year</th>
                                          <th className="text-left py-1 pr-4 font-medium">Round</th>
                                          <th className="text-left py-1 pr-4 font-medium">Pick</th>
                                          <th className="text-left py-1 pr-4 font-medium">Player</th>
                                          <th className="text-left py-1 pr-4 font-medium">Pos</th>
                                          <th className="text-left py-1 font-medium">NFL Team</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {team.topPlayers.map((p, i) => (
                                          <tr key={`${p.name}-${p.year}-${i}`} className="border-t border-gray-200">
                                            <td className="py-2 pr-4 tabular-nums text-gray-600">{p.year}</td>
                                            <td className="py-2 pr-4 tabular-nums text-gray-600">{p.round}</td>
                                            <td className="py-2 pr-4 tabular-nums text-gray-600">#{p.pick}</td>
                                            <td className="py-2 pr-4 font-medium text-gray-900">{p.name}</td>
                                            <td className="py-2 pr-4 text-gray-500">{p.position}</td>
                                            <td className="py-2 text-gray-600">{p.nflTeam}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  ) : (
                                    <p className="text-sm text-gray-400">No draft picks in this category</p>
                                  )}
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
                Showing {filteredPipeline.length} school{filteredPipeline.length !== 1 ? 's' : ''}
              </p>
            )}
          </section>
        )}

        {/* ── History Tab ──────────────────────────────────────────────────── */}
        {activeTab === 'history' && (
          <section>
            {/* Filters */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
              <select
                value={schoolFilter}
                onChange={(e) => setSchoolFilter(e.target.value)}
                className="col-span-2 sm:col-span-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] focus:border-transparent cursor-pointer"
              >
                <option value="">All Schools</option>
                {schoolOptions.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={yearMin}
                onChange={(e) => setYearMin(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] focus:border-transparent cursor-pointer"
              >
                <option value="">From Year</option>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <select
                value={yearMax}
                onChange={(e) => setYearMax(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] focus:border-transparent cursor-pointer"
              >
                <option value="">To Year</option>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              <select
                value={roundFilter}
                onChange={(e) => setRoundFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] focus:border-transparent cursor-pointer"
              >
                <option value="">All Rounds</option>
                {[1, 2, 3, 4, 5, 6, 7].map((r) => (
                  <option key={r} value={r}>
                    Round {r}
                  </option>
                ))}
              </select>

              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] focus:border-transparent cursor-pointer"
              >
                <option value="">All Positions</option>
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0050A0] text-white">
                    <th className="px-4 py-3 text-left font-semibold tabular-nums">
                      Year
                    </th>
                    <th className="px-4 py-3 text-center font-semibold tabular-nums">
                      Rd
                    </th>
                    <th className="px-4 py-3 text-center font-semibold tabular-nums">
                      Pick
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">Player</th>
                    <th className="px-4 py-3 text-center font-semibold">Pos</th>
                    <th className="px-4 py-3 text-left font-semibold">School</th>
                    <th className="px-4 py-3 text-left font-semibold">NFL Team</th>
                  </tr>
                </thead>
                <tbody>
                  {historyLoading ? (
                    <TableSkeleton cols={7} rows={12} />
                  ) : paginatedPicks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-500">
                        No draft picks found matching your filters
                      </td>
                    </tr>
                  ) : (
                    paginatedPicks.map((pick, idx) => (
                      <tr
                        key={`${pick.schoolSlug}-${pick.year}-${pick.pick}`}
                        className={`border-t border-gray-100 hover:bg-blue-50 transition-colors ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        }`}
                      >
                        <td className="px-4 py-3 tabular-nums font-medium">
                          {pick.year}
                        </td>
                        <td className="px-4 py-3 text-center tabular-nums">
                          {pick.round}
                        </td>
                        <td className="px-4 py-3 text-center tabular-nums">
                          {pick.pick}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {pick.name}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm text-gray-700">
                            {pick.position}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/teams/${pick.schoolSlug}`}
                            className="flex items-center gap-2 hover:underline"
                          >
                            <img
                              src={getTeamLogo(pick.schoolName)}
                              alt=""
                              className="w-5 h-5 object-contain"
                              loading="lazy"
                            />
                            <span className="hidden md:inline text-gray-700">
                              {pick.schoolName}
                            </span>
                            <span className="md:hidden text-gray-700">
                              {pick.schoolSlug.split('-')[0].charAt(0).toUpperCase() +
                                pick.schoolSlug.split('-')[0].slice(1)}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{pick.nflTeam}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!historyLoading && historyTotal > 0 && (
              <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  totalItems={historyTotal}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(n) => {
                    setItemsPerPage(n);
                    setCurrentPage(1);
                  }}
                  itemsPerPageOptions={[25, 50, 100]}
                />
              </div>
            )}
          </section>
        )}
      </main>

      <Footer currentPage="Draft History" />
    </div>
  );
}
