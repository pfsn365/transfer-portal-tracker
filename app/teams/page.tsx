import { Metadata } from 'next';
import TeamsListClient from './TeamsListClient';

export const metadata: Metadata = {
  title: 'Browse All FBS Teams | CFB HQ',
  description: 'Browse all FBS college football teams. View team rosters, schedules, stats, transfer portal activity, and standings.',
};

export default function TeamsPage() {
  return <TeamsListClient />;
}
