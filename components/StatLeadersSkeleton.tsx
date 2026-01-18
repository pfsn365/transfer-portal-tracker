export default function StatLeadersSkeleton() {
  return (
    <>
      {/* Stat Group Tabs Skeleton */}
      <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-200">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-shrink-0 px-6 py-3 border-b-2 border-transparent">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Category Selection Skeleton */}
        <div className="p-4 bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-9 w-20 bg-gray-200 rounded-full animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      {/* Leaders Table Skeleton */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="bg-[#800000] px-6 py-4">
          <div className="h-6 w-40 bg-white/30 rounded animate-pulse" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="pl-6 pr-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">
                  Rank
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Player
                </th>
                <th className="hidden sm:table-cell px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">
                  Pos
                </th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Team
                </th>
                <th className="hidden lg:table-cell px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">
                  Class
                </th>
                <th className="hidden lg:table-cell px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">
                  GP
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {[...Array(15)].map((_, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="pl-6 pr-4 py-4">
                    <div className="h-6 w-6 bg-gray-200 rounded-full animate-pulse" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                      <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-4 text-center">
                    <div className="h-6 w-10 bg-gray-200 rounded animate-pulse mx-auto" />
                  </td>
                  <td className="hidden md:table-cell px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </td>
                  <td className="hidden lg:table-cell px-4 py-4 text-center">
                    <div className="h-4 w-6 bg-gray-200 rounded animate-pulse mx-auto" />
                  </td>
                  <td className="hidden lg:table-cell px-4 py-4 text-center">
                    <div className="h-4 w-6 bg-gray-200 rounded animate-pulse mx-auto" />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="h-5 w-12 bg-gray-200 rounded animate-pulse ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
