'use client';

import { useState } from 'react';

interface MenuItem {
  label: string;
  href: string;
  children?: MenuItem[];
}

const menuData: MenuItem[] = [
  {
    label: 'CFB',
    href: 'https://www.profootballnetwork.com/cfb/',
    children: [
      { label: 'CFB Playoff Predictor', href: 'https://www.profootballnetwork.com/college-football-playoff-predictor' },
      { label: 'CFB Playoff Meter', href: 'https://www.profootballnetwork.com/cfb-fpm/' },
      {
        label: 'CFB Offense Impact',
        href: 'https://profootballnetwork.com/cfb-offense-rankings-impact/',
        children: [
          { label: 'CFB QB Impact', href: 'https://profootballnetwork.com/cfb-qb-rankings-impact/' },
          { label: 'CFB RB Impact', href: 'https://profootballnetwork.com/cfb-rb-rankings-impact/' },
          { label: 'CFB WR Impact', href: 'https://profootballnetwork.com/cfb-wr-rankings-impact/' },
          { label: 'CFB TE Impact', href: 'https://profootballnetwork.com/cfb-te-rankings-impact/' },
          { label: 'CFB Team OL Impact', href: 'https://profootballnetwork.com/cfb-team-ol-rankings-impact/' },
          { label: 'CFB Player OL Impact', href: 'https://profootballnetwork.com/cfb-player-ol-rankings-impact/' },
        ]
      },
      {
        label: 'CFB Defense Impact',
        href: 'https://profootballnetwork.com/cfb-defense-rankings-impact/',
        children: [
          { label: 'CFB DT Impact', href: 'https://profootballnetwork.com/cfb-dt-rankings-impact/' },
          { label: 'CFB EDGE Impact', href: 'https://profootballnetwork.com/cfb-edge-rankings-impact/' },
          { label: 'CFB LB Impact', href: 'https://profootballnetwork.com/cfb-lb-rankings-impact/' },
          { label: 'CFB CB Impact', href: 'https://profootballnetwork.com/cfb-cb-rankings-impact/' },
          { label: 'CFB Safety Impact', href: 'https://profootballnetwork.com/cfb-safety-rankings-impact/' },
        ]
      },
    ]
  },
  {
    label: 'Fantasy',
    href: 'https://www.profootballnetwork.com/fantasy/football',
    children: [
      { label: 'Fantasy Trade Analyzer', href: 'https://www.profootballnetwork.com/fantasy-football-trade-analyzer' },
      { label: 'DFS Lineup Optimizer', href: 'https://www.profootballnetwork.com/nfl-dfs-optimizer-lineup-generator/' },
      { label: 'Fantasy Start/Sit Optimizer', href: 'https://www.profootballnetwork.com/who-should-i-start-fantasy-optimizer' },
      { label: 'Fantasy Waiver Wire Assistant', href: 'https://www.profootballnetwork.com/fantasy-football-waiver-wire' },
      { label: 'Fantasy Team Name Generator', href: 'https://www.profootballnetwork.com/fantasy-football-team-name-generator' },
      {
        label: 'Fantasy Rankings',
        href: '#',
        children: [
          { label: '2025 Fantasy PPR Rankings', href: 'https://www.profootballnetwork.com/fantasy/football/overall-rankings' },
          { label: '2025 Fantasy WR Rankings', href: 'https://www.profootballnetwork.com/fantasy/football/wr-rankings-ppr' },
          { label: '2025 Fantasy RB Rankings', href: 'https://www.profootballnetwork.com/fantasy/football/rb-rankings-ppr' },
          { label: '2025 Fantasy TE Rankings', href: 'https://www.profootballnetwork.com/fantasy/football/te-rankings-ppr' },
          { label: '2025 Fantasy QB Rankings', href: 'https://www.profootballnetwork.com/fantasy/football/qb-rankings-ppr' },
          { label: '2025 Fantasy Kicker Rankings', href: 'https://www.profootballnetwork.com/fantasy/football/kicker-rankings' },
          { label: '2025 Fantasy Defense Rankings', href: 'https://www.profootballnetwork.com/fantasy/football/defense-rankings' },
          { label: 'Fantasy Dynasty Rankings', href: 'https://www.profootballnetwork.com/dynasty-fantasy-football-rankings/' },
        ]
      },
      { label: 'Fantasy Football MDS', href: 'https://www.profootballnetwork.com/fantasy-football-mock-draft-simulator/' },
      { label: 'NFL Betting Odds Calculator', href: 'https://www.profootballnetwork.com/nfl-betting/betting-odds-calculator/' },
      { label: 'NFL Betting Parlay Calculator', href: 'https://www.profootballnetwork.com/nfl-betting/parlays-calculator/' },
    ]
  },
  {
    label: 'MLB',
    href: 'https://www.profootballnetwork.com/mlb/',
    children: [
      { label: 'MLB Playoff Predictor', href: 'https://www.profootballnetwork.com/mlb-playoff-predictor/' },
    ]
  },
  {
    label: 'NBA',
    href: 'https://www.profootballnetwork.com/nba/',
    children: [
      { label: 'NBA Mock Draft Simulator', href: 'https://www.profootballnetwork.com/nba-mock-draft-simulator' },
      { label: 'NBA Playoff Predictor', href: 'https://www.profootballnetwork.com/nba-playoff-predictor/' },
    ]
  },
  {
    label: 'NFL',
    href: 'https://www.profootballnetwork.com/nfl/',
    children: [
      { label: 'NFL Mock Draft Simulator', href: 'https://www.profootballnetwork.com/mockdraft' },
      { label: 'NFL Playoff Predictor', href: 'https://www.profootballnetwork.com/nfl-playoff-predictor' },
      { label: 'Ultimate GM Simulator', href: 'https://www.profootballnetwork.com/nfl-ultimate-gm-simulator/' },
      { label: 'NFL Draft Big Board Builder', href: 'https://www.profootballnetwork.com/nfl-draft-big-board-builder' },
      { label: 'NFL Offseason Manager', href: 'https://www.profootballnetwork.com/nfl-offseason-salary-cap-free-agency-manager' },
      {
        label: 'Teams',
        href: '#',
        children: [
          { label: 'AFC East', href: '#' },
          { label: 'AFC North', href: '#' },
          { label: 'AFC South', href: '#' },
          { label: 'AFC West', href: '#' },
          { label: 'NFC East', href: '#' },
          { label: 'NFC North', href: '#' },
          { label: 'NFC South', href: '#' },
          { label: 'NFC West', href: '#' },
        ]
      },
      { label: 'NFL News and Analysis', href: 'https://www.profootballnetwork.com/nfl/' },
      { label: 'Football Playoff Meter (FPM)', href: 'https://www.profootballnetwork.com/nfl-fpm/' },
      {
        label: 'NFL Impact Rankings',
        href: 'https://www.profootballnetwork.com/nfl-qb-rankings-impact/',
        children: [
          { label: 'Offense Impact Rankings', href: 'https://profootballnetwork.com/nfl-offense-rankings-impact/' },
          { label: 'Defense Impact Rankings', href: 'https://profootballnetwork.com/nfl-defense-rankings-impact/' },
        ]
      },
      { label: 'NFL News Tracker', href: 'https://www.profootballnetwork.com/nfl-player-news-injuries-transactions-fantasy/' },
      { label: 'NFL Salary Cap Tracker', href: 'https://www.profootballnetwork.com/nfl-salary-cap-space-by-team' },
      { label: 'NFL Transactions', href: 'https://www.profootballnetwork.com/nfl-transactions' },
      { label: 'NFL Depth Charts', href: 'https://www.profootballnetwork.com/nfl/depth-chart/' },
      {
        label: 'NFL Draft',
        href: 'https://www.profootballnetwork.com/nfl-draft-hq/',
        children: [
          { label: 'NFL Mock Draft Simulator', href: 'https://www.profootballnetwork.com/mock-draft-simulator/' },
          { label: 'PFSN NFL Draft Rankings', href: 'https://www.profootballnetwork.com/nfl-draft-hq/pfsn-big-board/' },
          { label: '2026 NFL Draft Order', href: 'https://www.profootballnetwork.com/nfl-draft-hq/draft-order/' },
        ]
      },
      { label: 'NFL Injuries', href: 'https://www.profootballnetwork.com/nfl-injury-report' },
      { label: 'NFL Schedule', href: 'https://www.profootballnetwork.com/nfl/schedule/' },
      { label: 'NFL Standings', href: 'https://www.profootballnetwork.com/nfl/standings/' },
    ]
  },
  {
    label: 'Soccer',
    href: 'https://www.profootballnetwork.com/soccer/',
    children: [
      { label: 'Soccer Homepage', href: 'https://www.profootballnetwork.com/soccer/' },
      { label: 'World Cup Simulator', href: 'https://www.profootballnetwork.com/fifa-world-cup-simulator/' },
    ]
  },
  {
    label: 'Games',
    href: '#',
    children: [
      { label: 'NBA Player Guessing Game', href: 'https://www.profootballnetwork.com/nba-player-guessing-game' },
      { label: 'NFL Connections', href: 'https://www.profootballnetwork.com/games/nfl-connections/' },
      { label: 'NFL Player Guessing Game', href: 'https://www.profootballnetwork.com/nfl-player-guessing-game/' },
      { label: 'NFL Draft Prospect Guessing Game', href: 'https://www.profootballnetwork.com/nfl-draft-prospect-guessing-game/' },
      { label: 'NFL Word Search', href: 'https://www.profootballnetwork.com/nfl-wordsearch' },
      { label: 'NFL Wordle', href: 'https://www.profootballnetwork.com/nfl-word-fumble-player-name-game/' },
    ]
  },
];

