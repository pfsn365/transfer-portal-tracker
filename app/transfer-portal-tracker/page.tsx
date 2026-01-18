import { Metadata } from 'next';
import TransferPortalClient from './TransferPortalClient';

export const metadata: Metadata = {
  title: 'CFB Transfer Portal Tracker 2025 | College Football Transfers',
  description: 'Track every college football transfer in real-time. Filter by status, school, position, class, and conference. The most comprehensive CFB transfer portal database.',
  keywords: [
    'CFB Transfer Portal',
    'College Football Transfer Portal',
    'Transfer Portal Tracker',
    'CFB Transfers',
    'NCAA Transfer Portal',
    'College Football Recruiting',
    'Transfer Portal News',
    'CFB Portal',
  ],
  openGraph: {
    title: 'CFB Transfer Portal Tracker 2025 | College Football Transfers',
    description: 'Track every college football transfer in real-time. Filter by status, school, position, class, and conference.',
    url: 'https://profootballnetwork.com/cfb-hq/transfer-portal-tracker',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CFB Transfer Portal Tracker 2025 | College Football Transfers',
    description: 'Track every college football transfer in real-time. The most comprehensive CFB transfer portal database.',
  },
  alternates: {
    canonical: 'https://profootballnetwork.com/cfb-hq/transfer-portal-tracker',
  },
};

export default function TransferPortalPage() {
  return <TransferPortalClient />;
}
