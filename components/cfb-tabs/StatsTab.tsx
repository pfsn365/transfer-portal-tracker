'use client';

import { useState, useEffect } from 'react';
import { Team } from '@/data/teams';
import LoadingSpinner from '@/components/LoadingSpinner';

interface StatsTabProps {
  team: Team;
  teamColor: string;
}

interface TeamStats {
  offense: {
    pointsPerGame: number;
    yardsPerGame: number;
    passingYardsPerGame: number;
    rushingYardsPerGame: number;
    passingTouchdowns: number;
    rushingTouchdowns: number;
    completionPct: number;
    yardsPerAttempt: number;
    yardsPerRush: number;
    thirdDownPct: number;
    redzonePct: number;
    firstDowns: number;
    turnovers: number;
  };
  defense: {
    sacks: number;
    tacklesForLoss: number;
    interceptions: number;
    passesDefended: number;
    fumblesForced: number;
    fumblesRecovered: number;
    totalTackles: number;
    takeaways: number;
  };
  specialTeams: {
    fieldGoalPct: number;
    fieldGoals: string;
    puntAvg: number;
    kickReturnAvg: number;
    puntReturnAvg: number;
  };
  rankings?: {
    offenseRank?: number;
  };
}

function StatRow({ label, value, suffix = '' }: { label: string; value: number | string | undefined; suffix?: string }) {
  const displayValue = value !== undefined && value !== null
    ? (typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(1)) : value)
    : '-';
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-600 text-sm">{label}</span>
      <span className="font-semibold text-gray-900">{displayValue}{suffix}</span>
    </div>
  );
}

export default function StatsTab({ team, teamColor }: StatsTabProps) {
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/cfb-hq/api/teams/stats/${team.slug}`);

        if (!response.ok) {
          throw new Error('Failed to fetch team stats');
        }

        const data = await response.json();
        setStats(data.stats || null);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to load team stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [team.slug]);

  if (loading) {
    return (
      <div className="py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <p className="text-gray-500">No stats available for this team</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rankings Summary */}
      {stats.rankings?.offenseRank && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">National Rankings</h3>
          <div className="flex justify-center gap-12 text-center">
            <div>
              <p className="text-3xl font-bold text-green-600">#{stats.rankings.offenseRank}</p>
              <p className="text-sm text-gray-600">Scoring Offense</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Offensive Stats */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200" style={{ backgroundColor: teamColor }}>
            <h3 className="text-lg font-bold text-white">Offensive Stats</h3>
          </div>
          <div className="p-4">
            <StatRow label="Points Per Game" value={stats.offense.pointsPerGame} />
            <StatRow label="Total Yards/Game" value={stats.offense.yardsPerGame} />
            <StatRow label="Passing Yards/Game" value={stats.offense.passingYardsPerGame} />
            <StatRow label="Rushing Yards/Game" value={stats.offense.rushingYardsPerGame} />
            <StatRow label="Passing TDs" value={stats.offense.passingTouchdowns} />
            <StatRow label="Rushing TDs" value={stats.offense.rushingTouchdowns} />
            <StatRow label="Completion %" value={stats.offense.completionPct} suffix="%" />
            <StatRow label="Yards/Pass Attempt" value={stats.offense.yardsPerAttempt} />
            <StatRow label="Yards/Rush" value={stats.offense.yardsPerRush} />
            <StatRow label="3rd Down %" value={stats.offense.thirdDownPct} suffix="%" />
            <StatRow label="Red Zone %" value={stats.offense.redzonePct} suffix="%" />
            <StatRow label="First Downs" value={stats.offense.firstDowns} />
            <StatRow label="Turnovers" value={stats.offense.turnovers} />
          </div>
        </div>

        {/* Defensive Stats */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200" style={{ backgroundColor: teamColor }}>
            <h3 className="text-lg font-bold text-white">Defensive Stats</h3>
          </div>
          <div className="p-4">
            <StatRow label="Total Tackles" value={stats.defense.totalTackles} />
            <StatRow label="Tackles for Loss" value={stats.defense.tacklesForLoss} />
            <StatRow label="Sacks" value={stats.defense.sacks} />
            <StatRow label="Interceptions" value={stats.defense.interceptions} />
            <StatRow label="Passes Defended" value={stats.defense.passesDefended} />
            <StatRow label="Fumbles Forced" value={stats.defense.fumblesForced} />
            <StatRow label="Fumbles Recovered" value={stats.defense.fumblesRecovered} />
            <StatRow label="Total Takeaways" value={stats.defense.takeaways} />
          </div>
        </div>

        {/* Special Teams Stats */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200" style={{ backgroundColor: teamColor }}>
            <h3 className="text-lg font-bold text-white">Special Teams</h3>
          </div>
          <div className="p-4">
            <StatRow label="Field Goals" value={stats.specialTeams.fieldGoals} />
            <StatRow label="Field Goal %" value={stats.specialTeams.fieldGoalPct} suffix="%" />
            <StatRow label="Punt Average" value={stats.specialTeams.puntAvg} suffix=" yds" />
            <StatRow label="Kick Return Avg" value={stats.specialTeams.kickReturnAvg} suffix=" yds" />
            <StatRow label="Punt Return Avg" value={stats.specialTeams.puntReturnAvg} suffix=" yds" />
          </div>
        </div>
      </div>

      {/* Turnover Margin */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Turnover Margin</h3>
        <div className="text-center">
          <p className={`text-4xl font-bold ${stats.defense.takeaways - stats.offense.turnovers >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.defense.takeaways - stats.offense.turnovers >= 0 ? '+' : ''}{stats.defense.takeaways - stats.offense.turnovers}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {stats.defense.takeaways} Takeaways - {stats.offense.turnovers} Turnovers
          </p>
        </div>
      </div>
    </div>
  );
}
