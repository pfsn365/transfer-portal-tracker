'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { allTeams } from '@/data/teams';
import { Search, ArrowLeft, Home } from 'lucide-react';
import PFNHeader from '@/components/PFNHeader';
import Footer from '@/components/Footer';

export default function TeamNotFound() {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter teams based on search
  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) {
      return allTeams.slice(0, 12); // Show first 12 teams by default
    }

    const query = searchQuery.toLowerCase();
    return allTeams
      .filter(team =>
        team.name.toLowerCase().includes(query) ||
        team.id.toLowerCase().includes(query) ||
        team.conference.toLowerCase().includes(query)
      )
      .slice(0, 12);
  }, [searchQuery]);

  return (
    <main className="min-h-screen bg-gray-50">
      <PFNHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 404 Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
            <span className="text-4xl font-bold text-red-600">404</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Team Not Found
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            The team page you're looking for doesn't exist. Try searching for a team below or browse all teams.
          </p>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Home className="w-5 h-5" />
              Go to Homepage
            </Link>

            <Link
              href="/teams"
              className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Browse All Teams
            </Link>
          </div>
        </div>

        {/* Team Search */}
        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Search for a Team
          </h2>

          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by team name, abbreviation, or conference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-900 placeholder-gray-500"
              autoFocus
            />
          </div>

          {/* Filtered Teams */}
          {filteredTeams.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                {searchQuery ? 'Search Results' : 'Popular Teams'}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredTeams.map(team => (
                  <Link
                    key={team.slug}
                    href={`/teams/${team.slug}`}
                    className="flex flex-col items-center text-center p-3 bg-gray-50 rounded-lg hover:bg-blue-50 hover:shadow-md transition-all group"
                  >
                    <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {team.name}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      {team.conference}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No teams found matching "{searchQuery}"
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-3 text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear search
              </button>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-sm text-gray-700">
            <strong>Need help?</strong> Browse all {allTeams.length} teams in our{' '}
            <Link href="/teams" className="text-blue-600 hover:text-blue-700 font-medium underline">
              teams directory
            </Link>
            {' '}or return to the{' '}
            <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium underline">
              main transfer portal tracker
            </Link>
            .
          </p>
        </div>
      </div>

      <Footer currentPage="CFB" />
    </main>
  );
}
