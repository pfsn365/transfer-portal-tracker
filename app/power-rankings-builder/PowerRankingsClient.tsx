'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Footer from '@/components/Footer';
import PowerRankingsSkeleton from '@/components/PowerRankingsSkeleton';
import { getApiPath } from '@/utils/api';

interface TeamWithRecord {
  id: string;
  name: string;
  conference: string;
  logo: string;
  wins: number;
  losses: number;
  conferenceWins?: number;
  conferenceLosses?: number;
}

interface RankedTeam {
  rank: number;
  team: TeamWithRecord;
}

interface PollRanking {
  rank: number;
  teamName: string;
  teamId?: string;
}

// FBS conferences for filtering (names must match ESPN shortNames exactly)
const FBS_CONFERENCES = ['All', 'SEC', 'Big Ten', 'Big 12', 'ACC', 'American', 'Mountain West', 'Sun Belt', 'MAC', 'CUSA', 'FBS Indep.'];

// FCS conferences for filtering (names match ESPN shortNames)
const FCS_CONFERENCES = ['All', 'Big Sky', 'CAA', 'MVFC', 'Southland', 'OVC-Big South', 'Southern', 'SWAC', 'MEAC', 'Pioneer', 'Patriot', 'Ivy', 'NEC', 'UAC', 'FCS Indep.'];

// Conference colors and formatting
const CONFERENCE_STYLES: Record<string, { color: string; display: string }> = {
  // FBS conferences
  'SEC': { color: 'bg-yellow-100 text-yellow-800', display: 'SEC' },
  'Big Ten': { color: 'bg-blue-100 text-blue-800', display: 'Big Ten' },
  'Big 12': { color: 'bg-red-100 text-red-800', display: 'Big 12' },
  'ACC': { color: 'bg-orange-100 text-orange-800', display: 'ACC' },
  'American': { color: 'bg-purple-100 text-purple-800', display: 'AAC' },
  'Mountain West': { color: 'bg-cyan-100 text-cyan-800', display: 'MWC' },
  'Sun Belt': { color: 'bg-green-100 text-green-800', display: 'SBC' },
  'MAC': { color: 'bg-teal-100 text-teal-800', display: 'MAC' },
  'CUSA': { color: 'bg-indigo-100 text-indigo-800', display: 'CUSA' },
  'FBS Indep.': { color: 'bg-gray-200 text-gray-700', display: 'IND' },
  // FCS conferences (match ESPN shortNames)
  'Big Sky': { color: 'bg-sky-100 text-sky-800', display: 'Big Sky' },
  'CAA': { color: 'bg-emerald-100 text-emerald-800', display: 'CAA' },
  'MVFC': { color: 'bg-rose-100 text-rose-800', display: 'MVFC' },
  'Southland': { color: 'bg-amber-100 text-amber-800', display: 'Southland' },
  'OVC-Big South': { color: 'bg-violet-100 text-violet-800', display: 'OVC' },
  'Southern': { color: 'bg-lime-100 text-lime-800', display: 'Southern' },
  'SWAC': { color: 'bg-fuchsia-100 text-fuchsia-800', display: 'SWAC' },
  'MEAC': { color: 'bg-pink-100 text-pink-800', display: 'MEAC' },
  'Pioneer': { color: 'bg-stone-100 text-stone-800', display: 'Pioneer' },
  'Patriot': { color: 'bg-blue-100 text-blue-800', display: 'Patriot' },
  'Ivy': { color: 'bg-green-100 text-green-800', display: 'Ivy' },
  'NEC': { color: 'bg-slate-100 text-slate-800', display: 'NEC' },
  'UAC': { color: 'bg-red-100 text-red-800', display: 'UAC' },
  'FCS Indep.': { color: 'bg-gray-200 text-gray-700', display: 'IND' },
};

const getConferenceStyle = (conf: string) => {
  // Try exact match first
  if (CONFERENCE_STYLES[conf]) return CONFERENCE_STYLES[conf];

  // Try partial match
  for (const [key, value] of Object.entries(CONFERENCE_STYLES)) {
    if (conf.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(conf.toLowerCase())) {
      return value;
    }
  }

  return { color: 'bg-gray-100 text-gray-800', display: conf };
};

