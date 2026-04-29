'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface CFBSidebarProps {
  isMobile?: boolean;
}

interface NavItem {
  title: string;
  url: string;
  external: boolean;
}

const CFBSidebar: React.FC<CFBSidebarProps> = ({ isMobile = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const pathname = usePathname();

  // Auto-close mobile menu on navigation
  useEffect(() => {
    setIsExpanded(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobile && isExpanded) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isMobile, isExpanded]);

  const normalizePath = (path: string) => path.replace(/\/$/, '');
  const normalizedPathname = normalizePath(pathname);

  const isActivePage = (url: string) => {
    const normalizedUrl = normalizePath(url);
    const urlWithoutBase = normalizedUrl.replace(/^\/cfb-hq/, '');
    return normalizedPathname === urlWithoutBase || normalizedPathname === normalizedUrl;
  };

  const isHomePage = normalizedPathname === '' || normalizedPathname === '/' || normalizedPathname === '/cfb-hq';
  const isBrowseTeamsPage = isActivePage('/teams') || pathname.startsWith('/teams');

  // ── Grouped navigation sections ─────────────────────────────────────

  const navSections = [
    {
      label: 'Simulators & Tools',
      items: [
        { title: 'NFL Mock Draft Simulator', url: 'https://www.profootballnetwork.com/mockdraft', external: true },
        { title: 'Power Rankings Builder', url: '/power-rankings-builder', external: false },
      ],
    },
    {
      label: 'Season',
      items: [
        { title: 'CFB Articles', url: '/articles', external: false },
        { title: 'Spring Game Schedule', url: '/spring-games', external: false },
        { title: 'Schedule', url: '/schedule', external: false },
        { title: 'Standings', url: '/standings', external: false },
        { title: 'Rankings', url: '/rankings', external: false },
        { title: 'Stat Leaders', url: '/stat-leaders', external: false },
        { title: 'Player Pages', url: '/players', external: false },
        { title: 'Postseason HQ', url: '/postseason', external: false },
      ],
    },
    {
      label: 'History & Awards',
      items: [
        { title: 'Heisman Trophy History', url: '/heisman', external: false },
        { title: 'CFB Draft History', url: '/draft-history', external: false },
      ],
    },
    {
      label: 'Other Hubs',
      items: [
        { title: 'NFL Draft HQ', url: 'https://www.profootballnetwork.com/nfl-draft-hq', external: true },
        { title: 'NFL HQ', url: 'https://www.profootballnetwork.com/nfl-hq', external: true },
      ],
    },
  ];

  // ── Shared helpers ──────────────────────────────────────────────────

  const ExternalIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-3 h-3 opacity-50 flex-shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );

  const renderNavItem = (item: NavItem, closeMobile = false) => {
    const isActive = !item.external && isActivePage(item.url);
    const linkContent = (
      <span className="text-[13px] font-medium truncate flex items-center gap-2">
        {item.title}
        {item.external && <ExternalIcon />}
      </span>
    );

    return (
      <li key={item.title}>
        {!item.external ? (
          <Link
            href={item.url}
            onClick={closeMobile ? () => setIsExpanded(false) : undefined}
            className={`relative flex items-center px-3 py-1.5 mx-1 rounded-md transition-all duration-200 ${
              isActive
                ? 'bg-[#0050A0] text-white'
                : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
            }`}
          >
            {linkContent}
          </Link>
        ) : (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="relative flex items-center px-3 py-1.5 mx-1 rounded-md transition-all duration-200 text-gray-400 hover:bg-gray-800/50 hover:text-white"
          >
            {linkContent}
          </a>
        )}
      </li>
    );
  };

  // Section header
  const SectionHeader = ({ label }: { label: string }) => (
    <li className="pt-8 mb-1">
      <div className="px-3 mx-1 mb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-100 uppercase tracking-wider">{label}</span>
          </div>
          <div className="flex-1 ml-3 h-px bg-gradient-to-r from-gray-600 to-transparent"></div>
        </div>
      </div>
    </li>
  );

  // Render all nav sections
  const renderSections = (closeMobile = false) => (
    <>
      {navSections.map((section) => (
        <React.Fragment key={section.label}>
          <SectionHeader label={section.label} />
          {section.items.map((item) => renderNavItem(item, closeMobile))}
        </React.Fragment>
      ))}
    </>
  );

  // ══════════════════════════════════════════════════════════════════════
  //  MOBILE
  // ══════════════════════════════════════════════════════════════════════

  if (isMobile) {
    return (
      <div className="w-full bg-black">
        <div className="flex items-center justify-between px-3 h-12 bg-black">
          {/* Left — Hamburger / X */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white p-2 cursor-pointer"
            aria-label="Toggle menu"
          >
            {isExpanded ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {/* Center — PFSN Logo */}
          <a href="https://www.profootballnetwork.com" target="_blank" rel="noopener noreferrer" className="absolute left-1/2 transform -translate-x-1/2 h-8 flex items-center">
            <img
              src="https://statico.profootballnetwork.com/wp-content/uploads/2025/06/12093424/tools-navigation-06-12-25.jpg"
              alt="PFSN Logo"
              loading="lazy"
              width="96"
              height="24"
              className="max-h-6 w-auto object-contain transition-all duration-300 hover:opacity-80"
            />
          </a>

          {/* Right — spacer to balance layout */}
          <div className="w-9" />
        </div>

        {isExpanded && (
          <>
          {/* Backdrop overlay — click outside to close */}
          <div
            className="fixed inset-0 top-[48px] z-[-1]"
            onClick={() => setIsExpanded(false)}
          />
          <div className="bg-black border-t border-gray-800 max-h-[calc(100vh-48px)] flex flex-col">
            {/* Sticky top links */}
            <div className="bg-black border-b border-gray-800 pt-4 pb-2 flex-shrink-0">
              <ul className="space-y-0.5">
                <li>
                  <Link
                    href="/"
                    onClick={() => setIsExpanded(false)}
                    className={`relative flex items-center px-3 py-2 mx-1 rounded-md transition-all duration-200 ${
                      isHomePage
                        ? 'bg-[#0050A0] text-white'
                        : 'text-gray-100 hover:bg-gray-800/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <span className="text-[13px] font-medium">Home</span>
                    </div>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/transfer-portal-tracker"
                    onClick={() => setIsExpanded(false)}
                    className={`relative flex items-center px-3 py-2 mx-1 rounded-md transition-all duration-200 ${
                      isActivePage('/transfer-portal-tracker')
                        ? 'bg-[#0050A0] text-white'
                        : 'text-gray-100 hover:bg-gray-800/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="text-[13px] font-medium">Transfer Portal Tracker</span>
                    </div>
                  </Link>
                </li>
                <li>
                  <a
                    href="https://www.profootballnetwork.com/cfb/playoff-predictor-cfb-cta/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsExpanded(false)}
                    className="relative flex items-center px-3 py-2 mx-1 rounded-md transition-all duration-200 text-gray-100 hover:bg-gray-800/50 hover:text-white"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span className="text-[13px] font-medium">CFB Playoff Predictor</span>
                    </div>
                  </a>
                </li>
                <li>
                  <Link
                    href="/recruiting"
                    onClick={() => setIsExpanded(false)}
                    className={`relative flex items-center px-3 py-2 mx-1 rounded-md transition-all duration-200 ${
                      isActivePage('/recruiting')
                        ? 'bg-[#0050A0] text-white'
                        : 'text-gray-100 hover:bg-gray-800/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span className="text-[13px] font-medium">Recruiting Hub</span>
                    </div>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/teams"
                    onClick={() => setIsExpanded(false)}
                    className={`relative flex items-center px-3 py-2 mx-1 rounded-md transition-all duration-200 ${
                      isBrowseTeamsPage
                        ? 'bg-[#0050A0] text-white'
                        : 'text-gray-100 hover:bg-gray-800/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      <span className="text-[13px] font-medium">Browse All Teams</span>
                    </div>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Scrollable nav */}
            <div className="overflow-y-auto flex-1 py-4">
              <ul className="space-y-0.5">
                {renderSections(true)}
              </ul>
            </div>
          </div>
          </>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  //  DESKTOP
  // ══════════════════════════════════════════════════════════════════════

  return (
    <div className="w-full h-full bg-black border-r border-gray-800 flex flex-col">
      {/* Header with logo */}
      <div className="flex items-center justify-center px-4 py-4 border-b border-gray-800">
        <a href="https://www.profootballnetwork.com" target="_blank" rel="noopener noreferrer" className="block w-full">
          <img
            src="https://statico.profootballnetwork.com/wp-content/uploads/2025/06/12093424/tools-navigation-06-12-25.jpg"
            alt="PFSN Logo"
            loading="lazy"
            width="232"
            height="58"
            className="w-full h-auto transition-all duration-300 hover:opacity-80"
          />
        </a>
      </div>

      {/* Sticky top links */}
      <div className="bg-black border-b border-gray-800 pt-4 pb-2">
        <ul className="space-y-0.5">
          <li>
            <Link
              href="/"
              className={`relative flex items-center px-3 py-2 mx-1 rounded-md transition-all duration-200 ${
                isHomePage
                  ? 'bg-[#0050A0] text-white'
                  : 'text-gray-100 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 w-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-[13px] font-medium">Home</span>
              </div>
            </Link>
          </li>
          <li>
            <Link
              href="/transfer-portal-tracker"
              className={`relative flex items-center px-3 py-2 mx-1 rounded-md transition-all duration-200 ${
                isActivePage('/transfer-portal-tracker')
                  ? 'bg-[#0050A0] text-white'
                  : 'text-gray-100 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 w-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-[13px] font-medium">Transfer Portal Tracker</span>
              </div>
            </Link>
          </li>
          <li>
            <a
              href="https://www.profootballnetwork.com/cfb/playoff-predictor-cfb-cta/"
              target="_blank"
              rel="noopener noreferrer"
              className="relative flex items-center px-3 py-2 mx-1 rounded-md transition-all duration-200 text-gray-100 hover:bg-gray-800/50 hover:text-white"
            >
              <div className="flex items-center gap-2 w-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-[13px] font-medium">CFB Playoff Predictor</span>
              </div>
            </a>
          </li>
          <li>
            <Link
              href="/recruiting"
              className={`relative flex items-center px-3 py-2 mx-1 rounded-md transition-all duration-200 ${
                isActivePage('/recruiting')
                  ? 'bg-[#0050A0] text-white'
                  : 'text-gray-100 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 w-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="text-[13px] font-medium">Recruiting Hub</span>
              </div>
            </Link>
          </li>
          <li>
            <Link
              href="/teams"
              className={`relative flex items-center px-3 py-2 mx-1 rounded-md transition-all duration-200 ${
                isBrowseTeamsPage
                  ? 'bg-[#0050A0] text-white'
                  : 'text-gray-100 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 w-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="text-[13px] font-medium">Browse All Teams</span>
              </div>
            </Link>
          </li>
        </ul>
      </div>

      {/* Navigation — scrollable section */}
      <nav className="flex-1 overflow-y-auto py-4 sidebar-scroll">
        <ul className="space-y-0.5">
          {renderSections(false)}
        </ul>
      </nav>

      {/* Bottom padding for footer ad */}
      <div className="h-[92px] bg-black border-t border-gray-800" aria-hidden="true"></div>
    </div>
  );
};

export default CFBSidebar;
