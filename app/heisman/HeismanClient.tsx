'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Footer from '@/components/Footer';
import RaptiveHeaderAd from '@/components/RaptiveHeaderAd';
import TransferPortalBanner from '@/components/TransferPortalBanner';
import { getTeamLogo } from '@/utils/teamLogos';

interface HeismanWinner {
  year: number;
  name: string;
  school: string;
  conference: string;
  position: string;
  classYear: string;
  rushYards: number | null;
  rushTDs: number | null;
  rushYPC: number | null;
  passYards: number | null;
  passTDs: number | null;
  completionPct: number | null;
  interceptions: number | null;
  receptions: number | null;
  recYards: number | null;
  recTDs: number | null;
  returnYards?: number | null;
  returnTDs?: number | null;
  record: string | null;
  finalRank: number | null;
  notes: string | null;
}

interface PositionGroup {
  label: string;
  match: (pos: string) => boolean;
}

const POSITION_GROUPS: PositionGroup[] = [
  { label: 'All', match: () => true },
  { label: 'QB', match: (p) => p === 'QB' },
  { label: 'RB', match: (p) => ['RB', 'HB', 'FB', 'TB'].includes(p) },
  { label: 'WR', match: (p) => ['WR', 'FL', 'WR/CB', 'CB/WR'].includes(p) },
  { label: 'Other', match: (p) => !['QB', 'RB', 'HB', 'FB', 'TB', 'WR', 'FL', 'WR/CB', 'CB/WR'].includes(p) },
];


function SchoolLogo({ school }: { school: string }) {
  const [error, setError] = useState(false);
  const src = getTeamLogo(school);
  if (!src || error) return null;
  return (
    <img
      src={src}
      alt=""
      width={20}
      height={20}
      className="w-5 h-5 object-contain shrink-0"
      onError={() => setError(true)}
    />
  );
}

function getPrimaryStats(w: HeismanWinner): string {
  const pos = w.position;
  const isQB = pos === 'QB';
  const isRB = ['RB', 'HB', 'FB', 'TB'].includes(pos);
  const isReceiver = ['WR', 'FL', 'WR/CB', 'CB/WR'].includes(pos);

  if (isQB && w.passYards != null) {
    const parts: string[] = [`${w.passYards.toLocaleString()} yds`];
    if (w.passTDs != null) parts.push(`${w.passTDs} TD`);
    if (w.completionPct != null) parts.push(`${w.completionPct}% cmp`);
    if (w.rushYards != null && w.rushYards > 300) parts.push(`${w.rushYards.toLocaleString()} rush`);
    return parts.join(' · ');
  }
  if (isRB && w.rushYards != null) {
    const parts: string[] = [`${w.rushYards.toLocaleString()} yds`];
    if (w.rushTDs != null) parts.push(`${w.rushTDs} TD`);
    if (w.rushYPC != null) parts.push(`${w.rushYPC} YPC`);
    return parts.join(' · ');
  }
  if (isReceiver && (w.recYards != null || w.receptions != null)) {
    const parts: string[] = [];
    if (w.receptions != null) parts.push(`${w.receptions} rec`);
    if (w.recYards != null) parts.push(`${w.recYards.toLocaleString()} yds`);
    if (w.recTDs != null) parts.push(`${w.recTDs} TD`);
    if (w.interceptions != null) parts.push(`${w.interceptions} INT`);
    return parts.join(' · ');
  }
  // Other positions (CB, TE, HB, etc.) — show all available non-QB/RB stats
  const otherParts: string[] = [];
  if (w.passYards != null) otherParts.push(`${w.passYards.toLocaleString()} pass`);
  if (w.rushYards != null) otherParts.push(`${w.rushYards.toLocaleString()} rush`);
  if (w.interceptions != null) otherParts.push(`${w.interceptions} INT`);
  if (w.receptions != null) otherParts.push(`${w.receptions} rec`);
  if (w.recYards != null) otherParts.push(`${w.recYards.toLocaleString()} rec yds`);
  if (w.returnYards != null) otherParts.push(`${w.returnYards.toLocaleString()} ret yds`);
  if (otherParts.length > 0) return otherParts.join(' · ');
  return '—';
}



