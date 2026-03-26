import type { Metadata } from 'next';
import PlayerRankingsClient from './PlayerRankingsClient';

export const metadata: Metadata = {
  title: 'Player Rankings Builder',
  description: 'Create your own college football player rankings. Drag and drop to rank top CFB players by position, then download and share.',
};

export default function PlayerRankingsBuilderPage() {
  return <PlayerRankingsClient />;
}
