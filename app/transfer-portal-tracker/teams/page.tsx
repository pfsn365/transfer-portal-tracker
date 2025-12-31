'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { allTeams, getAllConferences, getTeamsByConference } from '@/data/teams';
import { getTeamLogo } from '@/utils/teamLogos';
import Header from '@/components/Header';
import PFNHeader from '@/components/PFNHeader';
import Footer from '@/components/Footer';
import { Search } from 'lucide-react';

export default function CollegeDirectory() {
  const conferences = getAllConferences();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter teams based on search query
  const filteredConferences = useMemo(() => {
    if (!searchQuery.trim()) {
      return conferences.map(conference => ({
        conference,
        teams: getTeamsByConference(conference)
      }));
    }

    const query = searchQuery.toLowerCase();
    return conferences
      .map(conference => {
        const teams = getTeamsByConference(conference).filter(team =>
          team.name.toLowerCase().includes(query) ||
          team.id.toLowerCase().includes(query)
        );
        return { conference, teams };
      })
      .filter(item => item.teams.length > 0);
  }, [conferences, searchQuery]);

  return (
    <main className="min-h-screen bg-gray-50" style={{ touchAction: 'manipulation' }}>
      <PFNHeader />
      <Header
        playerCount={0}
        totalCount={0}
      />

      {/* Raptive Header Ad */}
      <div className="container mx-auto px-4 min-h-[110px]">
        <div className="raptive-pfn-header-90"></div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-2 text-sm sm:text-base">
            <li>
              <Link
                href="/transfer-portal-tracker"
                className="inline-flex items-center min-h-[44px] py-2 hover:underline transition-colors touch-manipulation"
                style={{ color: '#800000' }}
                aria-label="Go to Transfer Portal Tracker home"
              >
                Transfer Portal
              </Link>
            </li>
            <li aria-hidden="true" style={{ color: '#800000' }}>
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </li>
            <li>
              <span
                className="inline-flex items-center min-h-[44px] py-2 font-semibold"
                style={{ color: '#800000' }}
                aria-current="page"
              >
                Teams
              </span>
            </li>
          </ol>
        </nav>

        {/* Page Header Card */}
        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            College Football Teams
          </h1>
          <p className="text-gray-600 text-lg mb-6">
            Browse transfer portal pages by team
          </p>

          {/* Quick Search */}
          <div className="relative max-w-xl">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-900 placeholder-gray-500"
              aria-label="Search for a team"
            />
          </div>
        </div>

        {/* Teams organized by conference */}
        {filteredConferences.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">
              No teams found matching "{searchQuery}"
            </p>
          </div>
        ) : (
          filteredConferences.map(({ conference, teams }) => (
            <div key={conference} className="mb-8">
              <h3 className="text-2xl font-bold text-white mb-4 px-4 py-3 rounded-lg shadow-md" style={{ backgroundColor: '#800000' }}>
                {conference}
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {teams.map(team => (
                  <Link
                    key={team.slug}
                    href={`/transfer-portal-tracker/teams/${team.slug}`}
                    className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow group"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="relative h-16 w-16 mb-3">
                        <Image
                          src={getTeamLogo(team.id)}
                          alt={`${team.name} logo`}
                          fill
                          sizes="64px"
                          className="object-contain group-hover:scale-110 transition-transform"
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {team.name}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <Footer currentPage="CFB" />
    </main>
  );
}
