'use client';

import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';
import PFNHeader from '@/components/PFNHeader';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gray-50">
      <PFNHeader />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-100 mb-8">
          <span className="text-5xl font-bold text-red-600">404</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
          Page Not Found
        </h1>

        <p className="text-lg sm:text-xl text-gray-600 mb-10">
          Sorry, we couldn't find the page you're looking for. It may have been moved or deleted.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors min-w-[200px] justify-center"
          >
            <Home className="w-5 h-5" />
            Go to Homepage
          </Link>

          <Link
            href="/teams"
            className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 transition-colors min-w-[200px] justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
            Browse Teams
          </Link>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Looking for something specific?{' '}
            <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium underline">
              Search the transfer portal
            </Link>
            {' '}or{' '}
            <Link href="/teams" className="text-blue-600 hover:text-blue-700 font-medium underline">
              browse all teams
            </Link>
            .
          </p>
        </div>
      </div>

      <Footer currentPage="CFB" />
    </main>
  );
}
