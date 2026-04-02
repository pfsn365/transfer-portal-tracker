'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { allTeams } from '@/data/teams';
import TransferPortalBanner from '@/components/TransferPortalBanner';
import Footer from '@/components/Footer';
import RaptiveHeaderAd from '@/components/RaptiveHeaderAd';
import { getApiPath } from '@/utils/api';
import { getTeamLogo } from '@/utils/teamLogos';

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  teamId: string;
  classYear?: string;
  headshotUrl?: string;
}

interface RankedPlayer {
  rank: number;
  player: Player;
}

// Player Avatar component with proper fallback handling
function createPlayerSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

function PlayerAvatar({ playerId, playerName, teamColor }: { playerId: string; playerName: string; teamColor: string }) {
  const [imgError, setImgError] = useState(false);
  const initials = playerName.split(' ').map(n => n[0]).join('');
  const slug = createPlayerSlug(playerName);

  const basePath = typeof window !== 'undefined'
    ? (window.location.pathname.startsWith('/cfb-hq') ? '/cfb-hq' : '')
    : '';

  if (imgError) {
    return (
      <div
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${teamColor}20` }}
      >
        <span className="font-semibold text-sm" style={{ color: teamColor }}>
          {initials}
        </span>
      </div>
    );
  }

  return (
    <img
      src={`${basePath}/player-images/${slug}.png`}
      alt={playerName}
      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover bg-gray-100 flex-shrink-0"
      onError={() => setImgError(true)}
    />
  );
}

// Position groups for filtering
const POSITION_GROUPS: Record<string, string[]> = {
  'All': [],
  'QB': ['QB'],
  'RB': ['RB', 'FB'],
  'WR': ['WR'],
  'TE': ['TE'],
  'OL': ['OT', 'OG', 'OC', 'IOL', 'OL', 'C', 'G', 'T'],
  'DL': ['DL', 'DT', 'DE', 'NT', 'EDGE'],
  'LB': ['LB', 'ILB', 'OLB', 'MLB'],
  'DB': ['CB', 'NB', 'S', 'SS', 'FS', 'SAF', 'DB'],
  'K/P': ['K', 'P'],
};

// Top 100 CFB Players (curated list)
const TOP_100_PLAYERS: Player[] = [
  // Quarterbacks
  { id: 'shedeur-sanders', name: 'Shedeur Sanders', position: 'QB', team: 'Colorado Buffaloes', teamId: 'colorado' },
  { id: 'carson-beck', name: 'Carson Beck', position: 'QB', team: 'Georgia Bulldogs', teamId: 'georgia' },
  { id: 'quinn-ewers', name: 'Quinn Ewers', position: 'QB', team: 'Texas Longhorns', teamId: 'texas' },
  { id: 'cam-ward', name: 'Cam Ward', position: 'QB', team: 'Miami Hurricanes', teamId: 'miami' },
  { id: 'jalen-milroe', name: 'Jalen Milroe', position: 'QB', team: 'Alabama Crimson Tide', teamId: 'alabama' },
  { id: 'arch-manning', name: 'Arch Manning', position: 'QB', team: 'Texas Longhorns', teamId: 'texas' },
  { id: 'dillon-gabriel', name: 'Dillon Gabriel', position: 'QB', team: 'Oregon Ducks', teamId: 'oregon' },
  { id: 'drew-allar', name: 'Drew Allar', position: 'QB', team: 'Penn State Nittany Lions', teamId: 'penn state' },
  { id: 'jaxson-dart', name: 'Jaxson Dart', position: 'QB', team: 'Ole Miss Rebels', teamId: 'ole miss' },
  { id: 'miller-moss', name: 'Miller Moss', position: 'QB', team: 'USC Trojans', teamId: 'usc' },

  // Wide Receivers
  { id: 'travis-hunter', name: 'Travis Hunter', position: 'WR', team: 'Colorado Buffaloes', teamId: 'colorado' },
  { id: 'jeremiah-smith', name: 'Jeremiah Smith', position: 'WR', team: 'Ohio State Buckeyes', teamId: 'ohio state' },
  { id: 'tetairoa-mcmillan', name: 'Tetairoa McMillan', position: 'WR', team: 'Arizona Wildcats', teamId: 'arizona' },
  { id: 'luther-burden-iii', name: 'Luther Burden III', position: 'WR', team: 'Missouri Tigers', teamId: 'missouri' },
  { id: 'tre-harris', name: 'Tre Harris', position: 'WR', team: 'Ole Miss Rebels', teamId: 'ole miss' },
  { id: 'emeka-egbuka', name: 'Emeka Egbuka', position: 'WR', team: 'Ohio State Buckeyes', teamId: 'ohio state' },
  { id: 'xavier-worthy-cfb', name: 'Barion Brown', position: 'WR', team: 'Kentucky Wildcats', teamId: 'kentucky' },
  { id: 'rome-odunze-cfb', name: 'Ryan Williams', position: 'WR', team: 'Alabama Crimson Tide', teamId: 'alabama' },
  { id: 'evan-stewart', name: 'Evan Stewart', position: 'WR', team: 'Oregon Ducks', teamId: 'oregon' },
  { id: 'tez-johnson', name: 'Tez Johnson', position: 'WR', team: 'Oregon Ducks', teamId: 'oregon' },
  { id: 'dane-key', name: 'Dane Key', position: 'WR', team: 'Kentucky Wildcats', teamId: 'kentucky' },
  { id: 'jayden-higgins', name: 'Jayden Higgins', position: 'WR', team: 'Iowa State Cyclones', teamId: 'iowa state' },
  { id: 'jaylin-noel', name: 'Jaylin Noel', position: 'WR', team: 'Iowa State Cyclones', teamId: 'iowa state' },
  { id: 'nick-marsh', name: 'Nick Marsh', position: 'WR', team: 'Michigan State Spartans', teamId: 'michigan state' },

  // Running Backs
  { id: 'ashton-jeanty', name: 'Ashton Jeanty', position: 'RB', team: 'Boise State Broncos', teamId: 'boise state' },
  { id: 'omarion-hampton', name: 'Omarion Hampton', position: 'RB', team: 'North Carolina Tar Heels', teamId: 'north carolina' },
  { id: 'quinshon-judkins', name: 'Quinshon Judkins', position: 'RB', team: 'Ohio State Buckeyes', teamId: 'ohio state' },
  { id: 'treveyon-henderson', name: 'TreVeyon Henderson', position: 'RB', team: 'Ohio State Buckeyes', teamId: 'ohio state' },
  { id: 'ollie-gordon-ii', name: 'Ollie Gordon II', position: 'RB', team: 'Oklahoma State Cowboys', teamId: 'oklahoma state' },
  { id: 'kaleb-johnson', name: 'Kaleb Johnson', position: 'RB', team: 'Iowa Hawkeyes', teamId: 'iowa' },
  { id: 'jaydon-blue', name: 'Jaydon Blue', position: 'RB', team: 'Texas Longhorns', teamId: 'texas' },
  { id: 'cody-schrader', name: 'Cody Schrader', position: 'RB', team: 'Missouri Tigers', teamId: 'missouri' },
  { id: 'woody-marks', name: 'Woody Marks', position: 'RB', team: 'USC Trojans', teamId: 'usc' },
  { id: 'devin-neal', name: 'Devin Neal', position: 'RB', team: 'Kansas Jayhawks', teamId: 'kansas' },

  // Tight Ends
  { id: 'tyler-warren', name: 'Tyler Warren', position: 'TE', team: 'Penn State Nittany Lions', teamId: 'penn state' },
  { id: 'colston-loveland', name: 'Colston Loveland', position: 'TE', team: 'Michigan Wolverines', teamId: 'michigan' },
  { id: 'mason-taylor', name: 'Mason Taylor', position: 'TE', team: 'LSU Tigers', teamId: 'lsu' },
  { id: 'caden-prieskorn', name: 'Caden Prieskorn', position: 'TE', team: 'Ole Miss Rebels', teamId: 'ole miss' },
  { id: 'harold-fannin-jr', name: 'Harold Fannin Jr.', position: 'TE', team: 'Bowling Green Falcons', teamId: 'bowling green' },
  { id: 'gunnar-helm', name: 'Gunnar Helm', position: 'TE', team: 'Texas Longhorns', teamId: 'texas' },
  { id: 'oronde-gadsden-ii', name: 'Oronde Gadsden II', position: 'TE', team: 'Syracuse Orange', teamId: 'syracuse' },

  // Offensive Linemen
  { id: 'kelvin-banks-jr', name: 'Kelvin Banks Jr.', position: 'OT', team: 'Texas Longhorns', teamId: 'texas' },
  { id: 'will-campbell', name: 'Will Campbell', position: 'OT', team: 'LSU Tigers', teamId: 'lsu' },
  { id: 'aireontae-ersery', name: 'Aireontae Ersery', position: 'OT', team: 'Minnesota Golden Gophers', teamId: 'minnesota' },
  { id: 'josh-simmons', name: 'Josh Simmons', position: 'OT', team: 'Ohio State Buckeyes', teamId: 'ohio state' },
  { id: 'cameron-williams', name: 'Cameron Williams', position: 'OT', team: 'Texas Longhorns', teamId: 'texas' },
  { id: 'donovan-jackson', name: 'Donovan Jackson', position: 'OL', team: 'Ohio State Buckeyes', teamId: 'ohio state' },
  { id: 'tate-ratledge', name: 'Tate Ratledge', position: 'OL', team: 'Georgia Bulldogs', teamId: 'georgia' },
  { id: 'tyler-booker', name: 'Tyler Booker', position: 'OL', team: 'Alabama Crimson Tide', teamId: 'alabama' },
  { id: 'seth-mclaughlin', name: 'Seth McLaughlin', position: 'C', team: 'Ohio State Buckeyes', teamId: 'ohio state' },
  { id: 'jake-majors', name: 'Jake Majors', position: 'C', team: 'Texas Longhorns', teamId: 'texas' },
  { id: 'ozzy-trapilo', name: 'Ozzy Trapilo', position: 'OT', team: 'Boston College Eagles', teamId: 'boston college' },
  { id: 'jonah-savaiinaea', name: 'Jonah Savaiinaea', position: 'OL', team: 'Arizona Wildcats', teamId: 'arizona' },

  // Defensive Linemen / EDGE
  { id: 'james-pearce-jr', name: 'James Pearce Jr.', position: 'EDGE', team: 'Tennessee Volunteers', teamId: 'tennessee' },
  { id: 'abdul-carter', name: 'Abdul Carter', position: 'EDGE', team: 'Penn State Nittany Lions', teamId: 'penn state' },
  { id: 'mason-graham', name: 'Mason Graham', position: 'DT', team: 'Michigan Wolverines', teamId: 'michigan' },
  { id: 'kenneth-grant', name: 'Kenneth Grant', position: 'DT', team: 'Michigan Wolverines', teamId: 'michigan' },
  { id: 'mykel-williams', name: 'Mykel Williams', position: 'EDGE', team: 'Georgia Bulldogs', teamId: 'georgia' },
  { id: 'nic-scourton', name: 'Nic Scourton', position: 'EDGE', team: 'Texas A&M Aggies', teamId: 'texas a&m' },
  { id: 'tyleik-williams', name: 'Tyleik Williams', position: 'DT', team: 'Ohio State Buckeyes', teamId: 'ohio state' },
  { id: 'jer-zhan-newton', name: "Jer'Zhan Newton", position: 'DT', team: 'Illinois Fighting Illini', teamId: 'illinois' },
  { id: 'jack-sawyer', name: 'Jack Sawyer', position: 'DE', team: 'Ohio State Buckeyes', teamId: 'ohio state' },
  { id: 'jt-tuimoloau', name: 'JT Tuimoloau', position: 'DE', team: 'Ohio State Buckeyes', teamId: 'ohio state' },
  { id: 'lt-overton', name: 'LT Overton', position: 'EDGE', team: 'Texas A&M Aggies', teamId: 'texas a&m' },
  { id: 'jaylen-harvey', name: 'Jaylen Harvey', position: 'EDGE', team: 'UCF Knights', teamId: 'ucf' },
  { id: 'landon-jackson', name: 'Landon Jackson', position: 'DE', team: 'Arkansas Razorbacks', teamId: 'arkansas' },
  { id: 'shemar-stewart', name: 'Shemar Stewart', position: 'DT', team: 'Texas A&M Aggies', teamId: 'texas a&m' },

  // Linebackers
  { id: 'harold-perkins-jr', name: 'Harold Perkins Jr.', position: 'LB', team: 'LSU Tigers', teamId: 'lsu' },
  { id: 'jay-higgins', name: 'Jay Higgins', position: 'LB', team: 'Iowa Hawkeyes', teamId: 'iowa' },
  { id: 'danny-stutsman', name: 'Danny Stutsman', position: 'LB', team: 'Oklahoma Sooners', teamId: 'oklahoma' },
  { id: 'barrett-carter', name: 'Barrett Carter', position: 'LB', team: 'Clemson Tigers', teamId: 'clemson' },
  { id: 'jihaad-campbell', name: 'Jihaad Campbell', position: 'LB', team: 'Alabama Crimson Tide', teamId: 'alabama' },
  { id: 'nick-jackson', name: 'Nick Jackson', position: 'LB', team: 'Iowa Hawkeyes', teamId: 'iowa' },
  { id: 'jalon-walker', name: 'Jalon Walker', position: 'LB', team: 'Georgia Bulldogs', teamId: 'georgia' },
  { id: 'lander-barton', name: 'Lander Barton', position: 'LB', team: 'Texas Longhorns', teamId: 'texas' },

  // Cornerbacks
  { id: 'will-johnson', name: 'Will Johnson', position: 'CB', team: 'Michigan Wolverines', teamId: 'michigan' },
  { id: 'benjamin-morrison', name: 'Benjamin Morrison', position: 'CB', team: 'Notre Dame Fighting Irish', teamId: 'notre dame' },
  { id: 'quinyon-mitchell-cfb', name: 'Denzel Burke', position: 'CB', team: 'Ohio State Buckeyes', teamId: 'ohio state' },
  { id: 'jabbar-muhammad', name: 'Jabbar Muhammad', position: 'CB', team: 'Oregon Ducks', teamId: 'oregon' },
  { id: 'nate-wiggins-cfb', name: 'Cobee Bryant', position: 'CB', team: 'Kansas Jayhawks', teamId: 'kansas' },
  { id: 'ricardo-hallman', name: 'Ricardo Hallman', position: 'CB', team: 'Wisconsin Badgers', teamId: 'wisconsin' },
  { id: 'daylen-everette', name: 'Daylen Everette', position: 'CB', team: 'Georgia Bulldogs', teamId: 'georgia' },
  { id: 'kool-aid-mckinstry', name: "Kool-Aid McKinstry", position: 'CB', team: 'Alabama Crimson Tide', teamId: 'alabama' },
  { id: 'dom-henry', name: 'Dom Henry', position: 'CB', team: 'Clemson Tigers', teamId: 'clemson' },
  { id: 'dezjorn-gaither', name: 'Dezjorn Gaither', position: 'CB', team: 'Colorado Buffaloes', teamId: 'colorado' },

  // Safeties
  { id: 'caleb-downs', name: 'Caleb Downs', position: 'S', team: 'Ohio State Buckeyes', teamId: 'ohio state' },
  { id: 'malaki-starks', name: 'Malaki Starks', position: 'S', team: 'Georgia Bulldogs', teamId: 'georgia' },
  { id: 'xavier-watts', name: 'Xavier Watts', position: 'S', team: 'Notre Dame Fighting Irish', teamId: 'notre dame' },
  { id: 'billy-bowman-jr', name: 'Billy Bowman Jr.', position: 'S', team: 'Oklahoma Sooners', teamId: 'oklahoma' },
  { id: 'lathan-ransom', name: 'Lathan Ransom', position: 'S', team: 'Ohio State Buckeyes', teamId: 'ohio state' },
  { id: 'javon-bullard', name: 'Javon Bullard', position: 'S', team: 'Georgia Bulldogs', teamId: 'georgia' },
  { id: 'daxton-hill-cfb', name: 'Andrew Mukuba', position: 'S', team: 'Texas Longhorns', teamId: 'texas' },
  { id: 'rod-moore', name: 'Rod Moore', position: 'S', team: 'Michigan Wolverines', teamId: 'michigan' },

  // Kickers/Punters
  { id: 'graham-nicholson', name: 'Graham Nicholson', position: 'K', team: 'Alabama Crimson Tide', teamId: 'alabama' },
  { id: 'aubrey-serkiz', name: 'Aubrey Serkiz', position: 'K', team: 'Georgia Bulldogs', teamId: 'georgia' },
  { id: 'alex-raynor', name: 'Alex Raynor', position: 'K', team: 'Kentucky Wildcats', teamId: 'kentucky' },
  { id: 'tory-taylor', name: 'Tory Taylor', position: 'P', team: 'Iowa Hawkeyes', teamId: 'iowa' },
];

// PFSN Logo
const PFSN_LOGO_DATA_URL = 'data:image/png;base64,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';


export default function PlayerRankingsClient() {
  // Create team lookup map
  const teamsById = useMemo(() => {
    const map: Record<string, typeof allTeams[0]> = {};
    allTeams.forEach(team => {
      map[team.id] = team;
    });
    return map;
  }, []);

  // Also create a lookup by team name for API data
  const teamsByName = useMemo(() => {
    const map: Record<string, typeof allTeams[0]> = {};
    allTeams.forEach(team => {
      map[team.name.toLowerCase()] = team;
    });
    return map;
  }, []);

  // State
  const [rankings, setRankings] = useState<RankedPlayer[]>([]);
  const [initialTop100, setInitialTop100] = useState<Player[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [rankInput, setRankInput] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [selectedMoveIndex, setSelectedMoveIndex] = useState<number | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [history, setHistory] = useState<RankedPlayer[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showAddPlayerDialog, setShowAddPlayerDialog] = useState(false);
  const [addPlayerSearch, setAddPlayerSearch] = useState('');
  const [allCFBPlayers, setAllCFBPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [playersLoaded, setPlayersLoaded] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  // Logo states for canvas rendering
  const [logoImages, setLogoImages] = useState<Record<string, HTMLImageElement>>({});
  const [logosLoaded, setLogosLoaded] = useState(false);
  const [pfsnLogoImage, setPfsnLogoImage] = useState<HTMLImageElement | null>(null);

  // Save/Load state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [savedRankings, setSavedRankings] = useState<Array<{ name: string; date: string; rankings: RankedPlayer[] }>>([]);
  const [saveNameInput, setSaveNameInput] = useState('');

  // Helper function to save to history
  const saveToHistory = (newRankings: RankedPlayer[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newRankings);
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    setHistory(newHistory);
    setRankings(newRankings);
  };

  // Undo/Redo
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setRankings(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setRankings(history[historyIndex + 1]);
    }
  };

  // Save/Load functionality
  const saveRankingsToLocalStorage = () => {
    if (!saveNameInput.trim()) {
      alert('Please enter a name for your rankings');
      return;
    }

    const saved = {
      name: saveNameInput.trim(),
      date: new Date().toISOString(),
      rankings: rankings
    };

    const existing = localStorage.getItem('cfb-player-rankings');
    const allSaved = existing ? JSON.parse(existing) : [];
    allSaved.push(saved);

    if (allSaved.length > 10) {
      allSaved.shift();
    }

    localStorage.setItem('cfb-player-rankings', JSON.stringify(allSaved));
    setSaveNameInput('');
    setShowSaveDialog(false);
    loadSavedRankings();
    alert('Rankings saved successfully!');
  };

  const loadSavedRankings = () => {
    const saved = localStorage.getItem('cfb-player-rankings');
    if (saved) {
      setSavedRankings(JSON.parse(saved));
    }
  };

  const loadRankings = (savedRanking: { name: string; date: string; rankings: RankedPlayer[] }) => {
    setRankings(savedRanking.rankings);
    setHistory([savedRanking.rankings]);
    setHistoryIndex(0);
    setShowLoadDialog(false);
  };

  const deleteSavedRanking = (index: number) => {
    const saved = localStorage.getItem('cfb-player-rankings');
    if (saved) {
      const allSaved = JSON.parse(saved);
      allSaved.splice(index, 1);
      localStorage.setItem('cfb-player-rankings', JSON.stringify(allSaved));
      loadSavedRankings();
    }
  };

  // Load saved rankings on mount
  useEffect(() => {
    loadSavedRankings();
  }, []);

  // Detect mobile screen size for tap-to-move interface
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load initial top 100 players from API
  useEffect(() => {
    const fetchInitialRankings = async () => {
      try {
        const response = await fetch(getApiPath('api/cfb/stat-leaders'));
        if (response.ok) {
          const data = await response.json();
          const categories = data.categories || [];

          // Flatten and deduplicate players from all categories
          const seenIds = new Set<string>();
          const apiPlayers: Player[] = [];

          for (const category of categories) {
            for (const leader of (category.leaders || [])) {
              if (!seenIds.has(leader.playerId)) {
                seenIds.add(leader.playerId);
                // Find team ID from our teams data
                const teamMatch = allTeams.find(t =>
                  t.name.toLowerCase() === (leader.teamName || '').toLowerCase()
                );
                apiPlayers.push({
                  id: leader.playerId,
                  name: leader.name,
                  position: leader.position || 'ATH',
                  team: leader.teamName || 'Unknown',
                  teamId: teamMatch?.id || '',
                  classYear: leader.classYear,
                });
              }
            }
          }

          if (apiPlayers.length > 0) {
            setInitialTop100(apiPlayers.slice(0, 100));
            setAllCFBPlayers(apiPlayers);
            setPlayersLoaded(true);

            // Set initial rankings from top players
            const initialRankings = apiPlayers.slice(0, 100).map((player: Player, index: number) => ({
              rank: index + 1,
              player
            }));
            setRankings(initialRankings);
            setHistory([initialRankings]);
            setHistoryIndex(0);
          } else {
            throw new Error('No players returned from API');
          }
        } else {
          throw new Error('API request failed');
        }
      } catch (error) {
        console.error('Error fetching initial rankings:', error);
        // Fall back to static list if API fails
        const fallbackRankings = TOP_100_PLAYERS.map((player, index) => ({
          rank: index + 1,
          player
        }));
        setRankings(fallbackRankings);
        setHistory([fallbackRankings]);
        setHistoryIndex(0);
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchInitialRankings();
  }, []);

  // Pre-load team logos
  useEffect(() => {
    const preloadLogos = async () => {
      const images: Record<string, HTMLImageElement> = {};

      // Load PFSN logo
      const pfsnImg = document.createElement('img');
      await new Promise<void>((resolve) => {
        pfsnImg.onload = () => resolve();
        pfsnImg.onerror = () => resolve();
        pfsnImg.src = PFSN_LOGO_DATA_URL;
      });
      setPfsnLogoImage(pfsnImg);

      await Promise.all(
        allTeams.map(async (team) => {
          try {
            const logoUrl = getTeamLogo(team.id);
            const response = await fetch(logoUrl);
            if (!response.ok) throw new Error('Failed to fetch logo');

            const blob = await response.blob();
            const dataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });

            const img = document.createElement('img');
            await new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
              img.src = dataUrl;
            });
            images[team.id] = img;
          } catch (error) {
            console.error(`Failed to preload logo for ${team.name}:`, error);
          }
        })
      );

      setLogoImages(images);
      setLogosLoaded(true);
    };

    preloadLogos();
  }, []);

  // Fetch all CFB players when Add Player dialog is opened
  useEffect(() => {
    if (showAddPlayerDialog && !playersLoaded && !loadingPlayers) {
      const fetchAllPlayers = async () => {
        setLoadingPlayers(true);
        try {
          const response = await fetch(getApiPath('api/cfb/stat-leaders'));
          if (response.ok) {
            const data = await response.json();
            const categories = data.categories || [];
            const seenIds = new Set<string>();
            const apiPlayers: Player[] = [];

            for (const category of categories) {
              for (const leader of (category.leaders || [])) {
                if (!seenIds.has(leader.playerId)) {
                  seenIds.add(leader.playerId);
                  const teamMatch = allTeams.find(t =>
                    t.name.toLowerCase() === (leader.teamName || '').toLowerCase()
                  );
                  apiPlayers.push({
                    id: leader.playerId,
                    name: leader.name,
                    position: leader.position || 'ATH',
                    team: leader.teamName || 'Unknown',
                    teamId: teamMatch?.id || '',
                    classYear: leader.classYear,
                  });
                }
              }
            }

            setAllCFBPlayers(apiPlayers);
            setPlayersLoaded(true);
          }
        } catch (error) {
          console.error('Error fetching all players:', error);
        } finally {
          setLoadingPlayers(false);
        }
      };
      fetchAllPlayers();
    }
  }, [showAddPlayerDialog, playersLoaded, loadingPlayers]);

  // Filter rankings by position
  const filteredRankings = useMemo(() => {
    let filtered = rankings;

    if (selectedPosition !== 'All') {
      const positions = POSITION_GROUPS[selectedPosition] || [];
      filtered = filtered.filter(r => positions.includes(r.player.position));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.player.name.toLowerCase().includes(query) ||
        r.player.team.toLowerCase().includes(query) ||
        r.player.position.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [rankings, selectedPosition, searchQuery]);

  // Available players for adding (not in rankings)
  const filteredAvailablePlayers = useMemo(() => {
    const rankedIds = new Set(rankings.map(r => r.player.id));
    // Use all CFB players from API, or fall back to TOP_100 if not loaded yet
    const playerPool = playersLoaded ? allCFBPlayers : TOP_100_PLAYERS;
    let available = playerPool.filter(p => !rankedIds.has(p.id));

    if (addPlayerSearch.trim()) {
      const query = addPlayerSearch.toLowerCase();
      available = available.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.team.toLowerCase().includes(query) ||
        p.position.toLowerCase().includes(query)
      );
    }

    // Limit results to 25 for better UX - users can search for specific players
    return available.slice(0, 25);
  }, [rankings, addPlayerSearch, allCFBPlayers, playersLoaded]);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDragOverIndex(null);
      return;
    }

    const newRankings = [...rankings];
    const draggedItem = newRankings[draggedIndex];
    newRankings.splice(draggedIndex, 1);
    newRankings.splice(dropIndex, 0, draggedItem);

    const updatedRankings = newRankings.map((item, index) => ({
      ...item,
      rank: index + 1
    }));

    saveToHistory(updatedRankings);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Rank editing
  const handleRankClick = (index: number) => {
    setEditingIndex(index);
    setRankInput(String(index + 1));
  };

  const handleRankSubmit = (index: number) => {
    const rankNum = parseInt(rankInput);
    if (isNaN(rankNum) || rankNum < 1 || rankNum > rankings.length) {
      setEditingIndex(null);
      setRankInput('');
      return;
    }

    if (rankNum !== index + 1) {
      const newIndex = rankNum - 1;
      const newRankings = [...rankings];
      const item = newRankings[index];
      newRankings.splice(index, 1);
      newRankings.splice(newIndex, 0, item);

      const updatedRankings = newRankings.map((item, idx) => ({
        ...item,
        rank: idx + 1
      }));

      saveToHistory(updatedRankings);
    }

    setEditingIndex(null);
    setRankInput('');
  };

  const handleRankKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      handleRankSubmit(index);
    } else if (e.key === 'Escape') {
      setEditingIndex(null);
      setRankInput('');
    }
  };

  // Mobile: Move player up one position
  const moveUp = (index: number) => {
    if (index <= 0) return;
    const newRankings = [...rankings];
    const item = newRankings[index];
    newRankings.splice(index, 1);
    newRankings.splice(index - 1, 0, item);
    const updatedRankings = newRankings.map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));
    saveToHistory(updatedRankings);
    setSelectedMoveIndex(index - 1);
  };

  // Mobile: Move player down one position
  const moveDown = (index: number) => {
    if (index >= rankings.length - 1) return;
    const newRankings = [...rankings];
    const item = newRankings[index];
    newRankings.splice(index, 1);
    newRankings.splice(index + 1, 0, item);
    const updatedRankings = newRankings.map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));
    saveToHistory(updatedRankings);
    setSelectedMoveIndex(index + 1);
  };

  // Mobile: Handle row tap to select for moving
  const handleRowTap = (index: number) => {
    if (!isMobile) return;
    if (selectedMoveIndex === index) {
      setSelectedMoveIndex(null);
    } else {
      setSelectedMoveIndex(index);
    }
  };

  // Remove player from rankings
  const removePlayer = (index: number) => {
    const newRankings = [...rankings];
    newRankings.splice(index, 1);
    const updatedRankings = newRankings.map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));
    saveToHistory(updatedRankings);
  };

  // Add player to rankings
  const addPlayer = (player: Player) => {
    const newRankings = [...rankings, { rank: rankings.length + 1, player }];
    saveToHistory(newRankings);
    setShowAddPlayerDialog(false);
    setAddPlayerSearch('');
  };

  // Generate canvas for download
  const generateCanvas = (selectedPlayers: RankedPlayer[]) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const canvasWidth = 1000;
    const dpr = 2;

    let yPos = 20;
    const headerHeight = 78;

    let gap = 20;
    const containerHeight = 64;
    let playersPerRow = 1;
    let containerWidth = canvasWidth - (gap * 2);

    if (selectedPlayers.length > 10 && selectedPlayers.length <= 25) {
      playersPerRow = 2;
      containerWidth = (canvasWidth - (gap * 3)) / 2;
    } else if (selectedPlayers.length > 25) {
      playersPerRow = 4;
      gap = 12;
      containerWidth = (canvasWidth - (gap * 5)) / 4;
    }

    const totalRows = Math.ceil(selectedPlayers.length / playersPerRow);
    const playersContentHeight = totalRows * containerHeight + (totalRows - 1) * gap;
    const footerHeight = 64;
    const bottomPadding = 30;
    const canvasHeight = yPos + headerHeight + playersContentHeight + bottomPadding + footerHeight;

    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic 900 38px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    const headerText = 'MY CFB PLAYER RANKINGS';
    const headerWidth = ctx.measureText(headerText).width;
    ctx.fillText(headerText, (canvasWidth - headerWidth) / 2, yPos + 38);
    yPos += headerHeight;

    // Draw players
    selectedPlayers.forEach((rankedPlayer, i) => {
      const totalRows = Math.ceil(selectedPlayers.length / playersPerRow);
      const col = Math.floor(i / totalRows);
      const row = i % totalRows;

      let xPos = gap + (col * (containerWidth + gap));
      if (playersPerRow === 1) {
        xPos = (canvasWidth - containerWidth) / 2;
      }

      const playerYPos = yPos + (row * (containerHeight + gap));

      // White card background
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(xPos, playerYPos, containerWidth, containerHeight, 12);
      ctx.fill();

      // Rank number
      const paddingX = 20;
      const containerCenterY = playerYPos + containerHeight / 2;
      ctx.fillStyle = '#000000';
      ctx.font = 'italic 900 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      const rankTextY = containerCenterY + 10;
      ctx.fillText(String(rankedPlayer.rank), xPos + paddingX, rankTextY);

      const rankWidth = ctx.measureText(String(rankedPlayer.rank)).width;

      // Player name and position
      ctx.fillStyle = '#000000';
      const baseFontSize = selectedPlayers.length > 25 ? 14 : (selectedPlayers.length > 10 ? 16 : 20);

      // Calculate available width for name (container - padding - rank - gap - logo - logo padding)
      const logoSize = 48;
      const availableWidth = containerWidth - paddingX - rankWidth - 20 - logoSize - 20;

      // Measure name and reduce font size if needed
      let fontSize = baseFontSize;
      const playerName = rankedPlayer.player.name;
      ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

      while (ctx.measureText(playerName).width > availableWidth && fontSize > 10) {
        fontSize -= 1;
        ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      }

      const nameY = containerCenterY + (fontSize * 0.35);
      ctx.fillText(playerName, xPos + paddingX + rankWidth + 20, nameY);

      // Team logo
      const team = teamsById[rankedPlayer.player.teamId];
      const img = team ? logoImages[team.id] : null;
      if (img) {
        const logoSize = 48;
        const logoX = xPos + containerWidth - logoSize - 12;
        const logoY = playerYPos + (containerHeight - logoSize) / 2;
        ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
      }
    });

    // Footer
    const footerY = canvasHeight - 64;
    ctx.fillStyle = '#0050A0';
    ctx.fillRect(0, footerY, canvasWidth, 64);

    const footerPadding = 30;
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText('Created with CFB HQ', footerPadding, footerY + 38);

    if (pfsnLogoImage) {
      const logoSize = 44;
      const logoX = canvasWidth - footerPadding - logoSize;
      const logoY = footerY + (64 - logoSize) / 2;
      ctx.drawImage(pfsnLogoImage, logoX, logoY, logoSize, logoSize);
    }

    return canvas;
  };

  const handleDownload = async (count: 10 | 25 | 50) => {
    if (!logosLoaded) {
      alert('Logos are still loading. Please wait a moment and try again.');
      return;
    }

    setShowActionsMenu(false);
    setIsDownloading(true);

    try {
      const selectedPlayers = rankings.slice(0, count);
      const canvas = generateCanvas(selectedPlayers);

      if (!canvas) {
        throw new Error('Failed to generate canvas');
      }

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile) {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            throw new Error('Failed to create image blob');
          }

          const fileName = `CFB_Player_Rankings_${Date.now()}.png`;

          if (navigator.share && navigator.canShare) {
            const file = new File([blob], fileName, { type: 'image/png' });

            if (navigator.canShare({ files: [file] })) {
              try {
                await navigator.share({
                  files: [file],
                  title: 'My CFB Player Rankings',
                  text: 'Check out my CFB Player Rankings!'
                });
                setIsDownloading(false);
                return;
              } catch (err) {
                console.log('Share cancelled or failed:', err);
              }
            }
          }

          const url = URL.createObjectURL(blob);
          const newWindow = window.open(url, '_blank');

          if (newWindow) {
            setTimeout(() => URL.revokeObjectURL(url), 100);
          } else {
            const link = document.createElement('a');
            link.download = fileName;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
          }

          setIsDownloading(false);
        }, 'image/png', 1.0);
      } else {
        const link = document.createElement('a');
        link.download = `CFB_Player_Rankings_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
        setIsDownloading(false);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Failed to generate image. Please try again.');
      setIsDownloading(false);
    }
  };

  const resetRankings = () => {
    // Use initialTop100 from API, or fall back to static list
    const sourceList = initialTop100.length > 0 ? initialTop100 : TOP_100_PLAYERS;
    const newRankings = sourceList.map((player, index) => ({
      rank: index + 1,
      player
    }));
    saveToHistory(newRankings);
    setShowResetDialog(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      if (e.key === 'Escape') {
        setShowActionsMenu(false);
        setShowAddPlayerDialog(false);
        setSelectedMoveIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false);
      }
    };

    if (showActionsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showActionsMenu]);

  return (
    <>
      <main id="main-content" className="pt-[48px] lg:pt-0">
        {/* Header */}
        <header
          className="text-white shadow-lg"
          style={{
            background: 'linear-gradient(180deg, #0050A0 0%, #003a75 100%)',
            boxShadow: 'inset 0 -30px 40px -30px rgba(0,0,0,0.15), 0 4px 6px -1px rgba(0,0,0,0.1)'
          }}
        >
          <div className="container mx-auto px-4 pt-6 sm:pt-7 md:pt-8 lg:pt-10 pb-3 sm:pb-4 md:pb-5 lg:pb-6">
            <h1 className="text-4xl lg:text-5xl font-extrabold mb-2">Player Rankings Builder</h1>
            <p className="text-lg opacity-90 font-medium">Create and share your own CFB player rankings</p>
          </div>
        </header>
        <TransferPortalBanner />
        <RaptiveHeaderAd />

        {/* Content */}
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-[1200px]">
          {loadingInitial ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <svg className="animate-spin w-12 h-12 mx-auto text-[#0050A0] mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600 text-lg">Loading top CFB players...</p>
            </div>
          ) : (
          <>
          {/* Instructions */}
          <div className="bg-[#0050A0]/10 border border-[#0050A0]/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-[#003A75]">
              <strong>How to use:</strong> {isMobile ? 'Tap a player to select, then use the arrow buttons to move up or down. Tap the rank number to jump to a specific position.' : 'Drag and drop players to reorder, or click the rank number to move to a specific position.'} Use the X button to remove players. Use filters to view by position.
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Position Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                {Object.keys(POSITION_GROUPS).map(group => (
                  <button
                    key={group}
                    onClick={() => setSelectedPosition(group)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                      selectedPosition === group
                        ? 'bg-[#0050A0] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {group}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative w-full lg:w-64">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Player"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0] bg-white text-sm"
                />
              </div>
            </div>
          </div>

          {/* Rankings Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Table Header with Actions */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex flex-wrap gap-3 justify-between items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">Player Rankings</h2>
                <span className="text-sm text-gray-500">({filteredRankings.length} players)</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 disabled:bg-gray-200 disabled:text-gray-600 text-gray-700 rounded-lg transition-colors font-medium flex items-center gap-1.5 cursor-pointer"
                  title="Undo (Ctrl/Cmd+Z)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  Undo
                </button>
                <button
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 disabled:bg-gray-200 disabled:text-gray-600 text-gray-700 rounded-lg transition-colors font-medium flex items-center gap-1.5 cursor-pointer"
                  title="Redo (Ctrl/Cmd+Shift+Z)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                  </svg>
                  Redo
                </button>
                <button
                  onClick={() => setShowAddPlayerDialog(true)}
                  className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Player
                </button>
                <button
                  onClick={() => setShowResetDialog(true)}
                  className="px-3 py-1.5 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium cursor-pointer"
                >
                  Reset
                </button>

                {/* More Actions Dropdown */}
                <div className="relative" ref={actionsMenuRef}>
                  <button
                    onClick={() => setShowActionsMenu(!showActionsMenu)}
                    disabled={isDownloading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#0050A0] hover:bg-[#003A75] active:scale-[0.98] disabled:bg-[#0050A0]/50 text-white rounded-lg font-medium transition-all cursor-pointer"
                  >
                    {isDownloading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Share
                      </>
                    )}
                  </button>

                  {/* Actions Menu Dropdown */}
                  {showActionsMenu && !isDownloading && (
                    <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="py-2">
                        {/* Save */}
                        <button
                          onClick={() => {
                            setShowActionsMenu(false);
                            setShowSaveDialog(true);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700 transition-colors flex items-center gap-3"
                        >
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                          <span className="font-medium">Save Rankings</span>
                        </button>

                        {/* Load */}
                        <button
                          onClick={() => {
                            setShowActionsMenu(false);
                            setShowLoadDialog(true);
                          }}
                          disabled={savedRankings.length === 0}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700 disabled:text-gray-400 disabled:hover:bg-white transition-colors flex items-center gap-3"
                        >
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          <span className="font-medium">Load Rankings</span>
                          {savedRankings.length > 0 && (
                            <span className="ml-auto text-xs text-gray-400">({savedRankings.length})</span>
                          )}
                        </button>

                        {/* Divider */}
                        <div className="border-t border-gray-200 my-2"></div>

                        {/* Download Options */}
                        <div className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Download Image</div>
                        <button
                          onClick={() => handleDownload(10)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700 transition-colors flex items-center gap-3"
                        >
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          <span className="font-medium">Top 10 Players</span>
                        </button>
                        <button
                          onClick={() => handleDownload(25)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700 transition-colors flex items-center gap-3"
                        >
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          <span className="font-medium">Top 25 Players</span>
                        </button>
                        <button
                          onClick={() => handleDownload(50)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700 transition-colors flex items-center gap-3"
                        >
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          <span className="font-medium">Top 50 Players</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0050A0] text-white">
                  <tr>
                    <th scope="col" className="pl-3 sm:pl-6 pr-2 sm:pr-4 py-3 text-left text-xs sm:text-sm font-bold w-16 sm:w-20">Rank</th>
                    <th scope="col" className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-bold">Player</th>
                    <th scope="col" className="hidden sm:table-cell px-3 py-3 text-center text-sm font-bold w-16">Pos</th>
                    <th scope="col" className="hidden md:table-cell px-3 py-3 text-left text-sm font-bold w-44">Team</th>
                    <th scope="col" className="hidden lg:table-cell px-3 py-3 text-center text-sm font-bold w-20">Class</th>
                    <th scope="col" className="px-3 py-3 text-center text-sm font-bold w-16">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRankings.map((rankedPlayer, index) => {
                    const team = teamsById[rankedPlayer.player.teamId];
                    const isSelectedForMove = selectedMoveIndex === index;
                    return (
                      <tr
                        key={rankedPlayer.player.id}
                        draggable={!isMobile}
                        onDragStart={(e) => !isMobile && handleDragStart(e, index)}
                        onDragEnd={(e) => !isMobile && handleDragEnd(e)}
                        onDragOver={(e) => !isMobile && handleDragOver(e, index)}
                        onDragLeave={() => !isMobile && handleDragLeave()}
                        onDrop={(e) => !isMobile && handleDrop(e, index)}
                        onClick={() => handleRowTap(index)}
                        className={`
                          border-b border-gray-200 transition-all duration-300 ease-in-out relative
                          ${isMobile ? 'cursor-pointer' : 'cursor-move'}
                          ${draggedIndex === index ? 'opacity-50 scale-95' : 'scale-100'}
                          ${dragOverIndex === index ? 'bg-[#0050A0]/10 shadow-lg' : 'hover:bg-gray-50'}
                          ${isSelectedForMove ? 'bg-[#0050A0]/10 ring-2 ring-[#0050A0]/50 ring-inset' : ''}
                          border-l-4
                        `}
                        style={{
                          borderLeftColor: '#0050A0',
                          backgroundColor: isSelectedForMove ? '#eff6ff' : undefined
                        }}
                      >
                        {/* Rank Number (Editable) */}
                        <td className="pl-3 sm:pl-6 pr-2 sm:pr-4 py-3 sm:py-4">
                          <div className="flex items-center justify-center">
                            {editingIndex === index ? (
                              <input
                                type="number"
                                value={rankInput}
                                onChange={(e) => setRankInput(e.target.value)}
                                onBlur={() => handleRankSubmit(index)}
                                onKeyDown={(e) => handleRankKeyDown(e, index)}
                                autoFocus
                                min={1}
                                max={rankings.length}
                                className="w-14 h-11 px-2 text-center text-lg font-bold border-2 border-[#0050A0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0]"
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRankClick(index);
                                }}
                                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gray-100 flex items-center justify-center hover:bg-[#0050A0]/10 active:bg-[#0050A0]/20 hover:ring-2 hover:ring-[#0050A0]/30 cursor-pointer transition-all"
                                title="Click to edit rank"
                              >
                                <span className="text-base sm:text-lg font-bold text-gray-900">
                                  {rankedPlayer.rank}
                                </span>
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Player Info */}
                        <td className="px-2 sm:px-4 py-3 sm:py-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            {/* Player Headshot */}
                            <PlayerAvatar
                              playerId={rankedPlayer.player.id}
                              playerName={rankedPlayer.player.name}
                              teamColor={'#0050A0'}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                {rankedPlayer.player.name}
                              </div>
                              <div className="sm:hidden text-xs text-gray-500">
                                {rankedPlayer.player.position} - {rankedPlayer.player.team}
                              </div>
                            </div>
                            {/* Mobile: Up/Down arrows when row is selected */}
                            {isMobile && isSelectedForMove && (
                              <div className="flex gap-1 ml-auto">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveUp(index);
                                  }}
                                  disabled={index === 0}
                                  className="w-10 h-10 rounded-lg bg-[#0050A0] hover:bg-[#003A75] disabled:bg-gray-300 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
                                  aria-label="Move up"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveDown(index);
                                  }}
                                  disabled={index === rankings.length - 1}
                                  className="w-10 h-10 rounded-lg bg-[#0050A0] hover:bg-[#003A75] disabled:bg-gray-300 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
                                  aria-label="Move down"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Position */}
                        <td className="hidden sm:table-cell px-3 py-4 text-center">
                          <span className="text-xs font-semibold text-gray-900">
                            {rankedPlayer.player.position}
                          </span>
                        </td>

                        {/* Team */}
                        <td className="hidden md:table-cell px-3 py-4">
                          <div className="flex items-center gap-2">
                            {team && (
                              <img
                                src={getTeamLogo(team.id)}
                                alt={team.name}
                                className="w-6 h-6 object-contain flex-shrink-0"
                              />
                            )}
                            <span className="text-sm text-gray-700 truncate">{rankedPlayer.player.team}</span>
                          </div>
                        </td>

                        {/* Class Year */}
                        <td className="hidden lg:table-cell px-3 py-4 text-center">
                          <span className="text-sm text-gray-700">
                            {rankedPlayer.player.classYear || '-'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removePlayer(index);
                            }}
                            className="p-2.5 -m-1 text-red-500 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors"
                            title="Remove player"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          </>
          )}
        </div>
      </main>

      {/* Reset Confirmation Dialog */}
      {showResetDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Reset Rankings?</h3>
                <p className="text-sm text-gray-600">This will restore the default player rankings.</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowResetDialog(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={resetRankings}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium cursor-pointer"
              >
                Reset Rankings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Player Dialog */}
      {showAddPlayerDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Add Player to Rankings</h3>
              <button
                onClick={() => {
                  setShowAddPlayerDialog(false);
                  setAddPlayerSearch('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <input
              type="text"
              value={addPlayerSearch}
              onChange={(e) => setAddPlayerSearch(e.target.value)}
              placeholder="Search players by name, team, or position..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0] mb-4"
            />
            {loadingPlayers ? (
              <div className="text-center py-8">
                <svg className="animate-spin w-8 h-8 mx-auto text-[#0050A0] mb-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-600">Loading all CFB players...</p>
              </div>
            ) : filteredAvailablePlayers.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                {addPlayerSearch.trim() ? 'No players found matching your search.' : 'No available players to add.'}
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredAvailablePlayers.map((player) => {
                  const team = teamsById[player.teamId];
                  return (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-[#0050A0] hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3">
                        {team && (
                          <img
                            src={getTeamLogo(team.id)}
                            alt={team.name}
                            className="w-8 h-8 object-contain"
                          />
                        )}
                        <div>
                          <div className="font-semibold text-gray-900">{player.name}</div>
                          <div className="text-sm text-gray-500">
                            {player.position} - {player.team}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => addPlayer(player)}
                        className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Rankings Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Save Rankings</h3>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              Give your rankings a name to save them for later.
            </p>
            <input
              type="text"
              value={saveNameInput}
              onChange={(e) => setSaveNameInput(e.target.value)}
              placeholder="e.g., My CFB Player Rankings 2025"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
              maxLength={50}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={saveRankingsToLocalStorage}
                className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors font-medium cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Rankings Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Load Saved Rankings</h3>
              <button
                onClick={() => setShowLoadDialog(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {savedRankings.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No saved rankings yet.</p>
            ) : (
              <div className="space-y-3">
                {savedRankings.map((saved, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-500 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{saved.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(saved.date).toLocaleDateString()} at {new Date(saved.date).toLocaleTimeString()}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {saved.rankings.length} players
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => loadRankings(saved)}
                          className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium cursor-pointer"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this saved ranking?')) {
                              deleteSavedRanking(index);
                            }
                          }}
                          className="px-3 py-1.5 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors font-medium cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowLoadDialog(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer currentPage="Player Rankings Builder" />
    </>
  );
}
