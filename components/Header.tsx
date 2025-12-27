interface HeaderProps {
  playerCount: number;
  totalCount: number;
  lastUpdated?: string;
  topPosition?: string;
  topPositionCount?: number;
  mostActiveConference?: string;
  mostActiveConferenceCount?: number;
}

export default function Header({
  playerCount,
  totalCount,
  lastUpdated,
  topPosition,
  topPositionCount,
  mostActiveConference,
  mostActiveConferenceCount
}: HeaderProps) {
  return (
    <div className="text-white shadow-lg" style={{ backgroundColor: '#0050A0' }}>
      <div className="max-w-[1600px] mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">
              CFB Transfer Portal Tracker
            </h1>
            <p className="text-sm sm:text-base text-white/90">
              Track every college football transfer with real-time updates, advanced filtering, and verified data
            </p>
          </div>

          {/* Stats - Desktop */}
          {totalCount > 0 && (
            <div className="hidden lg:flex items-center gap-4 text-sm whitespace-nowrap">
              <div className="flex items-center gap-4">
                <span className="font-semibold">{totalCount.toLocaleString()} Total</span>
                {topPosition && topPositionCount && (
                  <>
                    <span className="text-white/50">|</span>
                    <span>Top: <strong>{topPosition}</strong> ({topPositionCount})</span>
                  </>
                )}
                {mostActiveConference && mostActiveConferenceCount && (
                  <>
                    <span className="text-white/50">|</span>
                    <span>Active: <strong>{mostActiveConference}</strong> ({mostActiveConferenceCount} in)</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Stats - Mobile (just total) */}
          {totalCount > 0 && (
            <div className="lg:hidden text-sm text-white/90">
              {totalCount.toLocaleString()} players in portal
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
