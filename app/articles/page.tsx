import type { Metadata } from 'next';
import ArticlesClient from './ArticlesClient';

export const metadata: Metadata = {
  title: 'CFB Articles & News',
  description: 'Latest college football articles, analysis, and news from PFSN.',
};

export default function ArticlesPage() {
  return <ArticlesClient />;
}
