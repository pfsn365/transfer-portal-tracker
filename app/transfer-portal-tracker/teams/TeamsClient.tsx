'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAllConferences, getTeamsByConference } from '@/data/teams';
import { getTeamLogo } from '@/utils/teamLogos';
import CFBSidebar from '@/components/CFBSidebar';
import Footer from '@/components/Footer';
import { Search } from 'lucide-react';

export default function TeamsClient() {
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
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <div className="fixed top-0 left-0 w-64 h-screen z-10">
          <CFBSidebar />
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20">
        <CFBSidebar isMobile={true} />
      </div>

      <main className="flex-1 lg:ml-64 min-w-0 mt-[48px] lg:mt-0" style={{ touchAction: 'manipulation' }}>
        {/* Hero Section */}
        <div className="bg-[#800000] text-white pb-4 lg:pb-6">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3">
              Browse All Teams
            </h1>
            <p className="text-base sm:text-lg lg:text-xl xl:text-2xl opacity-90">
              Browse transfer portal pages by team
            </p>
          </div>
        </div>

        {/* Raptive Header Ad */}
        <div className="container mx-auto px-4 min-h-[110px]">
          <div className="raptive-pfn-header-90"></div>
        </div>

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-8">
            <div className="relative max-w-xl">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-500" />
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
    </div>
  );
}
