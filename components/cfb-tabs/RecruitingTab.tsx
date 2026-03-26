'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { Team } from '@/data/teams';
import { fetcher } from '@/utils/swr';

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
  nationalRank: number;
  imageUrl: string;
  committedSchoolLogo?: string;
  committedTo?: string;
  status: string;
  commitStatus: string;
  source: string;
}

interface RecruitingTabProps {
  team: Team;
  teamColor: string;
}

function StarRating({ stars }: { stars: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg
          key={i}
          className={`w-3 h-3 ${i <= stars ? 'text-yellow-400' : 'text-gray-200'}`}
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
      <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-semibold text-gray-500">{initials}</span>
      </div>
    );
  }

  return (
    <img
      src={recruit.imageUrl}
      alt={recruit.name}
      className="w-9 h-9 rounded-full object-cover bg-gray-100 flex-shrink-0"
      onError={() => setError(true)}
    />
  );
}

// Default to current recruiting cycle year (shifts in February)
const DEFAULT_YEAR = new Date().getMonth() < 2
  ? new Date().getFullYear()
  : new Date().getFullYear() + 1;

export default function RecruitingTab({ team, teamColor }: RecruitingTabProps) {
  const [year, setYear] = useState(String(DEFAULT_YEAR));

  const { data, error, isLoading: loading } = useSWR(
    `/cfb-hq/api/cfb/recruits?year=${year}&source=composite&limit=200&team=${encodeURIComponent(team.id)}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300000 }
  );

  const recruits: Recruit[] = data?.recruits || [];
  const availableYears: number[] = data?.availableYears || [];

  // Summary stats
  const { totalCommits, avgStars, starCounts, topStarTier, topStarLabel, topPosition } = useMemo(() => {
    const total = recruits.length;
    const avg = total > 0
      ? recruits.reduce((sum, r) => sum + (r.stars || 0), 0) / total
      : 0;

    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    recruits.forEach(r => { if (r.stars >= 1 && r.stars <= 5) counts[r.stars]++; });
    const tier = [5, 4, 3, 2, 1].find(s => counts[s] > 0) || 0;
    const label = tier === 5 ? 'Five-Stars' : tier === 4 ? 'Four-Stars' : tier === 3 ? 'Three-Stars' : tier === 2 ? 'Two-Stars' : 'One-Stars';

    const posCounts: Record<string, number> = {};
    recruits.forEach(r => { posCounts[r.position] = (posCounts[r.position] || 0) + 1; });
    const topPos = Object.entries(posCounts).sort((a, b) => b[1] - a[1])[0];

    return { totalCommits: total, avgStars: avg, starCounts: counts, topStarTier: tier, topStarLabel: label, topPosition: topPos };
  }, [recruits]);

  return (
    <div>
      {/* Year Selector */}
      <div className="flex items-center justify-end mb-6">
        <select
          value={year}
          onChange={e => setYear(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] cursor-pointer"
        >
          {(availableYears.length > 0 ? availableYears : [DEFAULT_YEAR + 2, DEFAULT_YEAR + 1, DEFAULT_YEAR, DEFAULT_YEAR - 1, DEFAULT_YEAR - 2]).map(y => (
            <option key={y} value={y}>Class of {y}</option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      {!loading && totalCommits > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold tabular-nums" style={{ color: teamColor }}>
              {avgStars.toFixed(1)}★
            </div>
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">
              Avg Star Rating
            </div>
            <div className="text-sm text-gray-400 mt-0.5">{totalCommits} commits</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold tabular-nums" style={{ color: teamColor }}>
              {starCounts[topStarTier]}
            </div>
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">
              {topStarLabel}
            </div>
            <div className="text-sm text-gray-400 mt-0.5">highest tier</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold tabular-nums" style={{ color: teamColor }}>
              {topPosition ? topPosition[1] : 0} {topPosition ? topPosition[0] + 's' : ''}
            </div>
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">
              Position Focus
            </div>
            <div className="text-sm text-gray-400 mt-0.5">most recruited</div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          Failed to load recruiting data. Please try again later.
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      )}

      {/* Recruits Table */}
      {!loading && totalCommits > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: teamColor }} className="text-white">
                <th className="px-3 py-3 text-center font-semibold w-12">Rank</th>
                <th className="px-3 py-3 text-left font-semibold">Recruit</th>
                <th className="px-3 py-3 text-center font-semibold">Pos</th>
                <th className="px-3 py-3 text-center font-semibold">Stars</th>
                <th className="px-3 py-3 text-left font-semibold hidden md:table-cell">High School</th>
                <th className="px-3 py-3 text-left font-semibold hidden lg:table-cell">Location</th>
                <th className="px-3 py-3 text-center font-semibold hidden sm:table-cell">Height</th>
                <th className="px-3 py-3 text-center font-semibold hidden sm:table-cell">Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recruits.map((recruit, idx) => (
                <tr
                  key={`${recruit.id}-${idx}`}
                  className={`hover:bg-blue-50 transition-colors ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                >
                  <td className="px-3 py-3 text-center tabular-nums text-gray-500 font-medium">
                    {recruit.nationalRank || idx + 1}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && totalCommits === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium mb-2">No recruiting data available for Class of {year}</p>
          <p className="text-sm">Try selecting a different year, or visit the <Link href="/recruiting" className="text-[#0050A0] hover:underline">Recruiting Hub</Link> for all recruits.</p>
        </div>
      )}
    </div>
  );
}
