'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface CFBSidebarProps {
  isMobile?: boolean;
}

const CFBSidebar: React.FC<CFBSidebarProps> = ({ isMobile = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCFBToolsExpanded, setIsCFBToolsExpanded] = useState(true);
  const [isOtherToolsExpanded, setIsOtherToolsExpanded] = useState(true);
  const pathname = usePathname();

  const normalizePath = (path: string) => path.replace(/\/$/, '');
  const normalizedPathname = normalizePath(pathname);

  const isActivePage = (url: string) => {
    const normalizedUrl = normalizePath(url);
    const urlWithoutBase = normalizedUrl.replace(/^\/cfb-hq/, '');
    return normalizedPathname === urlWithoutBase || normalizedPathname === normalizedUrl;
  };

  const isHomePage = normalizedPathname === '' || normalizedPathname === '/' || normalizedPathname === '/cfb-hq';

  const cfbTools = [
    { title: 'CFB Transfer Portal Tracker', url: '/transfer-portal-tracker', external: false },
    { title: 'CFB Schedule', url: '/schedule', external: false },
    { title: 'CFB Standings', url: '/standings', external: false },
    { title: 'CFB Rankings', url: '/rankings', external: false },
    { title: 'CFB Stat Leaders', url: '/stat-leaders', external: false },
    { title: 'CFB Postseason Hub', url: '/postseason', external: false },
    { title: 'CFB Power Rankings Builder', url: '/power-rankings-builder', external: false },
    { title: 'CFB Playoff Predictor', url: 'https://www.profootballnetwork.com/cfb/playoff-predictor-cfb-cta/', external: true },
  ];

  const isBrowseTeamsPage = isActivePage('/teams') || pathname.startsWith('/teams');

  const otherTools = [
    { title: 'NFL Mock Draft Simulator', url: 'https://www.profootballnetwork.com/mock-draft-simulator/' },
    { title: 'NFL HQ', url: 'https://www.profootballnetwork.com/nfl-hq/' },
    { title: 'NFL Free Agency Tracker', url: 'https://www.profootballnetwork.com/nfl-hq/free-agency-tracker' },
    { title: 'NFL Draft HQ', url: 'https://www.profootballnetwork.com/nfl-draft-hq/' },
    { title: 'NFL Ultimate GM Simulator', url: 'https://www.profootballnetwork.com/cta-ultimate-gm-simulator-nfl/' },
    { title: 'Fantasy Football Hub', url: 'https://www.profootballnetwork.com/fantasy/football/' },
    { title: 'NBA HQ', url: 'https://www.profootballnetwork.com/nba-hq/' },
    { title: 'NBA Mock Draft Simulator', url: 'https://www.profootballnetwork.com/nba-mock-draft-simulator' },
    { title: 'MLB Playoff Predictor', url: 'https://www.profootballnetwork.com/mlb-playoff-predictor/' },
    { title: 'World Cup Simulator', url: 'https://www.profootballnetwork.com/fifa-world-cup-simulator' },
    { title: 'Tennis Simulator', url: 'https://www.profootballnetwork.com/tennis-simulator' },
  ];

  // Mobile version
  if (isMobile) {
    return (
      <div className="w-full bg-black">
        <div className="flex items-center justify-between px-4 py-3 bg-black">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="sidebar-header-btn text-white p-2.5 -m-1.5 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <a href="https://www.profootballnetwork.com" target="_blank" rel="noopener noreferrer" className="sidebar-header-link flex items-center">
              <img
                src="https://statico.profootballnetwork.com/wp-content/uploads/2025/06/12093424/tools-navigation-06-12-25.jpg"
                alt="PFSN Logo"
                className="h-6 w-auto transition-all duration-300 hover:opacity-80"
              />
            </a>

            <span className="text-white font-semibold text-sm">CFB HQ</span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="sidebar-header-btn text-white p-1 cursor-pointer"
            aria-label="Toggle dropdown"
          >
            <svg
              className={`w-4 h-4 transform transition-transform duration-300 ease-out ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {isExpanded && (
          <div className="bg-black border-t border-gray-800">
            <div className="px-4 py-2 border-b border-gray-800">
              <div className="grid grid-cols-1 gap-1">
                <Link
                  href="/"
                  className={`block px-3 py-2.5 rounded text-sm transition-colors ${
                    isHomePage
                      ? 'bg-[#800000] text-white'
                      : 'text-white hover:bg-gray-800'
                  }`}
                >
                  <div className="text-sm flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Home
                  </div>
                </Link>
                <Link
                  href="/teams"
                  className={`block px-3 py-2.5 rounded text-sm transition-colors ${
                    isBrowseTeamsPage
                      ? 'bg-[#800000] text-white'
                      : 'text-white hover:bg-gray-800'
                  }`}
                >
                  <div className="text-sm flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    Browse All Teams
                  </div>
                </Link>
              </div>
            </div>

            <div className="px-4 py-2 border-b border-gray-800">
              <div
                role="button"
                tabIndex={0}
                aria-expanded={isCFBToolsExpanded}
                aria-controls="cfb-tools-menu"
                className="flex items-center justify-between mb-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                onClick={() => setIsCFBToolsExpanded(!isCFBToolsExpanded)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsCFBToolsExpanded(!isCFBToolsExpanded); } }}
              >
                <div className="text-[#800000] text-xs font-bold uppercase tracking-wider">CFB Tools</div>
                <svg
                  className={`w-4 h-4 text-[#800000] transform transition-transform duration-300 ease-out ${isCFBToolsExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {isCFBToolsExpanded && (
                <div id="cfb-tools-menu" className="grid grid-cols-1 gap-1">
                  {cfbTools.map((tool) => {
                    const isActive = !tool.external && isActivePage(tool.url);

                    return (
                      <React.Fragment key={tool.title}>
                        {tool.external ? (
                          <a
                            href={tool.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block px-3 py-2.5 rounded text-sm transition-colors text-white hover:bg-gray-800"
                          >
                            <div className="text-sm flex items-center gap-1">
                              {tool.title}
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-3 h-3 opacity-50">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </div>
                          </a>
                        ) : (
                          <Link
                            href={tool.url}
                            className={`block px-3 py-2.5 rounded text-sm transition-colors ${
                              isActive ? 'bg-[#800000] text-white' : 'text-white hover:bg-gray-800'
                            }`}
                          >
                            <div className="text-sm">{tool.title}</div>
                          </Link>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-4 py-2">
              <div
                role="button"
                tabIndex={0}
                aria-expanded={isOtherToolsExpanded}
                aria-controls="other-tools-menu"
                className="flex items-center justify-between mb-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                onClick={() => setIsOtherToolsExpanded(!isOtherToolsExpanded)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsOtherToolsExpanded(!isOtherToolsExpanded); } }}
              >
                <div className="text-[#800000] text-xs font-bold uppercase tracking-wider">Other Sports</div>
                <svg
                  className={`w-4 h-4 text-[#800000] transform transition-transform duration-300 ease-out ${isOtherToolsExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {isOtherToolsExpanded && (
                <div id="other-tools-menu" className="grid grid-cols-1 gap-1">
                  {otherTools.map((tool) => (
                    <a
                      key={tool.title}
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-3 py-2.5 rounded text-sm transition-colors text-white hover:bg-gray-800"
                    >
                      <div className="text-sm flex items-center gap-1">
                        {tool.title}
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-3 h-3 opacity-50">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop version
  return (
    <div className="w-full h-full bg-black border-r border-gray-800 flex flex-col">
      <div className="flex items-center justify-center px-4 py-4 border-b border-gray-800">
        <a href="https://www.profootballnetwork.com" target="_blank" rel="noopener noreferrer" className="block">
          <img
            src="https://statico.profootballnetwork.com/wp-content/uploads/2025/06/12093424/tools-navigation-06-12-25.jpg"
            alt="PFSN Logo"
            width={240}
            height={48}
            className="w-full h-auto transition-all duration-300 hover:opacity-80"
          />
        </a>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 sidebar-scroll">
        <ul className="space-y-0.5">
          <li>
            <Link
              href="/"
              className={`relative flex items-center px-3 py-2 mx-1 rounded-md transition-all duration-200 ${
                isHomePage
                  ? 'bg-[#800000] text-white'
                  : 'text-gray-100 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 w-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span className="text-sm font-medium">Home</span>
              </div>
            </Link>
          </li>
          <li>
            <Link
              href="/teams"
              className={`relative flex items-center px-3 py-2 mx-1 rounded-md transition-all duration-200 ${
                isBrowseTeamsPage
                  ? 'bg-[#800000] text-white'
                  : 'text-gray-100 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 w-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                <span className="text-sm font-medium">Browse All Teams</span>
              </div>
            </Link>
          </li>

          <li className="mb-2 pt-4">
            <div className="px-3 mb-2">
              <div className="flex items-center justify-between min-w-0">
                <div className="flex items-center gap-2 min-w-0 flex-shrink">
                  <div className="h-0.5 w-3 bg-gray-600 rounded flex-shrink-0"></div>
                  <span className="text-xs font-bold text-gray-100 uppercase tracking-wider truncate">CFB Tools</span>
                </div>
                <div className="flex-1 ml-3 h-px bg-gradient-to-r from-gray-800 to-transparent flex-shrink-0"></div>
              </div>
            </div>
          </li>
          {cfbTools.map((tool) => {
            const isActive = !tool.external && isActivePage(tool.url);

            return (
              <li key={tool.title}>
                {tool.external ? (
                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative flex items-center px-3 py-2 mx-1 rounded-md transition-all duration-200 text-gray-100 hover:bg-gray-800/50 hover:text-white"
                  >
                    <span className="text-sm font-medium truncate flex items-center gap-2">
                      {tool.title}
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-3 h-3 opacity-50">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </span>
                  </a>
                ) : (
                  <Link
                    href={tool.url}
                    className={`relative flex items-center px-3 py-2 mx-1 rounded-md transition-all duration-200 ${
                      isActive
                        ? 'bg-[#800000] text-white'
                        : 'text-gray-100 hover:bg-gray-800/50 hover:text-white'
                    }`}
                  >
                    <span className="text-sm font-medium truncate">{tool.title}</span>
                  </Link>
                )}
              </li>
            );
          })}

          <li className="pt-6">
            <div className="px-3 mb-2">
              <div className="flex items-center justify-between min-w-0">
                <div className="flex items-center gap-2 min-w-0 flex-shrink">
                  <div className="h-0.5 w-3 bg-gray-600 rounded flex-shrink-0"></div>
                  <span className="text-xs font-bold text-gray-100 uppercase tracking-wider truncate">Other Sports</span>
                </div>
                <div className="flex-1 ml-3 h-px bg-gradient-to-r from-gray-800 to-transparent flex-shrink-0"></div>
              </div>
            </div>
          </li>
          {otherTools.map((tool) => (
            <li key={tool.title}>
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex items-center px-3 py-2 mx-1 rounded-md transition-all duration-200 text-gray-100 hover:bg-gray-800/50 hover:text-white"
              >
                <span className="text-sm font-medium truncate flex items-center gap-2">
                  {tool.title}
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-3 h-3 opacity-50">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="h-[92px] bg-black border-t border-gray-800" aria-hidden="true"></div>
    </div>
  );
};

export default CFBSidebar;
