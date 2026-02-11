export default function StandingsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(4)].map((_, confIndex) => (
        <div
          key={confIndex}
          className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200"
        >
          {/* Conference Header Skeleton */}
          <div className="px-4 py-3 border-b border-gray-200" style={{ backgroundColor: '#800000' }}>
            <div className="h-5 w-24 bg-white/30 rounded animate-pulse" />
          </div>

          {/* Standings Table Skeleton */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    Team
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-semibold text-gray-600">
                    Conf
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-semibold text-gray-600">
                    Overall
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-semibold text-gray-600 hidden md:table-cell">
                    Home
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-semibold text-gray-600 hidden md:table-cell">
                    Away
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-semibold text-gray-600 hidden sm:table-cell">
                    Streak
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...Array(8)].map((_, teamIndex) => (
                  <tr key={teamIndex} className={teamIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                        <div className="w-7 h-7 bg-gray-200 rounded-full animate-pulse" />
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <div className="h-4 w-8 bg-gray-200 rounded animate-pulse mx-auto" />
                    </td>
                    <td className="px-2 py-3 text-center">
                      <div className="h-4 w-8 bg-gray-200 rounded animate-pulse mx-auto" />
                    </td>
                    <td className="px-2 py-3 text-center hidden md:table-cell">
                      <div className="h-4 w-8 bg-gray-200 rounded animate-pulse mx-auto" />
                    </td>
                    <td className="px-2 py-3 text-center hidden md:table-cell">
                      <div className="h-4 w-8 bg-gray-200 rounded animate-pulse mx-auto" />
                    </td>
                    <td className="px-2 py-3 text-center hidden sm:table-cell">
                      <div className="h-4 w-8 bg-gray-200 rounded animate-pulse mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
