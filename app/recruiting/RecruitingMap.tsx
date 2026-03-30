'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { getApiPath } from '@/utils/api';
import { getTeamLogo } from '@/utils/teamLogos';
import { allTeams } from '@/data/teams';

interface MapRecruit {
  name: string;
  position: string;
  stars: number;
  city: string;
  state: string;
  highSchool: string;
  committedTo?: string;
  commitStatus: string;
  lat: number;
  lng: number;
  nationalRank: number;
  imageUrl: string;
}

const FBS_CONFERENCES = ['SEC', 'Big Ten', 'Big 12', 'ACC', 'American', 'Pac-12', 'Mountain West', 'Sun Belt', 'Conference USA', 'MAC', 'Independent'];

// Team primary colors for map pins
const TEAM_COLORS: Record<string, string> = {
  'alabama': '#9E1B32', 'arkansas': '#9D2235', 'auburn': '#0C2340', 'florida': '#0021A5',
  'georgia': '#BA0C2F', 'kentucky': '#0033A0', 'lsu': '#461D7C', 'ole miss': '#CE1126',
  'mississippi state': '#660000', 'missouri': '#F1B82D', 'oklahoma': '#841617', 'south carolina': '#73000A',
  'tennessee': '#FF8200', 'texas': '#BF5700', 'texas a&m': '#500000', 'vanderbilt': '#866D4B',
  'illinois': '#E84A27', 'indiana': '#990000', 'iowa': '#FFCD00', 'maryland': '#E03A3E',
  'michigan': '#00274C', 'michigan state': '#18453B', 'minnesota': '#7A0019', 'nebraska': '#D00000',
  'northwestern': '#4E2A84', 'ohio state': '#BB0000', 'oregon': '#154733', 'penn state': '#041E42',
  'purdue': '#CEB888', 'rutgers': '#CC0033', 'ucla': '#2D68C4', 'usc': '#990000',
  'washington': '#4B2E83', 'wisconsin': '#C5050C',
  'arizona': '#CC0033', 'arizona state': '#8C1D40', 'baylor': '#154734', 'byu': '#002E5D',
  'cincinnati': '#E00122', 'colorado': '#CFB87C', 'houston': '#C8102E', 'iowa state': '#C8102E',
  'kansas': '#0051BA', 'kansas state': '#512888', 'oklahoma state': '#FF7300', 'tcu': '#4D1979',
  'texas tech': '#CC0000', 'ucf': '#BA9B37', 'utah': '#CC0000', 'west virginia': '#002855',
  'clemson': '#F56600', 'duke': '#003087', 'florida state': '#782F40', 'georgia tech': '#B3A369',
  'louisville': '#AD0000', 'miami': '#F47321', 'north carolina': '#7BAFD4', 'pittsburgh': '#003594',
  'notre dame': '#0C2340', 'smu': '#CC0000', 'syracuse': '#F76900', 'virginia': '#232D4B',
  'virginia tech': '#630031', 'wake forest': '#9E7E38', 'boston college': '#98002E',
  'stanford': '#8C1515', 'california': '#003262', 'north carolina state': '#CC0000',
};

function getTeamColor(teamId: string): string {
  return TEAM_COLORS[teamId?.toLowerCase()] || '#0050A0';
}

// Dynamically import the Leaflet map to avoid SSR issues
const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center bg-gray-50 rounded-lg" style={{ height: 500 }}>
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#0050A0] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-gray-500">Loading map...</p>
      </div>
    </div>
  ),
});

interface RecruitingMapProps {
  year: string;
  availableYears: number[];
  onYearChange: (year: string) => void;
}