export default function PFNHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);

  return (
    <>
      <div className="pfn-header-wrapper">
        <div className="pfn-header-container">
          {/* Logo */}
          <a
            href="https://www.profootballnetwork.com"
            className="header-logo-container"
          >
            <img
              src="/pfsn-logo.png"
              alt="PFSN Logo"
              className="header-logo"
            />
          </a>

          {/* Desktop Navigation */}
          <div className="header-items-container">
            {menuData.map((item) => (
              <div
                key={item.label}
                className="header-menu-items"
                onMouseEnter={() => setActiveMenu(item.label)}
                onMouseLeave={() => {
                  setActiveMenu(null);
                  setActiveSubMenu(null);
                }}
              >
                <p className="header-menu-items-text">
                  {item.label}
                  {item.children && (
                    <span className="downward-sign">
                      <img
                        className="nav-down-icon"
                        src="//staticd.profootballnetwork.com/skm/assets/pfn/header-navigation/nav-down-icon.png"
                        width="7"
                        height="4"
                        alt="down arrow"
                      />
                    </span>
                  )}
                </p>

                {/* First level dropdown */}
                {item.children && activeMenu === item.label && (
                  <div className="sub-menu-item-container">
                    {item.children.map((child) => (
                      child.children ? (
                        <div
                          key={child.label}
                          className="header-menu-sub-items"
                          onMouseEnter={() => setActiveSubMenu(child.label)}
                          onMouseLeave={() => setActiveSubMenu(null)}
                        >
                          <p className="header-menu-sub-items-text">
                            {child.label}
                            <img
                              className="nav-right-icon"
                              src="//staticd.profootballnetwork.com/skm/assets/pfn/header-navigation/nav-right-icon.svg"
                              width="7"
                              height="4"
                              alt="right arrow"
                            />
                          </p>

                          {/* Second level dropdown */}
                          {activeSubMenu === child.label && (
                            <div className="sub-sub-menu-item-container">
                              {child.children.map((subChild) => (
                                <a key={subChild.label} href={subChild.href} className="header-menu-sub-sub-items">
                                  <p className="header-menu-sub-sub-items-text">{subChild.label}</p>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <a key={child.label} href={child.href} className="header-menu-sub-items">
                          <p className="header-menu-sub-items-text">{child.label}</p>
                        </a>
                      )
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          {menuData.map((item) => (
            <div key={item.label} className="mobile-menu-section">
              <a href={item.href} className="mobile-menu-item mobile-menu-parent">
                {item.label}
              </a>
              {item.children && (
                <div className="mobile-submenu">
                  {item.children.map((child) => (
                    <a key={child.label} href={child.href} className="mobile-menu-item mobile-menu-child">
                      {child.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Spacer to account for fixed header */}
      <div className="header-spacer" />

      <style jsx>{`
        .pfn-header-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          z-index: 2001;
          height: 50px;
        }

        .pfn-header-container {
          display: flex;
          width: 100%;
          justify-content: center;
          position: relative;
          height: 100%;
        }

        .header-logo-container {
          text-decoration: none;
          color: #2d2d2d;
          display: flex;
          position: absolute;
          left: 18%;
          height: 100%;
          align-items: center;
        }

        .header-logo {
          width: 40px;
          height: 40px;
        }

        .header-items-container {
          display: flex;
          gap: 20px;
          align-items: center;
        }

        .header-menu-items {
          cursor: pointer;
          flex-shrink: 0;
          position: relative;
        }

        .header-menu-items-text {
          font-family: "Roboto", "Helvetica Neue", Arial, sans-serif;
          font-size: 16px;
          font-weight: 500;
          letter-spacing: 0.4px;
          color: #FFFFFF;
          margin: unset;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 5px;
        }

        .header-menu-items-text::after {
          content: '';
          position: absolute;
          bottom: -16px;
          left: 50%;
          width: 0;
          height: 3px;
          background-color: #0857C3;
          transition: width 0.2s ease-in-out, left 0.2s ease-in-out;
          transform: translateX(-50%);
        }

        .header-menu-items:hover .header-menu-items-text::after {
          width: 100%;
          left: 0;
          transform: translateX(0);
        }

        .downward-sign {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .nav-down-icon {
          width: 9px;
          height: 6px;
          background: none;
        }

        .nav-right-icon {
          width: 12px;
          height: 11px;
          background: none;
          margin-left: auto;
        }

        .sub-menu-item-container {
          display: flex;
          flex-direction: column;
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          background-color: #000;
          color: #fff;
          padding: 15px 0px;
          z-index: 100;
        }

        .header-menu-sub-items {
          background-color: #000;
          border: unset;
          color: #fff;
          text-align: left;
          padding: 4px 30px;
          font-family: "Roboto";
          font-size: 16px;
          cursor: pointer;
          text-decoration: none;
          display: flex;
          min-width: 300px;
          position: relative;
        }

        .header-menu-sub-items:hover {
          background-color: #222;
        }

        .header-menu-sub-items-text {
          color: #fff;
          text-align: left;
          padding: 4px;
          font-family: "Roboto";
          font-size: 16px;
          margin: 0;
          display: flex;
          justify-content: space-between;
          width: 100%;
          align-items: center;
          cursor: pointer;
        }

        .sub-sub-menu-item-container {
          display: block;
          min-width: 300px;
          position: absolute;
          left: 0;
          top: 0;
          transform: translateX(-100%);
          background-color: #000;
          color: #fff;
          padding: 15px 0px;
          z-index: 101;
        }

        .header-menu-sub-sub-items {
          display: block;
          padding: 4px 30px;
          text-align: left;
          font-family: "Roboto";
          font-size: 16px;
          color: #fff;
          cursor: pointer;
          text-decoration: none;
        }

        .header-menu-sub-sub-items:hover {
          background-color: #222;
        }

        .header-menu-sub-sub-items-text {
          padding: 4px;
          margin: 0;
          color: #fff;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .mobile-menu-btn {
          display: none;
          position: absolute;
          left: 16px;
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 8px;
        }

        .mobile-menu {
          position: fixed;
          top: 50px;
          left: 0;
          width: 100%;
          max-height: calc(100vh - 50px);
          overflow-y: auto;
          background: #000;
          z-index: 2000;
          border-top: 1px solid #333;
        }

        .mobile-menu-section {
          border-bottom: 1px solid #222;
        }

        .mobile-menu-item {
          display: block;
          color: #FFFFFF;
          text-decoration: none;
          padding: 12px 20px;
          font-family: "Roboto", "Helvetica Neue", Arial, sans-serif;
          font-size: 16px;
          font-weight: 500;
          letter-spacing: 0.4px;
        }

        .mobile-menu-item:hover {
          background: #222;
        }

        .mobile-menu-parent {
          font-weight: 600;
          background: #111;
        }

        .mobile-menu-child {
          padding-left: 32px;
          font-size: 14px;
          font-weight: 400;
        }

        .mobile-submenu {
          background: #0a0a0a;
        }

        .header-spacer {
          height: 50px;
        }

        @media (max-width: 768px) {
          .header-spacer {
            height: 34.5px;
          }
          .pfn-header-wrapper {
            height: 34.5px;
          }

          .pfn-header-container {
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .header-items-container {
            display: none;
          }

          .mobile-menu-btn {
            display: flex;
            align-items: center;
          }

          .header-logo-container {
            left: unset;
            right: 4%;
          }

          .header-logo {
            width: 25px;
            height: 25px;
          }

          .mobile-menu {
            top: 34.5px;
          }
        }
      `}</style>
    </>
  );
}
