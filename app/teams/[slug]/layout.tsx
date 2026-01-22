import CFBSidebar from '@/components/CFBSidebar';
import Footer from '@/components/Footer';

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <div className="fixed top-0 left-0 w-64 h-screen z-10">
          <CFBSidebar />
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20">
        <CFBSidebar isMobile={true} />
      </div>

      <main className="flex-1 lg:ml-64 min-w-0 mt-[52px] lg:mt-0" style={{ touchAction: 'manipulation' }}>
        {children}
        <Footer currentPage="CFB" />
      </main>
    </div>
  );
}
