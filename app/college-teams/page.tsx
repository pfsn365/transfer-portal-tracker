'use client';

import Link from 'next/link';
import Image from 'next/image';
import { allTeams, getAllConferences, getTeamsByConference } from '@/data/teams';
import { getTeamLogo } from '@/utils/teamLogos';
import Header from '@/components/Header';

export default function CollegeDirectory() {
  const conferences = getAllConferences();

  return (
    <main className="min-h-screen bg-gray-50">
      <Header
        playerCount={0}
        totalCount={0}
      />

      {/* Raptive Header Ad */}
      <div className="container mx-auto px-4 min-h-[150px]">
        <div className="raptive-pfn-header"></div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {/* Transfer Portal Button */}
        <Link
          href="/"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium mb-4"
        >
          Transfer Portal
        </Link>

        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            College Football Teams
          </h2>
          <p className="text-gray-600">
            View transfer portal activity for any FBS team
          </p>
        </div>

        {/* Teams organized by conference */}
        {conferences.map(conference => {
          const teams = getTeamsByConference(conference);

          return (
            <div key={conference} className="mb-8">
              <h3 className="text-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 mb-4 px-4 py-3 rounded-lg shadow-md">
                {conference}
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {teams.map(team => (
                  <Link
                    key={team.slug}
                    href={`/college-teams/${team.slug}`}
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
          );
        })}
      </div>
    </main>
  );
}
