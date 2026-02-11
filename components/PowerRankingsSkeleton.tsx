export default function PowerRankingsSkeleton() {
  return (
    <>
      {/* Conference Selector Skeleton */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mr-2" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-8 w-16 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-3 w-64 bg-gray-200 rounded animate-pulse mt-2" />
      </div>

      {/* Rankings Table Skeleton */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2 justify-between items-center">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="w-12 px-2 py-3 text-center text-xs font-semibold text-gray-600">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Team
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 hidden sm:table-cell">
                  Record
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 hidden md:table-cell">
                  Conference
                </th>
                <th className="w-24 px-2 py-3 text-center text-xs font-semibold text-gray-600 hidden sm:table-cell">
                  Move
                </th>
              </tr>
            </thead>
            <tbody>
              {[...Array(25)].map((_, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="w-12 px-2 py-3 text-center">
                    <div className="h-6 w-6 bg-gray-200 rounded animate-pulse mx-auto" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <div className="h-4 w-10 bg-gray-200 rounded animate-pulse mx-auto" />
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <div className="h-5 w-16 bg-gray-200 rounded animate-pulse mx-auto" />
                  </td>
                  <td className="w-24 px-2 py-3 text-center hidden sm:table-cell">
                    <div className="flex justify-center gap-1">
                      <div className="h-7 w-7 bg-gray-200 rounded animate-pulse" />
                      <div className="h-7 w-7 bg-gray-200 rounded animate-pulse" />
                    </div>
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
