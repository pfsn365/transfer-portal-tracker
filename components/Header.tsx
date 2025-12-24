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
    <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white shadow-lg">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">
          CFB Transfer Portal Tracker
        </h1>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm sm:text-base text-blue-100">
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
