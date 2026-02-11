'use client';

import { useMemo, useEffect, useRef } from 'react';
import { Team } from '@/data/teams';

interface CFBNavigationTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  team: Team;
  teamColor: string;
}

export default function CFBNavigationTabs({ activeTab, onTabChange, team, teamColor }: CFBNavigationTabsProps) {
  const navRef = useRef<HTMLElement>(null);
  const activeLinkRef = useRef<HTMLAnchorElement>(null);

  const tabs = useMemo(() => [
    { id: 'overview', label: 'Overview' },
    { id: 'transfers', label: 'Transfer Portal' },
    { id: 'roster', label: 'Roster' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'stats', label: 'Stats' },
    { id: 'history', label: 'Record by Year' },
    { id: 'draft', label: 'NFL Draft History' },
  ], []);

  // Scroll active tab into view when activeTab changes
  useEffect(() => {
    if (activeLinkRef.current && navRef.current) {
      const link = activeLinkRef.current;
      const nav = navRef.current;

      requestAnimationFrame(() => {
        const linkRect = link.getBoundingClientRect();
        const navRect = nav.getBoundingClientRect();
        const linkLeft = linkRect.left - navRect.left + nav.scrollLeft;
        const linkRight = linkLeft + linkRect.width;
        const navWidth = nav.clientWidth;

        if (linkLeft < nav.scrollLeft) {
          nav.scrollTo({
            left: linkLeft - 20,
            behavior: 'auto'
          });
        } else if (linkRight > nav.scrollLeft + navWidth) {
          nav.scrollTo({
            left: linkRight - navWidth + 20,
            behavior: 'auto'
          });
        }
      });
    }
  }, [activeTab]);

  return (
    <div
      className="bg-white border-b border-gray-200 shadow-sm sticky top-[48px] lg:top-0 z-20"
      style={{
        contain: 'layout style paint',
        contentVisibility: 'auto',
        containIntrinsicSize: '0 48px'
      }}
    >
      <div className="container mx-auto px-4">
        <nav ref={navRef} className="flex space-x-8 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <a
              key={tab.id}
              ref={activeTab === tab.id ? activeLinkRef : null}
              href={tab.id === 'overview' ? `/teams/${team.slug}/` : `/teams/${team.slug}/${tab.id}/`}
              onClick={(e) => {
                e.preventDefault();
                onTabChange(tab.id);
              }}
              className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors will-change-auto cursor-pointer ${
                activeTab === tab.id
                  ? 'border-transparent'
                  : 'border-transparent text-gray-600 hover:text-gray-700 hover:border-gray-300'
              }`}
              style={{
                contain: 'layout style',
                transform: 'translateZ(0)',
                ...(activeTab === tab.id && teamColor ? {
                  borderBottomColor: teamColor,
                  color: teamColor
                } : {})
              }}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              role="tab"
            >
              {tab.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
