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
      <div className="max-w-[1600px] mx-auto px-4 py-6 sm:py-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">
          CFB Transfer Portal Tracker
        </h1>
        <p className="text-sm sm:text-base text-white/90">
          Latest update includes announced and verified entries: {formattedDate}
        </p>
      </div>
    </div>
  );
}
