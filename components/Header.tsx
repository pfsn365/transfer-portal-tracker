interface HeaderProps {
  playerCount: number;
  totalCount: number;
  lastUpdated?: string;
}

export default function Header({
  playerCount,
  totalCount,
  lastUpdated,
}: HeaderProps) {
  return (
    <div className="text-white shadow-lg" style={{ backgroundColor: '#800000' }}>
      <div className="max-w-[1600px] mx-auto px-4 py-4 sm:py-6 text-center">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3">
            College Football Transfer Portal Tracker
          </h1>
          <p className="text-sm sm:text-base text-white/90">
            Track every college football transfer with real-time updates, advanced filtering, and verified data
          </p>
        </div>
      </div>
    </div>
  );
}