export default function RecruitingMap({ year, availableYears, onYearChange }: RecruitingMapProps) {
  const [recruits, setRecruits] = useState<MapRecruit[]>([]);
  const [loading, setLoading] = useState(true);
  const [conferenceFilter, setConferenceFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [starsFilter, setStarsFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch recruits with coordinates sequentially
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    async function fetchAll() {
      const allRecruits: MapRecruit[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const res = await fetch(
          getApiPath(`api/cfb/recruits?year=${year}&source=composite&limit=200&page=${page}`),
          { signal: controller.signal }
        );
        const data = await res.json();
        const recruits = data.recruits || [];

        for (const r of recruits) {
          if (r.lat && r.lng) allRecruits.push(r);
        }

        hasMore = recruits.length === 200 && page < 10;
        page++;
      }

      return allRecruits;
    }

    fetchAll()
      .then(setRecruits)
      .catch(err => { if (err.name !== 'AbortError') console.error(err); })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [year]);

  // Filter teams by conference
  const conferenceTeamIds = useMemo(() => {
    if (!conferenceFilter) return null;
    return new Set(allTeams.filter(t => t.conference === conferenceFilter).map(t => t.id.toLowerCase()));
  }, [conferenceFilter]);

  // Filtered recruits
  const filteredRecruits = useMemo(() => {
    let filtered = recruits;

    if (conferenceFilter && conferenceTeamIds) {
      filtered = filtered.filter(r => {
        if (!r.committedTo) return false;
        const ct = r.committedTo.toLowerCase();
        for (const id of conferenceTeamIds) {
          if (ct === id || ct.startsWith(id + ' ')) return true;
        }
        return false;
      });
    }

    if (teamFilter) {
      const tf = teamFilter.toLowerCase();
      filtered = filtered.filter(r => {
        if (!r.committedTo) return false;
        const ct = r.committedTo.toLowerCase();
        return ct === tf || ct.startsWith(tf + ' ');
      });
    }

    if (positionFilter) {
      filtered = filtered.filter(r => r.position === positionFilter);
    }

    if (starsFilter) {
      const s = parseInt(starsFilter);
      filtered = filtered.filter(r => r.stars === s);
    }

    if (statusFilter === 'committed') {
      filtered = filtered.filter(r => r.commitStatus === 'committed');
    } else if (statusFilter === 'uncommitted') {
      filtered = filtered.filter(r => r.commitStatus !== 'committed');
    }

    return filtered;
  }, [recruits, conferenceFilter, conferenceTeamIds, teamFilter, positionFilter, starsFilter, statusFilter]);

  // Available teams for filter
  const teamsWithCommits = useMemo(() => {
    const teamSet = new Set<string>();
    recruits.forEach(r => { if (r.committedTo) teamSet.add(r.committedTo.toLowerCase()); });
    return allTeams
      .filter(t => {
        const id = t.id.toLowerCase();
        if (teamSet.has(id)) return true;
        for (const ct of teamSet) {
          if (ct === id || ct.startsWith(id + ' ')) return true;
        }
        return false;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [recruits]);

  // Stats
  const stats = useMemo(() => ({
    total: filteredRecruits.length,
    committed: filteredRecruits.filter(r => r.commitStatus === 'committed').length,
    fiveStars: filteredRecruits.filter(r => r.stars >= 5).length,
    fourStars: filteredRecruits.filter(r => r.stars === 4).length,
  }), [filteredRecruits]);

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-900">Recruiting Map</h2>
        <div className="flex gap-2 items-center">
          <select
            value={year}
            onChange={e => onYearChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] cursor-pointer"
          >
            {availableYears.map(y => (
              <option key={y} value={y}>Class of {y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <select
            value={conferenceFilter}
            onChange={e => { setConferenceFilter(e.target.value); setTeamFilter(''); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] cursor-pointer"
          >
            <option value="">All Conferences</option>
            {FBS_CONFERENCES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={teamFilter}
            onChange={e => setTeamFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] cursor-pointer"
          >
            <option value="">All Teams</option>
            {teamsWithCommits.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <select
            value={positionFilter}
            onChange={e => setPositionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] cursor-pointer"
          >
            <option value="">All Positions</option>
            {['ATH','QB','RB','WR','TE','OL','DT','EDGE','LB','CB','SAF','K','P'].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            value={starsFilter}
            onChange={e => setStarsFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] cursor-pointer"
          >
            <option value="">All Stars</option>
            <option value="5">5★ Only</option>
            <option value="4">4★ Only</option>
            <option value="3">3★ Only</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="committed">Committed</option>
            <option value="uncommitted">Uncommitted</option>
          </select>

          <button
            onClick={() => { setConferenceFilter(''); setTeamFilter(''); setPositionFilter(''); setStarsFilter(''); setStatusFilter(''); }}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm text-center">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Mapped</div>
          <div className="text-xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm text-center">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Committed</div>
          <div className="text-xl font-bold text-green-600">{stats.committed}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm text-center">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">5-Star</div>
          <div className="text-xl font-bold text-yellow-600">{stats.fiveStars}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm text-center">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">4-Star</div>
          <div className="text-xl font-bold text-[#0050A0]">{stats.fourStars}</div>
        </div>
      </div>

      {/* Map */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center" style={{ height: 500 }}>
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#0050A0] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-gray-500">Loading recruit locations...</p>
          </div>
        </div>
      ) : (
        <LeafletMap recruits={filteredRecruits} getTeamColor={getTeamColor} getTeamLogo={getTeamLogo} />
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-3 px-1">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <div className="w-4 h-4 rounded-full border-1.5 border-gray-300 bg-white flex items-center justify-center overflow-hidden">
            <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>
          </div>
          <span>Committed (team logo)</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <div className="w-3 h-3 rounded-full bg-gray-400 opacity-40"></div>
          <span>Uncommitted</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <div className="w-4 h-4 rounded-full border-2 border-yellow-400 bg-white"></div>
          <span>5★ Recruit</span>
        </div>
        <span className="text-xs text-gray-400">
          {recruits.length > 0 ? `${recruits.length} recruits with coordinates` : ''}
          {' · Scroll to zoom · Drag to pan'}
        </span>
      </div>
    </>
  );
}
