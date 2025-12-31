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
    type: 'website',
    title: 'College Football Transfer Portal Tracker - Real-Time CFB Transfers',
    description: 'The most comprehensive CFB transfer portal tracker with live updates. Filter by status, school, position, class, and conference.',
    url: 'https://www.profootballnetwork.com/cfb-hq/transfer-portal-tracker',
    images: [
      {
        url: 'https://statico.profootballnetwork.com/wp-content/uploads/2025/12/31161231/fcs-fbs-12-31-25.png',
        width: 1200,
        height: 630,
        alt: 'College Football Transfer Portal Tracker',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'College Football Transfer Portal Tracker - Real-Time CFB Transfers',
    description: 'The most comprehensive CFB transfer portal tracker with live updates. Filter by status, school, position, class, and conference.',
    images: ['https://statico.profootballnetwork.com/wp-content/uploads/2025/12/31161231/fcs-fbs-12-31-25.png'],
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
