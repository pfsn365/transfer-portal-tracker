'use client';

import React from 'react';

interface FooterProps {
  currentPage?: string;
}

const Footer = ({ currentPage = 'CFB' }: FooterProps) => {
  return (
    <>
      <footer className="pfsn-footer no-sidebar">
        <div className="pfsn-footer-container">
          <div className="footer-columns">
            <div className="footer-column">
              <h3 className="footer-column-title">News & Analysis</h3>
              <ul className="footer-links">
                <li className={currentPage === 'CBB' ? 'current-page' : ''}><a href="https://www.profootballnetwork.com/mens-cbb/" target="_blank" rel="noopener noreferrer">CBB</a></li>
                <li className={currentPage === 'CFB' ? 'current-page' : ''}><a href="https://www.profootballnetwork.com/cfb/" target="_blank" rel="noopener noreferrer">CFB</a></li>
                <li className={currentPage === 'Fantasy' ? 'current-page' : ''}><a href="https://www.profootballnetwork.com/fantasy-football/" target="_blank" rel="noopener noreferrer">Fantasy</a></li>
                <li className={currentPage === 'MLB' ? 'current-page' : ''}><a href="https://www.profootballnetwork.com/mlb/" target="_blank" rel="noopener noreferrer">MLB</a></li>
                <li className={currentPage === 'NASCAR' ? 'current-page' : ''}><a href="https://www.profootballnetwork.com/nascar/" target="_blank" rel="noopener noreferrer">NASCAR</a></li>
                <li className={currentPage === 'NBA' ? 'current-page' : ''}><a href="https://www.profootballnetwork.com/nba/" target="_blank" rel="noopener noreferrer">NBA</a></li>
                <li className={currentPage === 'NFL' ? 'current-page' : ''}><a href="https://www.profootballnetwork.com/nfl/" target="_blank" rel="noopener noreferrer">NFL</a></li>
                <li className={currentPage === 'NHL' ? 'current-page' : ''}><a href="https://www.profootballnetwork.com/nhl/" target="_blank" rel="noopener noreferrer">NHL</a></li>
                <li className={currentPage === 'Tennis' ? 'current-page' : ''}><a href="https://www.profootballnetwork.com/tennis/" target="_blank" rel="noopener noreferrer">Tennis</a></li>
                <li className={currentPage === 'WNBA' ? 'current-page' : ''}><a href="https://www.profootballnetwork.com/wnba/" target="_blank" rel="noopener noreferrer">WNBA</a></li>
                <li className={currentPage === 'WWE' ? 'current-page' : ''}><a href="https://www.profootballnetwork.com/wwe-player-guessing-game/" target="_blank" rel="noopener noreferrer">WWE</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h3 className="footer-column-title">NFL Tools</h3>
              <ul className="footer-links">
                <li><a href="https://www.profootballnetwork.com/mockdraft">NFL Mock Draft Simulator</a></li>
                <li><a href="https://www.profootballnetwork.com/nfl-playoff-predictor">NFL Season & Playoff Predictor</a></li>
                <li><a href="https://www.profootballnetwork.com/nfl-offseason-salary-cap-free-agency-manager">NFL Offseason Manager</a></li>
                <li><a href="https://www.profootballnetwork.com/cta-big-board-builder-nfl-draft/">NFL Draft Big Board Builder</a></li>
              </ul>

              <h3 className="footer-column-title footer-subheading">NFL Games</h3>
              <ul className="footer-links">
                <li><a href="https://www.profootballnetwork.com/nfl-player-guessing-game/">NFL Player Guessing Game</a></li>
                <li><a href="https://www.profootballnetwork.com/cta-guess-nfl-prospects-tools/">NFL Draft Guessing Game</a></li>
                <li><a href="https://www.profootballnetwork.com/nfl-word-fumble-cta/">NFL Word Fumble</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h3 className="footer-column-title">Fantasy Football Tools</h3>
              <ul className="footer-links">
                <li><a href="https://www.profootballnetwork.com/fantasy-football-mock-draft-simulator/">Fantasy Mock Draft Simulator</a></li>
                <li><a href="https://www.profootballnetwork.com/who-should-i-start-fantasy-optimizer">Fantasy Start/Sit Optimizer</a></li>
                <li><a href="https://www.profootballnetwork.com/fantasy-football-waiver-wire">Fantasy Waiver Wire Assistant</a></li>
                <li><a href="https://www.profootballnetwork.com/fantasy-football-trade-analyzer">Fantasy Trade Analyzer</a></li>
                <li><a href="https://www.profootballnetwork.com/dynasty-fantasy-football-trade-value-charts">Dynasty Trade Charts</a></li>
                <li><a href="https://www.profootballnetwork.com/fantasy-football-trade-value-charts">Redraft Trade Charts</a></li>
                <li><a href="https://www.profootballnetwork.com/nfl-dfs-optimizer-lineup-generator">NFL DFS Optimizer</a></li>
                <li><a href="https://www.profootballnetwork.com/who-should-i-draft-fantasy-football">Who Should I Draft?</a></li>
                <li><a href="https://www.profootballnetwork.com/fantasy-football-team-name-generator">Team Name Generator</a></li>
                <li><a href="https://www.profootballnetwork.com/fantasy-football-draft-order-generator-randomizer/">Draft Order Randomizer</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h3 className="footer-column-title">Betting Tools</h3>
              <ul className="footer-links">
                <li><a href="https://www.profootballnetwork.com/betting-odds-calculator-cta/">Odds Calculator</a></li>
                <li><a href="https://www.profootballnetwork.com/parlay-calculator-cta/">Parlay Calculator</a></li>
              </ul>

              <h3 className="footer-column-title footer-subheading">Company</h3>
              <ul className="footer-links">
                <li><a href="https://www.profootballnetwork.com/about-us/">About PFSN</a></li>
                <li><a href="https://www.profootballnetwork.com/contact-media-inquiries-pro-football-network/">Contact Us</a></li>
                <li><a href="https://www.profootballnetwork.com/privacy-policy/">Privacy Policy</a></li>
              </ul>

              <h3 className="footer-column-title footer-subheading">NFL Resources</h3>
              <ul className="footer-links">
                <li><a href="https://www.profootballnetwork.com/current-nfl-draft-order">NFL Draft Order</a></li>
                <li><a href="https://www.profootballnetwork.com/nfl-draft-prospect-rankings">NFL Draft Prospect Rankings</a></li>
                <li><a href="https://www.profootballnetwork.com/nfl-salary-cap-space-by-team">NFL Salary Cap Table</a></li>
              </ul>

              <h3 className="footer-column-title footer-subheading">NBA Tools</h3>
              <ul className="footer-links">
                <li><a href="https://www.profootballnetwork.com/nba-mock-draft-simulator">NBA Mock Draft Simulator</a></li>
                <li><a href="https://www.profootballnetwork.com/nba-player-guessing-game">NBA Player Guessing Game</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="social-icons">
              <a href="https://facebook.com/PFSN365" aria-label="Facebook" rel="noopener noreferrer" target="_blank">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="mailto:contact@profootballnetwork.com" aria-label="Email">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z"/>
                  <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z"/>
                </svg>
              </a>
              <a href="/rss" aria-label="RSS Feed">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3.75 3a.75.75 0 00-.75.75v.5c0 .414.336.75.75.75H4c6.075 0 11 4.925 11 11v.25c0 .414.336.75.75.75h.5a.75.75 0 00.75-.75V16C17 8.82 11.18 3 4 3h-.25z"/>
                  <path d="M3 8.75A.75.75 0 013.75 8H4a8 8 0 018 8v.25a.75.75 0 01-.75.75h-.5a.75.75 0 01-.75-.75V16a6 6 0 00-6-6h-.25A.75.75 0 013 9.25v-.5zM7 15a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </a>
              <a href="https://x.com/PFSN365" aria-label="Twitter" rel="noopener noreferrer" target="_blank">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
            <div className="copyright">
              <p>Copyright © 2019-2025. PFSN.</p>
              <p>All Rights Reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
