'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Team } from '@/data/teams';
import { getTeamLogo } from '@/utils/teamLogos';
import { getTeamColor } from '@/utils/teamColors';
import CFBNavigationTabs from '@/components/cfb-tabs/CFBNavigationTabs';
import OverviewTab from '@/components/cfb-tabs/OverviewTab';
import RosterTab from '@/components/cfb-tabs/RosterTab';
import ScheduleTab from '@/components/cfb-tabs/ScheduleTab';
import TransfersTab from '@/components/cfb-tabs/TransfersTab';
import LoadingSpinner from '@/components/LoadingSpinner';

interface CFBTeamPageProps {
  team: Team;
  initialTab?: string;
}

interface TeamRecord {
  wins: number;
  losses: number;
  confWins: number;
  confLosses: number;
}

interface TeamHeroSectionProps {
  team: Team;
  teamColor: string;
  record?: TeamRecord;
  conferenceRank?: string;
  headCoach?: string;
}

function TeamHeroSection({ team, teamColor, record, conferenceRank, headCoach }: TeamHeroSectionProps) {
  return (
    <div style={{ backgroundColor: teamColor }} className="text-white">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 lg:gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-white rounded-full flex items-center justify-center shadow-lg p-3 sm:p-4">
              <Image
                src={getTeamLogo(team.id)}
                alt={`${team.name} logo`}
                width={112}
                height={112}
                sizes="(max-width: 640px) 80px, (max-width: 1024px) 96px, 128px"
                className="object-contain w-full h-full"
                priority
              />
            </div>
            <div className="min-w-0 text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-1">{team.name}</h1>
              <p className="text-base sm:text-lg lg:text-xl opacity-90">
                {conferenceRank && record ? (
                  `${conferenceRank} in ${team.conference} • ${record.wins}-${record.losses} (${record.confWins}-${record.confLosses})`
                ) : (
                  <>
                    {team.conference}
                    {headCoach && <span> | HC: {headCoach}</span>}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Stats Card */}
          {record && (
            <div className="bg-white text-gray-800 rounded-lg p-4 sm:p-6 w-full lg:w-auto shadow-lg">
              <h3 className="text-sm font-semibold mb-3 text-center text-gray-600 uppercase">2025-26 Record</h3>
              <div className="grid grid-cols-2 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {record.wins}-{record.losses}
                  </div>
                  <div className="text-sm text-gray-600">Overall</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {record.confWins}-{record.confLosses}
                  </div>
                  <div className="text-sm text-gray-600">Conference</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CFBTeamPageContent({ team, initialTab }: CFBTeamPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(initialTab || 'overview');
  const [teamRecord, setTeamRecord] = useState<TeamRecord | null>(null);
  const [conferenceRank, setConferenceRank] = useState<string | null>(null);
  const [headCoach, setHeadCoach] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<any[]>([]);

  const teamColor = getTeamColor(team.id);

  // Fetch team schedule and calculate record
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await fetch(`/cfb-hq/api/teams/schedule/${team.slug}`);
        if (response.ok) {
          const data = await response.json();
          setSchedule(data.schedule || []);

          // Calculate record from schedule
          const completedGames = (data.schedule || []).filter((g: any) => g.result);
          const wins = completedGames.filter((g: any) => g.result === 'W').length;
          const losses = completedGames.filter((g: any) => g.result === 'L').length;

          // Calculate conference record
          const confGames = completedGames.filter((g: any) => g.isConference);
          const confWins = confGames.filter((g: any) => g.result === 'W').length;
          const confLosses = confGames.filter((g: any) => g.result === 'L').length;

          setTeamRecord({ wins, losses, confWins, confLosses });
        }
      } catch (error) {
        console.error('Failed to fetch schedule:', error);
      }
    };

    fetchSchedule();
  }, [team.slug]);

  // Fetch conference standings for rank
  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const response = await fetch(`/cfb-hq/api/standings?conference=${encodeURIComponent(team.conference)}`);
        if (response.ok) {
          const data = await response.json();
          const standings = data.standings || [];
          const teamIndex = standings.findIndex((t: any) =>
            t.name?.toLowerCase().includes(team.id.toLowerCase()) ||
            t.team?.toLowerCase().includes(team.id.toLowerCase())
          );
          if (teamIndex !== -1) {
            const rank = teamIndex + 1;
            const suffix = rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th';
            setConferenceRank(`${rank}${suffix}`);
          }
        }
      } catch (error) {
        console.error('Failed to fetch standings:', error);
      }
    };

    fetchStandings();
  }, [team.conference, team.id]);

  // Fetch head coach from roster endpoint
  useEffect(() => {
    const fetchHeadCoach = async () => {
      try {
        const response = await fetch(`/cfb-hq/api/teams/roster/${team.slug}`);
        if (response.ok) {
          const data = await response.json();
          if (data.headCoach) {
            setHeadCoach(data.headCoach);
          }
        }
      } catch (error) {
        console.error('Failed to fetch head coach:', error);
      }
    };

    fetchHeadCoach();
  }, [team.slug]);

  const handleTabChange = (tab: string) => {
    if (tab === activeTab) return;

    setActiveTab(tab);

    // Navigate to the new URL - use window.history to preserve basePath in URL
    const newPath = tab === 'overview'
      ? `/cfb-hq/teams/${team.slug}`
      : `/cfb-hq/teams/${team.slug}/${tab}`;
    window.history.replaceState(null, '', newPath);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab team={team} schedule={schedule} teamColor={teamColor} />;
      case 'roster':
        return <RosterTab team={team} teamColor={teamColor} />;
      case 'schedule':
        return <ScheduleTab team={team} teamColor={teamColor} />;
      case 'transfers':
        return <TransfersTab team={team} teamColor={teamColor} />;
      default:
        return <OverviewTab team={team} schedule={schedule} teamColor={teamColor} />;
    }
  };

  return (
    <>
      <TeamHeroSection
        team={team}
        teamColor={teamColor}
        record={teamRecord || undefined}
        conferenceRank={conferenceRank || undefined}
        headCoach={headCoach || undefined}
      />

      <CFBNavigationTabs activeTab={activeTab} onTabChange={handleTabChange} team={team} teamColor={teamColor} />

      {/* Raptive Header Ad - Below Tabs */}
      <div className="container mx-auto px-4 min-h-[110px]">
        <div className="raptive-pfn-header-90"></div>
      </div>

      <div className="container mx-auto px-4 py-6 pb-24">
        {renderActiveTab()}
      </div>
    </>
  );
}

export default function CFBTeamPage({ team, initialTab }: CFBTeamPageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    }>
      <CFBTeamPageContent team={team} initialTab={initialTab} />
    </Suspense>
  );
}