export default function HeismanClient() {
  const [allWinners, setAllWinners] = useState<HeismanWinner[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('All');
  const [conferenceFilter, setConferenceFilter] = useState('All');
  const [positionFilter, setPositionFilter] = useState('All');
  const [classFilter, setClassFilter] = useState('All');
  const [sortKey, setSortKey] = useState<'year' | 'school'>('year');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetch('/cfb-hq/data/reference/heisman-winners.json')
      .then(r => r.json())
      .then((data: HeismanWinner[]) => {
        setAllWinners([...data].reverse());
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const allSchools = useMemo(
    () => Array.from(new Set(allWinners.map(w => w.school))).sort(),
    [allWinners]
  );
  const allConferences = useMemo(
    () => Array.from(new Set(allWinners.map(w => w.conference))).sort(),
    [allWinners]
  );

  const posGroup: PositionGroup = POSITION_GROUPS.find(p => p.label === positionFilter) ?? POSITION_GROUPS[0];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let data = allWinners.filter(w => {
      if (schoolFilter !== 'All' && w.school !== schoolFilter) return false;
      if (conferenceFilter !== 'All' && w.conference !== conferenceFilter) return false;
      if (!posGroup.match(w.position)) return false;
      if (classFilter !== 'All' && !w.classYear.includes(classFilter)) return false;
      if (q && !w.name.toLowerCase().includes(q) && !w.school.toLowerCase().includes(q)) return false;
      return true;
    });

    return [...data].sort((a, b) => {
      if (sortKey === 'school') {
        return sortDir === 'asc' ? a.school.localeCompare(b.school) : b.school.localeCompare(a.school);
      }
      return sortDir === 'asc' ? a.year - b.year : b.year - a.year;
    });
  }, [allWinners, search, schoolFilter, conferenceFilter, posGroup, classFilter, sortKey, sortDir]);

  const schoolCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const w of filtered) counts[w.school] = (counts[w.school] ?? 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [filtered]);

  const isFiltered = search !== '' || schoolFilter !== 'All' || conferenceFilter !== 'All' || positionFilter !== 'All' || classFilter !== 'All';

  function clearAll() {
    setSearch('');
    setSchoolFilter('All');
    setConferenceFilter('All');
    setPositionFilter('All');
    setClassFilter('All');
  }

  function handleSort(key: 'year' | 'school') {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'year' ? 'desc' : 'asc');
    }
  }

  function SortArrow({ col }: { col: 'year' | 'school' }) {
    if (sortKey !== col) return <span className="ml-1 text-xs opacity-30">&#8693;</span>;
    return <span className="ml-1 text-xs opacity-60">{sortDir === 'desc' ? '▼' : '▲'}</span>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading Heisman data&hellip;</div>
      </div>
    );
  }

  const totalWinners = allWinners.length;
  const qbCount = allWinners.filter(w => w.position === 'QB').length;
  const rbCount = allWinners.filter(w => ['RB', 'HB', 'FB', 'TB'].includes(w.position)).length;
  const schoolCount = new Set(allWinners.map(w => w.school)).size;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header
        className="text-white shadow-lg"
        style={{
          background: 'linear-gradient(180deg, #0050A0 0%, #003a75 100%)',
          boxShadow: 'inset 0 -30px 40px -30px rgba(0,0,0,0.15), 0 4px 6px -1px rgba(0,0,0,0.1)',
        }}
      >
        <div className="container mx-auto px-4 pt-6 sm:pt-7 md:pt-8 lg:pt-10 pb-3 sm:pb-4 md:pb-5 lg:pb-6">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-2">
            Heisman Trophy History
          </h1>
          <p className="text-base sm:text-lg opacity-90 font-medium">
            Every winner from 1935&ndash;2025 with their season stats, school, conference, and team record
          </p>
        </div>
      </header>
      <TransferPortalBanner />

      <main className="container mx-auto px-4 py-6 flex-1 max-w-7xl space-y-5">
        <RaptiveHeaderAd />

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <input
              type="text"
              placeholder="Search player or school…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0]"
            />
            <select
              value={schoolFilter}
              onChange={e => setSchoolFilter(e.target.value)}
              className="cursor-pointer border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0]"
            >
              <option className="cursor-pointer" value="All">All Schools</option>
              {allSchools.map(s => <option className="cursor-pointer" key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={conferenceFilter}
              onChange={e => setConferenceFilter(e.target.value)}
              className="cursor-pointer border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0]"
            >
              <option className="cursor-pointer" value="All">All Conferences</option>
              {allConferences.map(c => <option className="cursor-pointer" key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={positionFilter}
              onChange={e => setPositionFilter(e.target.value)}
              className="cursor-pointer border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0]"
            >
              {POSITION_GROUPS.map(pg => (
                <option className="cursor-pointer" key={pg.label} value={pg.label}>{pg.label === 'All' ? 'All Positions' : pg.label}</option>
              ))}
            </select>
            <select
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
              className="cursor-pointer border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0]"
            >
              <option className="cursor-pointer" value="All">All Classes</option>
              <option className="cursor-pointer" value="Freshman">Freshman</option>
              <option className="cursor-pointer" value="Sophomore">Sophomore</option>
              <option className="cursor-pointer" value="Junior">Junior</option>
              <option className="cursor-pointer" value="Senior">Senior</option>
            </select>
          </div>
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-3">
            <span>Showing <span className="font-semibold text-gray-800">{filtered.length}</span> of {totalWinners} winners</span>
            {isFiltered && (
              <button
                onClick={clearAll}
                className="cursor-pointer text-[#0050A0] hover:underline font-medium"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* School Leaderboard */}
        {schoolCounts.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              {filtered.length === totalWinners ? 'All-Time' : 'Filtered'} Wins by School
            </h2>
            <div className="flex flex-wrap gap-2">
              {schoolCounts.map(([school, count], i) => (
                <button
                  key={school}
                  onClick={() => setSchoolFilter(schoolFilter === school ? 'All' : school)}
                  className={`cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors border ${
                    schoolFilter === school
                      ? 'bg-[#0050A0] text-white border-[#0050A0]'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-[#0050A0] hover:bg-blue-50'
                  }`}
                >
                  <SchoolLogo school={school} />
                  <span className="font-bold text-base leading-none">{count}</span>
                  <span className="text-xs leading-tight">{school}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th
                    className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-[#0050A0] select-none whitespace-nowrap"
                    onClick={() => handleSort('year')}
                  >
                    Year <SortArrow col="year" />
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Winner</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Pos</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap hidden sm:table-cell">Class</th>
                  <th
                    className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-[#0050A0] select-none whitespace-nowrap"
                    onClick={() => handleSort('school')}
                  >
                    School <SortArrow col="school" />
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap hidden sm:table-cell">Conf</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Key Stats</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 whitespace-nowrap hidden md:table-cell">Team Record</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 whitespace-nowrap hidden lg:table-cell">AP Poll</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-gray-400">
                      No winners match the current filters.
                    </td>
                  </tr>
                )}
                {filtered.map(w => {
                  const stats = getPrimaryStats(w);
                  return (
                    <tr key={w.year} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3 font-bold text-[#0050A0] whitespace-nowrap">{w.year}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">{w.name}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700 text-sm">
                        {w.position}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-xs hidden sm:table-cell">
                        {w.classYear}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          className="cursor-pointer flex items-center gap-1.5 font-medium text-gray-800 hover:text-[#0050A0] transition-colors text-left"
                          onClick={() => setSchoolFilter(schoolFilter === w.school ? 'All' : w.school)}
                        >
                          <SchoolLogo school={w.school} />
                          {w.school}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap hidden sm:table-cell">
                        {w.conference}
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-xs whitespace-nowrap">{stats}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap hidden md:table-cell">
                        {w.record
                          ? <span className="text-gray-700 font-medium">{w.record}</span>
                          : <span className="text-gray-300">&mdash;</span>}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap hidden lg:table-cell">
                        {w.finalRank != null
                          ? <span className="font-semibold text-gray-700">#{w.finalRank}</span>
                          : <span className="text-gray-300">&mdash;</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center pb-2">
          Stats from each player&apos;s Heisman-winning season. Historical stats (pre-1960) may be incomplete.
          Reggie Bush&apos;s 2005 award was vacated in 2010 and restored in 2021.
        </p>
      </main>
      <Footer />
    </div>
  );
}
