import Footer from '@/components/Footer';

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Footer currentPage="CFB" />
    </>
  );
}
