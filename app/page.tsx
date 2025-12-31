import Link from 'next/link';
import PFNHeader from '@/components/PFNHeader';
import Footer from '@/components/Footer';
import CFBPlayoffBracket from '@/components/CFBPlayoffBracket';
import CFBScheduleWidget from '@/components/CFBScheduleWidget';

export default function CFBHQPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <PFNHeader />

      {/* Hero Section */}
      <div className="text-white h-[132px] flex items-center justify-center" style={{ backgroundColor: '#800000' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">
            College Football HQ
          </h1>
          <p className="text-lg sm:text-xl text-gray-200">
            Your destination for college football tools and data
          </p>
        </div>
      </div>

      {/* Raptive Header Ad */}
      <div className="container mx-auto px-4 min-h-[110px]">
        <div className="raptive-pfn-header-90"></div>
      </div>

      {/* Playoff Bracket & Schedule Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col lg:flex-row gap-6 justify-center lg:items-stretch">
          <div className="shrink-0">
            <CFBPlayoffBracket />
          </div>
          <div className="w-full lg:flex-1 lg:max-w-[400px]">
            <CFBScheduleWidget />
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-10">
          Tools & Resources
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Transfer Portal Tracker */}
          <Link
            href="/transfer-portal-tracker"
            className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200"
          >
            <div className="p-6">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                <svg
                  className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                Transfer Portal Tracker
              </h3>
              <p className="text-gray-600">
                Track every player in the college football transfer portal. Filter by position, school, conference, and more.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 group-hover:bg-blue-50 transition-colors">
              <span className="text-blue-600 font-medium flex items-center gap-2">
                Explore Tracker
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </Link>

          {/* Placeholder for future tools */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 opacity-60">
            <div className="p-6">
              <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                <svg
                  className="w-7 h-7 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-500 mb-2">
                More Tools Coming Soon
              </h3>
              <p className="text-gray-400">
                Stay tuned for more college football tools and resources.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <span className="text-gray-400 font-medium">Coming Soon</span>
            </div>
          </div>
        </div>
      </div>

      <Footer currentPage="CFB" />
    </main>
  );
}
