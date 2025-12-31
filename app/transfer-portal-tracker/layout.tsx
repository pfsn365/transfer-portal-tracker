import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'College Football Transfer Portal Tracker',
  description: 'The most comprehensive CFB transfer portal tracker with live updates. Filter by status, school, position, class, and conference.',
  keywords: [
    'CFB Transfer Portal',
    'College Football Transfer Portal',
    'Transfer Portal Tracker',
    'NCAA Transfer Portal',
    'College Football Transfers',
    'CFB Transfers',
    'Transfer Portal News',
  ],
  openGraph: {
    title: 'College Football Transfer Portal Tracker - Real-Time CFB Transfers',
    description: 'The most comprehensive CFB transfer portal tracker with live updates. Filter by status, school, position, class, and conference.',
    url: 'https://www.profootballnetwork.com/cfb-hq/transfer-portal-tracker',
  },
  twitter: {
    title: 'College Football Transfer Portal Tracker - Real-Time CFB Transfers',
    description: 'The most comprehensive CFB transfer portal tracker with live updates. Filter by status, school, position, class, and conference.',
  },
  alternates: {
    canonical: 'https://www.profootballnetwork.com/cfb-hq/transfer-portal-tracker',
  },
};

export default function TransferPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
