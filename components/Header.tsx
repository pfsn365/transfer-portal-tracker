export default function Header() {
  return (
    <header
      className="text-white shadow-lg"
      style={{
        background: 'linear-gradient(180deg, #800000 0%, #600000 100%)',
        boxShadow: 'inset 0 -30px 40px -30px rgba(0,0,0,0.15), 0 4px 6px -1px rgba(0,0,0,0.1)'
      }}
    >
      <div className="container mx-auto px-4 pt-6 sm:pt-7 md:pt-8 lg:pt-10 pb-5 sm:pb-6 md:pb-7 lg:pb-8">
        <h1 className="text-4xl lg:text-5xl font-extrabold mb-2">
          CFB Transfer Portal Tracker
        </h1>
        <p className="text-lg opacity-90 font-medium">
          Track every college football transfer with real-time updates and verified data
        </p>
      </div>
    </header>
  );
}
