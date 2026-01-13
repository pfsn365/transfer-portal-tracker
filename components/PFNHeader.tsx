'use client';

import { useState, useEffect } from 'react';

interface MenuItem {
  label: string;
  href: string;
  children?: MenuItem[];
}

interface APIMenuItem {
  id: number;
  title: string;
  url: string;
  target: string;
  classes: string;
  order: number;
  children?: APIMenuItem[];
}

// Fallback menu data in case API fails
const fallbackMenuData: MenuItem[] = [
  {
    label: 'CFB',
    href: 'https://www.profootballnetwork.com/cfb-hq/',
    children: [
      { label: 'CFB Transfer Portal Tracker', href: 'https://www.profootballnetwork.com/cfb-hq/transfer-portal-tracker' },
      { label: 'CFB Playoff Predictor', href: 'https://www.profootballnetwork.com/college-football-playoff-predictor' },
      { label: 'CFB Playoff Meter', href: 'https://www.profootballnetwork.com/cfb-fpm/' },
    ]
  },
  {
    label: 'Fantasy',
    href: 'https://www.profootballnetwork.com/fantasy/football',
  },
  {
    label: 'MLB',
    href: 'https://www.profootballnetwork.com/mlb/',
  },
  {
    label: 'NBA',
    href: 'https://www.profootballnetwork.com/nba/',
  },
  {
    label: 'NFL',
    href: 'https://www.profootballnetwork.com/nfl/',
  },
  {
    label: 'Soccer',
    href: 'https://www.profootballnetwork.com/soccer/',
  },
  {
    label: 'Games',
    href: '#',
  },
];

// Transform API response (already nested) to MenuItem format
function transformMenuData(apiItems: APIMenuItem[]): MenuItem[] {
  function transformItem(item: APIMenuItem): MenuItem {
    const menuItem: MenuItem = {
      label: item.title,
      href: item.url || '#',
    };

    if (item.children && item.children.length > 0) {
      menuItem.children = item.children.map(transformItem);
    }

    return menuItem;
  }

  return apiItems.map(transformItem);
}

export default function PFNHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  const [menuData, setMenuData] = useState<MenuItem[]>(fallbackMenuData);

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchMenu() {
      try {
        const response = await fetch('https://www.profootballnetwork.com/wp-json/pfsn/v1/menu/54', {
          next: { revalidate: 3600 },
          signal: abortController.signal,
        });

        if (abortController.signal.aborted) return;

        if (!response.ok) {
          throw new Error('Failed to fetch menu');
        }

        const data: APIMenuItem[] = await response.json();

        if (abortController.signal.aborted) return;

        const transformedMenu = transformMenuData(data);

        if (transformedMenu.length > 0) {
          setMenuData(transformedMenu);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        console.error('Error fetching menu:', error);
      }
    }

    fetchMenu();

    return () => {
      abortController.abort();
    };
  }, []);

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
              src="/cfb-hq/pfsn-logo.png"
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

        @media (max-width: 768px) {
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
