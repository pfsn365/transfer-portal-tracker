'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAllConferences, getTeamsByConference } from '@/data/teams';
import { getTeamLogo } from '@/utils/teamLogos';
import Footer from '@/components/Footer';
import { Search } from 'lucide-react';

// FBS conferences only
const FBS_CONFERENCES = ['SEC', 'Big Ten', 'Big 12', 'ACC', 'American', 'Mountain West', 'Sun Belt', 'Conference USA', 'MAC', 'Pac-12', 'Independent'];

export default function TeamsListClient() {
  const allConferences = getAllConferences();
  // Filter to FBS conferences only
  const fbsConferences = allConferences.filter(conf => FBS_CONFERENCES.includes(conf));
  const [searchQuery, setSearchQuery] = useState('');

  // Filter teams based on search query
  const filteredConferences = useMemo(() => {
    if (!searchQuery.trim()) {
      return fbsConferences.map(conference => ({
        conference,
        teams: getTeamsByConference(conference)
      }));
    }

    const query = searchQuery.toLowerCase();
    return fbsConferences
      .map(conference => {
        const teams = getTeamsByConference(conference).filter(team =>
          team.name.toLowerCase().includes(query) ||
          team.id.toLowerCase().includes(query)
        );
        return { conference, teams };
      })
      .filter(item => item.teams.length > 0);
  }, [fbsConferences, searchQuery]);

  return (
    <div style={{ touchAction: 'manipulation' }}>
        {/* Hero Section */}
        <header
          className="text-white shadow-lg"
          style={{
            background: 'linear-gradient(180deg, #800000 0%, #600000 100%)',
            boxShadow: 'inset 0 -30px 40px -30px rgba(0,0,0,0.15), 0 4px 6px -1px rgba(0,0,0,0.1)'
          }}
        >
          <div className="container mx-auto px-4 pt-6 sm:pt-7 md:pt-8 lg:pt-10 pb-5 sm:pb-6 md:pb-7 lg:pb-8">
            <h1 className="text-4xl lg:text-5xl font-extrabold mb-2">
              Browse All FBS Teams
            </h1>
            <p className="text-lg opacity-90 font-medium">
              View team rosters, schedules, stats, and transfer portal activity
            </p>
          </div>
        </header>

        {/* Raptive Header Ad */}
        <div className="container mx-auto px-4 min-h-[110px]">
          <div className="raptive-pfn-header-90"></div>
        </div>

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">FBS Teams by Conference</h2>
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
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-transparent bg-gray-50 text-gray-900 placeholder-gray-500"
                aria-label="Search for a team"
              />
            </div>
          </div>

          {/* Teams organized by conference */}
          {filteredConferences.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg">
                No teams found matching &quot;{searchQuery}&quot;
              </p>
            </div>
          ) : (
            filteredConferences.map(({ conference, teams }) => (
              <div key={conference} className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4 px-4 py-3 rounded-lg shadow-md bg-[#800000]">
                  {conference}
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {teams.map(team => (
                    <Link
                      key={team.slug}
                      href={`/teams/${team.slug}`}
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
                        <span className="text-sm font-semibold text-gray-900 group-hover:text-[#800000] transition-colors">
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
    </div>
  );
}