export default function PowerRankingsClient() {
  const [rankings, setRankings] = useState<RankedTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [rankInput, setRankInput] = useState('');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [history, setHistory] = useState<RankedTeam[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [savedRankings, setSavedRankings] = useState<Array<{ name: string; date: string; rankings: RankedTeam[] }>>([]);
  const [saveNameInput, setSaveNameInput] = useState('');
  const [logoImages, setLogoImages] = useState<Record<string, HTMLImageElement>>({});
  const [logosLoaded, setLogosLoaded] = useState(false);
  const [allTeams, setAllTeams] = useState<TeamWithRecord[]>([]);
  const [conferenceFilter, setConferenceFilter] = useState('All');
  const [conferenceRankings, setConferenceRankings] = useState<Record<string, RankedTeam[]>>({});
  const [showAddTeamDialog, setShowAddTeamDialog] = useState(false);
  const [addTeamSearch, setAddTeamSearch] = useState('');
  const [division, setDivision] = useState<'fbs' | 'fcs'>('fbs');

  // New state for enhanced features
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [showEditMenu, setShowEditMenu] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showCompareMode, setShowCompareMode] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<'ap' | 'coaches' | 'cfp'>('ap');
  const [pollRankings, setPollRankings] = useState<PollRanking[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  const exportMenuRef = useRef<HTMLDivElement>(null);
  const templateMenuRef = useRef<HTMLDivElement>(null);
  const editMenuRef = useRef<HTMLDivElement>(null);
  const fileMenuRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  // Get current conferences based on division
  const currentConferences = division === 'fbs' ? FBS_CONFERENCES : FCS_CONFERENCES;

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (rankings.length === 0) return;

    const autoSave = () => {
      localStorage.setItem('cfb-power-rankings-draft', JSON.stringify({
        rankings,
        division,
        timestamp: Date.now()
      }));
    };

    const interval = setInterval(autoSave, 30000);
    // Also save on changes
    autoSave();

    return () => clearInterval(interval);
  }, [rankings, division]);

  // Fetch standings and build rankings
  useEffect(() => {
    async function fetchStandings() {
      try {
        setLoading(true);
        setConferenceFilter('All');
        setSelectedTeams(new Set());
        const group = division === 'fbs' ? '80' : '81';
        const response = await fetch(getApiPath(`api/cfb/standings?group=${group}`));
        if (!response.ok) throw new Error('Failed to fetch standings');

        const data = await response.json();
        const conferences = data.conferences || [];

        // Build team list from all conferences
        const teams: TeamWithRecord[] = [];
        for (const conf of conferences) {
          for (const team of conf.teams) {
            // Normalize conference name
            let confName = conf.shortName || conf.name;
            // FBS conferences
            if (confName.includes('SEC') || confName === 'Southeastern') confName = 'SEC';
            else if (confName.includes('Big Ten') || confName === 'B1G') confName = 'Big Ten';
            else if (confName.includes('Big 12') || confName === 'XII') confName = 'Big 12';
            else if (confName.includes('ACC') || confName === 'Atlantic Coast') confName = 'ACC';
            else if (confName.includes('American') || confName.includes('AAC')) confName = 'American';
            else if (confName.includes('Mountain West') || confName.includes('MWC') || confName === 'MW') confName = 'Mountain West';
            else if (confName.includes('Sun Belt') || confName === 'SBC') confName = 'Sun Belt';
            else if (confName.includes('MAC') || confName.includes('Mid-American')) confName = 'MAC';
            else if (confName.includes('Conference USA') || confName.includes('C-USA') || confName.includes('CUSA')) confName = 'CUSA';
            else if (confName.includes('FBS Indep') || confName.includes('FBS Independent') || confName === 'Ind') confName = 'FBS Indep.';
            // FCS conferences
            else if (confName.includes('Big Sky')) confName = 'Big Sky';
            else if (confName.includes('CAA') || confName.includes('Coastal Athletic')) confName = 'CAA';
            else if (confName.includes('MVFC') || confName.includes('Missouri Valley')) confName = 'MVFC';
            else if (confName.includes('Southland')) confName = 'Southland';
            else if (confName.includes('OVC-Big South') || confName.includes('OVC') || confName.includes('Big South')) confName = 'OVC-Big South';
            else if (confName.includes('Southern Conference') || confName === 'Southern') confName = 'Southern';
            else if (confName.includes('SWAC') || confName.includes('Southwestern Athletic')) confName = 'SWAC';
            else if (confName.includes('MEAC') || confName.includes('Mid-Eastern')) confName = 'MEAC';
            else if (confName.includes('Pioneer')) confName = 'Pioneer';
            else if (confName.includes('Patriot')) confName = 'Patriot';
            else if (confName.includes('Ivy')) confName = 'Ivy';
            else if (confName.includes('NEC') || confName.includes('Northeast')) confName = 'NEC';
            else if (confName.includes('UAC') || confName.includes('United Athletic')) confName = 'UAC';
            else if (confName.includes('FCS Indep') || confName.includes('FCS Independent')) confName = 'FCS Indep.';

            teams.push({
              id: team.id,
              name: team.name,
              conference: confName,
              logo: team.logo,
              wins: team.wins || 0,
              losses: team.losses || 0,
              conferenceWins: team.conferenceWins,
              conferenceLosses: team.conferenceLosses,
            });
          }
        }

        setAllTeams(teams);

        // Sort by wins (best first)
        teams.sort((a, b) => {
          if (b.wins !== a.wins) return b.wins - a.wins;
          return a.losses - b.losses;
        });

        // For FBS: Take top 25 for initial rankings (Power 4 teams preferred)
        let teamsToRank = teams;
        if (division === 'fbs') {
          const power4Conferences = ['SEC', 'Big Ten', 'Big 12', 'ACC'];
          const power4Teams = teams.filter(t =>
            power4Conferences.some(conf =>
              t.conference.toLowerCase().includes(conf.toLowerCase()) ||
              conf.toLowerCase().includes(t.conference.toLowerCase())
            )
          );
          teamsToRank = power4Teams.length >= 25 ? power4Teams : teams;
        }
        const top25 = teamsToRank.slice(0, 25);
        const ranked = top25.map((team, index) => ({
          rank: index + 1,
          team
        }));

        setRankings(ranked);
        setHistory([ranked]);
        setHistoryIndex(0);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching standings:', err);
        setLoading(false);
      }
    }

    fetchStandings();
    loadSavedRankings();
  }, [division]);

  // Pre-load logos
  useEffect(() => {
    if (rankings.length === 0) return;

    const preloadLogos = async () => {
      const images: Record<string, HTMLImageElement> = {};

      await Promise.all(
        rankings.map(async ({ team }) => {
          try {
            const img = document.createElement('img');
            img.crossOrigin = 'anonymous';
            await new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
              img.src = team.logo;
            });
            images[team.id] = img;
          } catch {
            console.error(`Failed to preload logo for ${team.name}`);
          }
        })
      );

      setLogoImages(images);
      setLogosLoaded(true);
    };

    preloadLogos();
  }, [rankings.length]);

  // Save to history
  const saveToHistory = useCallback((newRankings: RankedTeam[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newRankings);
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
    setRankings(newRankings);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setRankings(history[historyIndex - 1]);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setRankings(history[historyIndex + 1]);
    }
  }, [historyIndex, history]);

  // Move team up/down (for mobile and keyboard)
  const moveTeam = useCallback((index: number, direction: 'up' | 'down') => {
    const sourceRankings = conferenceFilter === 'All' ? rankings : currentRankings;
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= sourceRankings.length) return;

    const newRankings = [...sourceRankings];
    const temp = newRankings[index];
    newRankings[index] = newRankings[newIndex];
    newRankings[newIndex] = temp;

    const updatedRankings = newRankings.map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));

    if (conferenceFilter === 'All') {
      saveToHistory(updatedRankings);
    } else {
      setConferenceRankings(prev => ({
        ...prev,
        [conferenceFilter]: updatedRankings
      }));
    }
    setFocusedIndex(newIndex);
  }, [conferenceFilter, rankings, saveToHistory]);

  // Move selected teams together
  const moveSelectedTeams = useCallback((direction: 'up' | 'down') => {
    if (selectedTeams.size === 0) return;

    const sourceRankings = conferenceFilter === 'All' ? rankings : currentRankings;
    const selectedIndices = sourceRankings
      .map((r, i) => selectedTeams.has(r.team.id) ? i : -1)
      .filter(i => i !== -1)
      .sort((a, b) => direction === 'up' ? a - b : b - a);

    if (selectedIndices.length === 0) return;

    // Check if we can move
    if (direction === 'up' && selectedIndices[0] === 0) return;
    if (direction === 'down' && selectedIndices[selectedIndices.length - 1] === sourceRankings.length - 1) return;

    let newRankings = [...sourceRankings];

    for (const idx of selectedIndices) {
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx >= 0 && newIdx < newRankings.length && !selectedTeams.has(newRankings[newIdx].team.id)) {
        const temp = newRankings[idx];
        newRankings[idx] = newRankings[newIdx];
        newRankings[newIdx] = temp;
      }
    }

    const updatedRankings = newRankings.map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));

    if (conferenceFilter === 'All') {
      saveToHistory(updatedRankings);
    } else {
      setConferenceRankings(prev => ({
        ...prev,
        [conferenceFilter]: updatedRankings
      }));
    }
  }, [selectedTeams, conferenceFilter, rankings, saveToHistory]);

  // Toggle team selection
  const toggleTeamSelection = (teamId: string) => {
    setSelectedTeams(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teamId)) {
        newSet.delete(teamId);
      } else {
        newSet.add(teamId);
      }
      return newSet;
    });
  };

  // Select/deselect all
  const selectAllTeams = () => {
    const source = conferenceFilter === 'All' ? rankings : currentRankings;
    if (selectedTeams.size === source.length) {
      setSelectedTeams(new Set());
    } else {
      setSelectedTeams(new Set(source.map(r => r.team.id)));
    }
  };

  // Remove selected teams
  const removeSelectedTeams = () => {
    if (selectedTeams.size === 0 || conferenceFilter !== 'All') return;

    const newRankings = rankings.filter(r => !selectedTeams.has(r.team.id));
    const updatedRankings = newRankings.map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));
    saveToHistory(updatedRankings);
    setSelectedTeams(new Set());
  };

  // Drag and drop handlers
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

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDragOverIndex(null);
      return;
    }

    const sourceRankings = conferenceFilter === 'All' ? rankings : currentRankings;
    const newRankings = [...sourceRankings];
    const draggedItem = newRankings[draggedIndex];
    newRankings.splice(draggedIndex, 1);
    newRankings.splice(dropIndex, 0, draggedItem);

    const updatedRankings = newRankings.map((item, index) => ({
      ...item,
      rank: index + 1
    }));

    if (conferenceFilter === 'All') {
      saveToHistory(updatedRankings);
    } else {
      setConferenceRankings(prev => ({
        ...prev,
        [conferenceFilter]: updatedRankings
      }));
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Rank editing
  const handleRankClick = (index: number) => {
    setEditingIndex(index);
    setRankInput(String(index + 1));
  };

  const handleRankSubmit = (index: number) => {
    const sourceRankings = conferenceFilter === 'All' ? rankings : currentRankings;
    const rankNum = parseInt(rankInput);
    if (isNaN(rankNum) || rankNum < 1 || rankNum > sourceRankings.length) {
      setEditingIndex(null);
      setRankInput('');
      return;
    }

    if (rankNum !== index + 1) {
      const newIndex = rankNum - 1;
      const newRankings = [...sourceRankings];
      const item = newRankings[index];
      newRankings.splice(index, 1);
      newRankings.splice(newIndex, 0, item);

      const updatedRankings = newRankings.map((item, idx) => ({
        ...item,
        rank: idx + 1
      }));

      if (conferenceFilter === 'All') {
        saveToHistory(updatedRankings);
      } else {
        setConferenceRankings(prev => ({
          ...prev,
          [conferenceFilter]: updatedRankings
        }));
      }
    }

    setEditingIndex(null);
    setRankInput('');
  };

  // Save/Load
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

    const existing = localStorage.getItem('cfb-power-rankings');
    const allSaved = existing ? JSON.parse(existing) : [];
    allSaved.push(saved);
    if (allSaved.length > 10) allSaved.shift();

    localStorage.setItem('cfb-power-rankings', JSON.stringify(allSaved));
    setSaveNameInput('');
    setShowSaveDialog(false);
    loadSavedRankings();
  };

  const loadSavedRankings = () => {
    const saved = localStorage.getItem('cfb-power-rankings');
    if (saved) setSavedRankings(JSON.parse(saved));
  };

  const loadRankings = (savedRanking: { rankings: RankedTeam[] }) => {
    setRankings(savedRanking.rankings);
    setHistory([savedRanking.rankings]);
    setHistoryIndex(0);
    setShowLoadDialog(false);
  };

  const deleteSavedRanking = (index: number) => {
    const saved = localStorage.getItem('cfb-power-rankings');
    if (saved) {
      const allSaved = JSON.parse(saved);
      allSaved.splice(index, 1);
      localStorage.setItem('cfb-power-rankings', JSON.stringify(allSaved));
      loadSavedRankings();
    }
  };

  // Add team to rankings
  const addTeamToRankings = (team: TeamWithRecord) => {
    if (rankings.some(r => r.team.id === team.id)) {
      alert('This team is already in your rankings!');
      return;
    }

    const newRankings = [
      ...rankings,
      { rank: rankings.length + 1, team }
    ];
    saveToHistory(newRankings);
    setShowAddTeamDialog(false);
    setAddTeamSearch('');
  };

  // Remove team from rankings
  const removeTeamFromRankings = (index: number) => {
    const newRankings = rankings.filter((_, i) => i !== index);
    const updatedRankings = newRankings.map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));
    saveToHistory(updatedRankings);
  };

  // Get available teams
  const getAvailableTeams = () => {
    const rankedTeamIds = new Set(rankings.map(r => r.team.id));
    return allTeams
      .filter(team => !rankedTeamIds.has(team.id))
      .filter(team => {
        if (conferenceFilter !== 'All') {
          if (team.conference.toLowerCase().includes(conferenceFilter.toLowerCase()) ||
              conferenceFilter.toLowerCase().includes(team.conference.toLowerCase())) {
            return false;
          }
        }
        return true;
      })
      .filter(team => {
        if (addTeamSearch) {
          return team.name.toLowerCase().includes(addTeamSearch.toLowerCase());
        }
        return true;
      })
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return a.losses - b.losses;
      });
  };

  // Helper to check if team belongs to conference
  const teamBelongsToConference = (team: TeamWithRecord, conf: string): boolean => {
    const teamConf = team.conference.toLowerCase();
    const filterConf = conf.toLowerCase();
    return teamConf === filterConf ||
           teamConf.includes(filterConf) ||
           filterConf.includes(teamConf);
  };

  // Get or build conference rankings
  const getConferenceRankings = (conf: string): RankedTeam[] => {
    if (conferenceRankings[conf]) {
      return conferenceRankings[conf];
    }
    const confTeams = allTeams
      .filter(team => teamBelongsToConference(team, conf))
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return a.losses - b.losses;
      });
    return confTeams.map((team, index) => ({
      rank: index + 1,
      team
    }));
  };

  // Get current rankings based on conference filter
  const currentRankings = conferenceFilter === 'All'
    ? rankings
    : getConferenceRankings(conferenceFilter);

  // Reset
  const resetRankings = () => {
    if (conferenceFilter === 'All') {
      const sorted = [...rankings].sort((a, b) => {
        if (b.team.wins !== a.team.wins) return b.team.wins - a.team.wins;
        return a.team.losses - b.team.losses;
      });
      const updated = sorted.map((item, index) => ({ ...item, rank: index + 1 }));
      saveToHistory(updated);
    } else {
      setConferenceRankings(prev => {
        const newRankings = { ...prev };
        delete newRankings[conferenceFilter];
        return newRankings;
      });
    }
    setShowResetDialog(false);
  };

  // Fetch poll rankings for comparison or templates
  const fetchPollRankings = async (pollType: 'ap' | 'coaches' | 'cfp'): Promise<PollRanking[]> => {
    try {
      const response = await fetch(getApiPath('api/cfb/rankings'));
      if (!response.ok) throw new Error('Failed to fetch rankings');

      const data = await response.json();
      const polls = data.rankings || [];

      // Find the requested poll
      let targetPoll = null;
      for (const poll of polls) {
        const pollName = poll.name?.toLowerCase() || '';
        if (pollType === 'ap' && pollName.includes('ap')) {
          targetPoll = poll;
          break;
        }
        if (pollType === 'coaches' && pollName.includes('coaches')) {
          targetPoll = poll;
          break;
        }
        if (pollType === 'cfp' && (pollName.includes('cfp') || pollName.includes('playoff'))) {
          targetPoll = poll;
          break;
        }
      }

      if (!targetPoll || !targetPoll.ranks) return [];

      return targetPoll.ranks.map((r: { current: number; team?: { displayName?: string; id?: string } }) => ({
        rank: r.current,
        teamName: r.team?.displayName || '',
        teamId: r.team?.id || ''
      }));
    } catch (err) {
      console.error('Failed to fetch poll rankings:', err);
      return [];
    }
  };

  // Toggle comparison mode
  const toggleCompareMode = async () => {
    if (showCompareMode) {
      setShowCompareMode(false);
      setPollRankings([]);
    } else {
      setShowCompareMode(true);
      const rankings = await fetchPollRankings(selectedPoll);
      setPollRankings(rankings);
    }
  };

  // Change poll type for comparison
  const changePoll = async (pollType: 'ap' | 'coaches' | 'cfp') => {
    setSelectedPoll(pollType);
    if (showCompareMode) {
      const rankings = await fetchPollRankings(pollType);
      setPollRankings(rankings);
    }
  };

  // Templates - Start from different presets
  const applyTemplate = async (template: 'record' | 'ap' | 'cfp') => {
    setShowTemplateMenu(false);

    if (template === 'record') {
      resetRankings();
      return;
    }

    try {
      const pollRankings = await fetchPollRankings(template === 'ap' ? 'ap' : 'cfp');

      if (pollRankings.length === 0) {
        // Fallback to record-based if poll data unavailable
        const sorted = [...allTeams].sort((a, b) => {
          if (b.wins !== a.wins) return b.wins - a.wins;
          return a.losses - b.losses;
        });
        const top25 = sorted.slice(0, 25);
        const ranked = top25.map((team, index) => ({
          rank: index + 1,
          team
        }));
        saveToHistory(ranked);
        return;
      }

      // Map poll rankings to our teams
      const rankedTeams: RankedTeam[] = [];
      for (const pollRank of pollRankings) {
        const matchingTeam = allTeams.find(t =>
          t.id === pollRank.teamId ||
          t.name.toLowerCase() === pollRank.teamName.toLowerCase()
        );
        if (matchingTeam) {
          rankedTeams.push({
            rank: pollRank.rank,
            team: matchingTeam
          });
        }
      }

      if (rankedTeams.length > 0) {
        saveToHistory(rankedTeams);
      }
    } catch (err) {
      console.error('Failed to apply template:', err);
    }
  };

  // Export functions
  const exportCSV = () => {
    const headers = ['Rank', 'Team', 'Conference', 'Record'];
    const rows = rankings.map(r => [
      r.rank,
      r.team.name,
      r.team.conference,
      `${r.team.wins}-${r.team.losses}`
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CFB_Power_Rankings_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const exportJSON = () => {
    const data = {
      title: 'CFB Power Rankings',
      date: new Date().toISOString(),
      division: division.toUpperCase(),
      rankings: rankings.map(r => ({
        rank: r.rank,
        team: r.team.name,
        conference: r.team.conference,
        record: `${r.team.wins}-${r.team.losses}`
      }))
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CFB_Power_Rankings_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  // Copy image to clipboard
  const copyImageToClipboard = async (count: 5 | 10 | 25) => {
    if (!logosLoaded) {
      alert('Logos are still loading. Please wait a moment and try again.');
      return;
    }

    setIsDownloading(true);

    try {
      const selectedTeams = rankings.slice(0, count);
      const canvas = generateCanvas(selectedTeams);
      if (!canvas) throw new Error('Failed to generate canvas');

      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            alert('Image copied to clipboard!');
          } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            alert('Failed to copy to clipboard. Your browser may not support this feature.');
          }
        }
        setIsDownloading(false);
      }, 'image/png');
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Failed to generate image. Please try again.');
      setIsDownloading(false);
    }
  };

  // Download image
  const generateCanvas = (selectedTeams: RankedTeam[]) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const canvasWidth = 1000;
    const dpr = 2;
    let yPos = 20;
    const headerHeight = 78;
    const gap = 20;
    const containerHeight = 64;
    const teamsPerRow = selectedTeams.length > 10 ? 2 : 1;
    const containerWidth = teamsPerRow === 1 ? canvasWidth - (gap * 2) : (canvasWidth - (gap * 3)) / 2;

    const totalRows = Math.ceil(selectedTeams.length / teamsPerRow);
    const teamsContentHeight = totalRows * containerHeight + (totalRows - 1) * gap;
    const footerHeight = 64;
    const canvasHeight = yPos + headerHeight + teamsContentHeight + 30 + footerHeight;

    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic 900 38px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    const headerText = 'MY CFB POWER RANKINGS';
    const headerWidth = ctx.measureText(headerText).width;
    ctx.fillText(headerText, (canvasWidth - headerWidth) / 2, yPos + 38);
    yPos += headerHeight;

    // Teams
    selectedTeams.forEach((rankedTeam, i) => {
      const col = Math.floor(i / totalRows);
      const row = i % totalRows;
      let xPos = gap + (col * (containerWidth + gap));
      if (teamsPerRow === 1) xPos = (canvasWidth - containerWidth) / 2;
      const teamYPos = yPos + (row * (containerHeight + gap));

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(xPos, teamYPos, containerWidth, containerHeight, 12);
      ctx.fill();

      const paddingX = 20;
      const containerCenterY = teamYPos + containerHeight / 2;
      ctx.fillStyle = '#000000';
      ctx.font = 'italic 900 32px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(String(rankedTeam.rank), xPos + paddingX, containerCenterY + 11);

      const rankWidth = ctx.measureText(String(rankedTeam.rank)).width;
      ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(rankedTeam.team.name, xPos + paddingX + rankWidth + 20, containerCenterY + 7);

      const img = logoImages[rankedTeam.team.id];
      if (img) {
        const logoSize = 50;
        ctx.drawImage(img, xPos + containerWidth - logoSize - 12, teamYPos + 7, logoSize, logoSize);
      }
    });

    // Footer
    const footerY = canvasHeight - 64;
    ctx.fillStyle = '#800000';
    ctx.fillRect(0, footerY, canvasWidth, 64);
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText('profootballnetwork.com/cfb-hq/power-rankings-builder', 30, footerY + 38);

    return canvas;
  };

  const handleDownload = async (count: 5 | 10 | 25) => {
    if (!logosLoaded) {
      alert('Logos are still loading. Please wait a moment and try again.');
      return;
    }

    setIsDownloading(true);

    try {
      const selectedTeams = rankings.slice(0, count);
      const canvas = generateCanvas(selectedTeams);
      if (!canvas) throw new Error('Failed to generate canvas');

      const link = document.createElement('a');
      link.download = `CFB_Power_Rankings_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Comparison helper - get poll rank for a team
  const getPollRank = (teamId: string): number | null => {
    const found = pollRankings.find(p => p.teamId === teamId);
    return found ? found.rank : null;
  };

  // Calculate comparison stats
  const getComparisonStats = () => {
    if (!showCompareMode || pollRankings.length === 0) return null;

    let matches = 0;
    let totalDiff = 0;
    let hotTakes: Array<{ team: string; yourRank: number; pollRank: number; diff: number }> = [];

    rankings.forEach(r => {
      const pollRank = getPollRank(r.team.id);
      if (pollRank !== null) {
        const diff = Math.abs(r.rank - pollRank);
        totalDiff += diff;
        if (r.rank === pollRank) matches++;
        if (diff >= 5) {
          hotTakes.push({
            team: r.team.name,
            yourRank: r.rank,
            pollRank,
            diff: r.rank - pollRank
          });
        }
      }
    });

    return {
      matches,
      avgDiff: (totalDiff / rankings.length).toFixed(1),
      hotTakes: hotTakes.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).slice(0, 5)
    };
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      if (e.key === 'Escape') {
        setShowExportMenu(false);
        setShowTemplateMenu(false);
        setShowEditMenu(false);
        setShowFileMenu(false);
        setSelectedTeams(new Set());
        setFocusedIndex(null);
      }

      // Arrow key navigation
      if (focusedIndex !== null && conferenceFilter === 'All') {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (selectedTeams.size > 0) {
            moveSelectedTeams('up');
          } else {
            moveTeam(focusedIndex, 'up');
          }
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (selectedTeams.size > 0) {
            moveSelectedTeams('down');
          } else {
            moveTeam(focusedIndex, 'down');
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history, focusedIndex, selectedTeams, undo, redo, moveTeam, moveSelectedTeams, conferenceFilter]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
      if (templateMenuRef.current && !templateMenuRef.current.contains(event.target as Node)) {
        setShowTemplateMenu(false);
      }
      if (editMenuRef.current && !editMenuRef.current.contains(event.target as Node)) {
        setShowEditMenu(false);
      }
      if (fileMenuRef.current && !fileMenuRef.current.contains(event.target as Node)) {
        setShowFileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
        {/* Hero Section */}
        <header
          className="text-white shadow-lg"
          style={{
            background: 'linear-gradient(180deg, #800000 0%, #600000 100%)',
            boxShadow: 'inset 0 -30px 40px -30px rgba(0,0,0,0.15), 0 4px 6px -1px rgba(0,0,0,0.1)'
          }}
        >
          <div className="container mx-auto px-4 pt-6 sm:pt-7 md:pt-8 lg:pt-10 pb-5 sm:pb-6 md:pb-7 lg:pb-8">
            <h1 className="text-4xl lg:text-5xl font-extrabold mb-2">
              CFB Power Rankings Builder
            </h1>
            <p className="text-lg opacity-90 font-medium">
              Create your own custom {division === 'fbs' ? 'FBS' : 'FCS'} power rankings
            </p>
          </div>
        </header>

        {/* Raptive Header Ad */}
        <div className="container mx-auto px-4 min-h-[110px]">
          <div className="raptive-pfn-header-90"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Division Toggle */}
          <div className="mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setDivision('fbs')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all active:scale-[0.98] cursor-pointer ${
                  division === 'fbs'
                    ? 'bg-[#800000] text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-[#800000] hover:text-[#800000]'
                }`}
              >
                FBS
              </button>
              <button
                onClick={() => setDivision('fcs')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all active:scale-[0.98] cursor-pointer ${
                  division === 'fcs'
                    ? 'bg-[#800000] text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-[#800000] hover:text-[#800000]'
                }`}
              >
                FCS
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-900">
              <strong>How to use:</strong> {isMobile ? 'Use arrow buttons to move teams, ' : 'Drag and drop teams to reorder, '}
              click the rank number to type a new position, or use the checkbox to select multiple teams.
              {!isMobile && ' Use arrow keys to move focused/selected teams.'}
            </p>
          </div>

          {/* Conference Selector */}
          {!loading && (
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-700 mr-2">Rankings Mode:</span>
                {currentConferences.map((conf) => (
                  <button
                    key={conf}
                    onClick={() => setConferenceFilter(conf)}
                    className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all active:scale-[0.98] cursor-pointer ${
                      conferenceFilter === conf
                        ? 'bg-[#800000] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {conf}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                {conferenceFilter === 'All'
                  ? 'Build your overall top 25 power rankings from all teams.'
                  : `Build your ${conferenceFilter} conference power rankings (${currentRankings.length} teams).`}
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && <PowerRankingsSkeleton />}

          {/* Rankings Table */}
          {!loading && (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Table Header with Actions */}
              <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-4">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2 justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">
                      {conferenceFilter === 'All'
                        ? 'My CFB Power Rankings'
                        : `My ${conferenceFilter} Power Rankings`}
                    </h2>

                    {/* Selection info */}
                    {selectedTeams.size > 0 && conferenceFilter === 'All' && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>{selectedTeams.size} selected</span>
                        <button
                          onClick={() => setSelectedTeams(new Set())}
                          className="text-red-600 hover:text-red-700 cursor-pointer"
                        >
                          Clear
                        </button>
                        <button
                          onClick={removeSelectedTeams}
                          className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded cursor-pointer"
                        >
                          Remove Selected
                        </button>
                        <button
                          onClick={() => moveSelectedTeams('up')}
                          className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded cursor-pointer"
                        >
                          ↑ Move Up
                        </button>
                        <button
                          onClick={() => moveSelectedTeams('down')}
                          className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded cursor-pointer"
                        >
                          ↓ Move Down
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {/* Template dropdown */}
                    <div className="relative" ref={templateMenuRef}>
                      <button
                        onClick={() => setShowTemplateMenu(!showTemplateMenu)}
                        className="px-3 py-2 text-sm bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium flex items-center gap-1.5 cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                        </svg>
                        Templates
                      </button>
                      {showTemplateMenu && (
                        <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                          <div className="py-2">
                            <button
                              onClick={() => applyTemplate('record')}
                              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-gray-700 cursor-pointer"
                            >
                              Start from Record
                            </button>
                            <button
                              onClick={() => applyTemplate('ap')}
                              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-gray-700 cursor-pointer"
                            >
                              Start from AP Poll
                            </button>
                            <button
                              onClick={() => applyTemplate('cfp')}
                              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-gray-700 cursor-pointer"
                            >
                              Start from CFP Rankings
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {conferenceFilter === 'All' && (
                      <button onClick={() => setShowAddTeamDialog(true)}
                        className="px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-1.5 cursor-pointer">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Team
                      </button>
                    )}

                    {/* Edit dropdown - Undo, Redo, Reset */}
                    <div className="relative" ref={editMenuRef}>
                      <button
                        onClick={() => setShowEditMenu(!showEditMenu)}
                        className="px-3 py-2 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium flex items-center gap-1.5 cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {showEditMenu && (
                        <div className="absolute left-0 mt-2 w-40 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                          <div className="py-2">
                            <button
                              onClick={() => { undo(); setShowEditMenu(false); }}
                              disabled={historyIndex <= 0 || conferenceFilter !== 'All'}
                              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-between"
                            >
                              <span>Undo</span>
                              <span className="text-xs text-gray-400">Ctrl+Z</span>
                            </button>
                            <button
                              onClick={() => { redo(); setShowEditMenu(false); }}
                              disabled={historyIndex >= history.length - 1 || conferenceFilter !== 'All'}
                              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-between"
                            >
                              <span>Redo</span>
                              <span className="text-xs text-gray-400">Ctrl+Shift+Z</span>
                            </button>
                            <div className="border-t my-1"></div>
                            <button
                              onClick={() => { setShowResetDialog(true); setShowEditMenu(false); }}
                              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-red-600 cursor-pointer"
                            >
                              Reset Rankings
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* File dropdown - Save, Load */}
                    <div className="relative" ref={fileMenuRef}>
                      <button
                        onClick={() => setShowFileMenu(!showFileMenu)}
                        className="px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-1.5 cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        File
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {showFileMenu && (
                        <div className="absolute left-0 mt-2 w-44 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                          <div className="py-2">
                            <button
                              onClick={() => { setShowSaveDialog(true); setShowFileMenu(false); }}
                              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-gray-700 cursor-pointer flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                              </svg>
                              Save Rankings
                            </button>
                            <button
                              onClick={() => { setShowLoadDialog(true); setShowFileMenu(false); }}
                              disabled={savedRankings.length === 0}
                              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                              Load Rankings
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Compare Button */}
                    {conferenceFilter === 'All' && division === 'fbs' && (
                      <button
                        onClick={toggleCompareMode}
                        className={`px-3 py-2 text-sm rounded-lg font-medium flex items-center gap-1.5 cursor-pointer ${
                          showCompareMode
                            ? 'bg-purple-700 text-white'
                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        {showCompareMode ? 'Comparing' : 'Compare'}
                      </button>
                    )}

                    {/* Export/Share dropdown - combines Export and Download */}
                    <div className="relative" ref={exportMenuRef}>
                      <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        disabled={isDownloading}
                        className="px-3 py-2 text-sm bg-[#800000] hover:bg-[#600000] active:scale-[0.98] disabled:opacity-50 text-white rounded-lg font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        {isDownloading ? 'Generating...' : 'Share'}
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {showExportMenu && !isDownloading && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                          <div className="py-2">
                            <div className="px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase">Download Image</div>
                            <button onClick={() => { handleDownload(5); setShowExportMenu(false); }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700 cursor-pointer">
                              Download Top 5
                            </button>
                            <button onClick={() => { handleDownload(10); setShowExportMenu(false); }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700 cursor-pointer">
                              Download Top 10
                            </button>
                            <button onClick={() => { handleDownload(25); setShowExportMenu(false); }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700 cursor-pointer">
                              Download Top 25
                            </button>
                            <div className="border-t my-1"></div>
                            <div className="px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase">Copy to Clipboard</div>
                            <button onClick={() => { copyImageToClipboard(5); setShowExportMenu(false); }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700 cursor-pointer">
                              Copy Top 5
                            </button>
                            <button onClick={() => { copyImageToClipboard(10); setShowExportMenu(false); }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700 cursor-pointer">
                              Copy Top 10
                            </button>
                            <button onClick={() => { copyImageToClipboard(25); setShowExportMenu(false); }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700 cursor-pointer">
                              Copy Top 25
                            </button>
                            <div className="border-t my-1"></div>
                            <div className="px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase">Export Data</div>
                            <button onClick={() => { exportCSV(); setShowExportMenu(false); }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700 cursor-pointer">
                              Export as CSV
                            </button>
                            <button onClick={() => { exportJSON(); setShowExportMenu(false); }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700 cursor-pointer">
                              Export as JSON
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparison Mode Panel */}
              {showCompareMode && conferenceFilter === 'All' && division === 'fbs' && (
                <div className="bg-purple-50 border-b border-purple-200 px-4 sm:px-6 py-4">
                  {/* Poll Selector */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="text-sm font-medium text-purple-900">Compare against:</span>
                    <div className="flex gap-2">
                      {(['ap', 'coaches', 'cfp'] as const).map((poll) => (
                        <button
                          key={poll}
                          onClick={() => changePoll(poll)}
                          className={`px-3 py-1.5 text-sm rounded-lg font-medium cursor-pointer transition-colors ${
                            selectedPoll === poll
                              ? 'bg-purple-600 text-white'
                              : 'bg-white text-purple-700 border border-purple-300 hover:bg-purple-100'
                          }`}
                        >
                          {poll === 'ap' ? 'AP Poll' : poll === 'coaches' ? 'Coaches Poll' : 'CFP Rankings'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comparison Stats */}
                  {pollRankings.length > 0 && (() => {
                    const stats = getComparisonStats();
                    if (!stats) return null;
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <div className="bg-white rounded-lg p-3 border border-purple-200">
                          <div className="text-2xl font-bold text-purple-700">{stats.matches}/25</div>
                          <div className="text-sm text-gray-600">Exact Matches</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-purple-200">
                          <div className="text-2xl font-bold text-purple-700">{stats.avgDiff}</div>
                          <div className="text-sm text-gray-600">Avg. Position Diff</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-purple-200">
                          <div className="text-2xl font-bold text-purple-700">{stats.hotTakes.length}</div>
                          <div className="text-sm text-gray-600">Hot Takes (±5 spots)</div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Hot Takes */}
                  {pollRankings.length > 0 && (() => {
                    const stats = getComparisonStats();
                    if (!stats || stats.hotTakes.length === 0) return null;
                    return (
                      <div className="bg-white rounded-lg p-4 border border-purple-200">
                        <h4 className="font-semibold text-purple-900 mb-2">Your Hot Takes</h4>
                        <div className="flex flex-wrap gap-2">
                          {stats.hotTakes.map((take, i) => (
                            <div
                              key={i}
                              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                                take.diff < 0
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {take.team}: #{take.yourRank} {take.diff < 0 ? '↑' : '↓'}
                              <span className="ml-1 opacity-75">
                                ({selectedPoll.toUpperCase()} #{take.pollRank})
                              </span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          <span className="inline-block w-3 h-3 bg-green-100 rounded mr-1"></span> Higher than {selectedPoll.toUpperCase()}
                          <span className="inline-block w-3 h-3 bg-red-100 rounded ml-3 mr-1"></span> Lower than {selectedPoll.toUpperCase()}
                        </p>
                      </div>
                    );
                  })()}

                  {pollRankings.length === 0 && (
                    <div className="text-center text-purple-700 py-2">
                      Loading poll data...
                    </div>
                  )}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full" ref={tableRef}>
                  <thead className="bg-[#800000] text-white">
                    <tr>
                      {conferenceFilter === 'All' && (
                        <th className="pl-4 pr-2 py-3 w-10">
                          <input
                            type="checkbox"
                            checked={selectedTeams.size === currentRankings.length && currentRankings.length > 0}
                            onChange={selectAllTeams}
                            className="w-4 h-4 rounded cursor-pointer"
                          />
                        </th>
                      )}
                      <th className="pl-4 pr-2 py-3 text-left text-sm font-bold w-20">Rank</th>
                      {isMobile && <th className="px-2 py-3 text-center text-sm font-bold w-20">Move</th>}
                      <th className="px-4 py-3 text-left text-sm font-bold">Team</th>
                      <th className="hidden md:table-cell px-4 py-3 text-left text-sm font-bold w-24">Conf</th>
                      <th className="px-4 py-3 text-left text-sm font-bold w-24">Record</th>
                      {showCompareMode && conferenceFilter === 'All' && pollRankings.length > 0 && (
                        <th className="px-4 py-3 text-center text-sm font-bold w-24">{selectedPoll.toUpperCase()}</th>
                      )}
                      {conferenceFilter === 'All' && <th className="px-4 py-3 text-center text-sm font-bold w-16"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {currentRankings.map((rankedTeam, index) => {
                      const isSelected = selectedTeams.has(rankedTeam.team.id);
                      const isFocused = focusedIndex === index;

                      return (
                        <tr
                          key={rankedTeam.team.id}
                          draggable={!isMobile}
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragLeave={() => setDragOverIndex(null)}
                          onDrop={(e) => handleDrop(e, index)}
                          onClick={() => setFocusedIndex(index)}
                          className={`border-b border-gray-200 transition-all ${!isMobile ? 'cursor-move' : ''} ${
                            draggedIndex === index ? 'opacity-50' : ''
                          } ${dragOverIndex === index ? 'bg-red-100' : ''} ${
                            isSelected ? 'bg-red-50' : isFocused ? 'bg-yellow-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          {conferenceFilter === 'All' && (
                            <td className="pl-4 pr-2 py-4">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleTeamSelection(rankedTeam.team.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 rounded cursor-pointer"
                              />
                            </td>
                          )}
                          <td className="pl-4 pr-2 py-4">
                            {editingIndex === index ? (
                              <input
                                type="number"
                                value={rankInput}
                                onChange={(e) => setRankInput(e.target.value)}
                                onBlur={() => handleRankSubmit(index)}
                                onKeyDown={(e) => e.key === 'Enter' && handleRankSubmit(index)}
                                autoFocus
                                min={1}
                                max={currentRankings.length}
                                className="w-14 h-10 px-2 text-center text-lg font-bold border-2 border-[#800000] rounded-lg"
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRankClick(index); }}
                                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-red-100 cursor-pointer"
                              >
                                <span className="text-lg font-bold text-gray-900">{rankedTeam.rank}</span>
                              </button>
                            )}
                          </td>
                          {/* Mobile up/down buttons */}
                          {isMobile && (
                            <td className="px-2 py-4">
                              <div className="flex flex-col gap-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); moveTeam(index, 'up'); }}
                                  disabled={index === 0}
                                  className="w-8 h-6 bg-gray-200 hover:bg-gray-300 disabled:opacity-30 rounded flex items-center justify-center cursor-pointer"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); moveTeam(index, 'down'); }}
                                  disabled={index === currentRankings.length - 1}
                                  className="w-8 h-6 bg-gray-200 hover:bg-gray-300 disabled:opacity-30 rounded flex items-center justify-center cursor-pointer"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          )}
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 relative flex-shrink-0">
                                <Image
                                  src={rankedTeam.team.logo}
                                  alt={rankedTeam.team.name}
                                  fill
                                  className="object-contain"
                                  unoptimized
                                />
                              </div>
                              <span className="font-semibold text-gray-900">{rankedTeam.team.name}</span>
                            </div>
                          </td>
                          <td className="hidden md:table-cell px-4 py-4">
                            {(() => {
                              const style = getConferenceStyle(rankedTeam.team.conference);
                              return (
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${style.color}`}>
                                  {style.display}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-4 text-gray-700">
                            {rankedTeam.team.wins}-{rankedTeam.team.losses}
                          </td>
                          {showCompareMode && conferenceFilter === 'All' && pollRankings.length > 0 && (() => {
                            const pollRank = getPollRank(rankedTeam.team.id);
                            if (pollRank === null) {
                              return (
                                <td className="px-4 py-4 text-center text-gray-400 text-sm">
                                  NR
                                </td>
                              );
                            }
                            const diff = pollRank - rankedTeam.rank;
                            return (
                              <td className="px-4 py-4 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <span className="font-semibold">#{pollRank}</span>
                                  {diff !== 0 && (
                                    <span className={`text-xs font-medium ${
                                      diff > 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {diff > 0 ? `↑${diff}` : `↓${Math.abs(diff)}`}
                                    </span>
                                  )}
                                  {diff === 0 && (
                                    <span className="text-xs text-gray-400">=</span>
                                  )}
                                </div>
                              </td>
                            );
                          })()}
                          {conferenceFilter === 'All' && (
                            <td className="px-4 py-4 text-center">
                              <button
                                onClick={(e) => { e.stopPropagation(); removeTeamFromRankings(index); }}
                                className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center cursor-pointer transition-colors"
                                title="Remove team"
                              >
                                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      <Footer currentPage="CFB" />

      {/* Reset Dialog */}
      {showResetDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reset Rankings?</h3>
            <p className="text-gray-600 mb-4">This will restore the default rankings based on team records.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowResetDialog(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium cursor-pointer">
                Cancel
              </button>
              <button onClick={resetRankings}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium cursor-pointer">
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Save Rankings</h3>
            <input
              type="text"
              value={saveNameInput}
              onChange={(e) => setSaveNameInput(e.target.value)}
              placeholder="e.g., Week 15 Rankings, Bowl Predictions"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
              maxLength={50}
            />
            <p className="text-xs text-gray-500 mb-4">
              Your rankings are also auto-saved as a draft every 30 seconds.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium cursor-pointer">
                Cancel
              </button>
              <button onClick={saveRankingsToLocalStorage}
                className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium cursor-pointer">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Load Saved Rankings</h3>
            {savedRankings.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No saved rankings yet.</p>
            ) : (
              <div className="space-y-3">
                {savedRankings.map((saved, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-900">{saved.name}</h4>
                      <p className="text-sm text-gray-500">{new Date(saved.date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => loadRankings(saved)}
                        className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer">
                        Load
                      </button>
                      <button onClick={() => deleteSavedRanking(index)}
                        className="px-3 py-1.5 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg cursor-pointer">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end mt-6 pt-4 border-t">
              <button onClick={() => setShowLoadDialog(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Team Dialog */}
      {showAddTeamDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Add Team to Rankings</h3>
              <button
                onClick={() => {
                  setShowAddTeamDialog(false);
                  setAddTeamSearch('');
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <input
                type="text"
                value={addTeamSearch}
                onChange={(e) => setAddTeamSearch(e.target.value)}
                placeholder="Search for a team..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-transparent"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
              {getAvailableTeams().length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  {addTeamSearch ? 'No teams found matching your search.' : 'All teams are already in your rankings.'}
                </p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {getAvailableTeams().slice(0, 50).map((team) => (
                    <button
                      key={team.id}
                      onClick={() => addTeamToRankings(team)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                    >
                      <div className="w-8 h-8 relative flex-shrink-0">
                        <Image
                          src={team.logo}
                          alt={team.name}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900">{team.name}</div>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${getConferenceStyle(team.conference).color}`}>
                          {getConferenceStyle(team.conference).display}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-gray-600">
                        {team.wins}-{team.losses}
                      </div>
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end mt-4 pt-4 border-t">
              <button
                onClick={() => {
                  setShowAddTeamDialog(false);
                  setAddTeamSearch('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
