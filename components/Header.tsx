interface HeaderProps {
  playerCount: number;
  totalCount: number;
  lastUpdated?: string;
}

export default function Header({ playerCount, totalCount, lastUpdated }: HeaderProps) {
  const formattedDate = lastUpdated
    ? new Date(lastUpdated).toLocaleString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Chicago',
        timeZoneName: 'short'
      })
    : 'Loading...';

  return (
    <div className="text-white shadow-lg" style={{ backgroundColor: '#0050A0' }}>
      <div className="max-w-[1600px] mx-auto px-4 py-3 sm:py-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1">
          CFB Transfer Portal Tracker
        </h1>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm lg:text-base text-white/90">
          <p>
            Latest update includes announced and verified entries: {formattedDate}
          </p>
          <p className="font-semibold">
            Showing {playerCount} of {totalCount} Players
          </p>
        </div>
      </div>
    </div>
  );
}
