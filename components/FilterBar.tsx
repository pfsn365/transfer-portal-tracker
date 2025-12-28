import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlayerStatus, PlayerClass, PlayerPosition, Conference } from '@/types/player';
import { getTeamById, getAllConferences, getTeamsByConference } from '@/data/teams';

interface FilterBarProps {
  selectedStatus: PlayerStatus | 'All';
  selectedSchool: string;
  selectedClass: PlayerClass | 'All';
  selectedPosition: PlayerPosition | 'All';
  selectedConference: Conference | 'All';
  onStatusChange: (status: PlayerStatus | 'All') => void;
  onSchoolChange: (school: string) => void;
  onClassChange: (cls: PlayerClass | 'All') => void;
  onPositionChange: (position: PlayerPosition | 'All') => void;
  onConferenceChange: (conference: Conference | 'All') => void;
  schools: string[];
}

const statuses: (PlayerStatus | 'All')[] = ['All', 'Entered', 'Committed', 'Enrolled', 'Withdrawn'];
const classes: (PlayerClass | 'All')[] = ['All', 'FR', 'SO', 'JR', 'SR', 'GR'];
const positions: (PlayerPosition | 'All')[] = [
  'All', 'QB', 'RB', 'WR', 'TE', 'OL', 'OT', 'OG', 'C',
  'EDGE', 'DL', 'DT', 'LB', 'CB', 'S', 'DB', 'K', 'P', 'ATH'
];
const conferences: (Conference | 'All')[] = [
  'All', 'SEC', 'Big Ten', 'Big 12', 'ACC', 'Pac-12',
  'American', 'Mountain West', 'Sun Belt', 'MAC', 'C-USA',
  'Independent', 'FCS'
];

export default function FilterBar({
  selectedStatus,
  selectedSchool,
  selectedClass,
  selectedPosition,
  selectedConference,
  onStatusChange,
  onSchoolChange,
  onClassChange,
  onPositionChange,
  onConferenceChange,
  schools,
}: FilterBarProps) {
  const router = useRouter();
  // Local state for school conference filter (separate from player conference filter)
  const [schoolConferenceFilter, setSchoolConferenceFilter] = useState<Conference | 'All'>('All');

  // Get teams to display based on selected conference
  const getSchoolOptions = () => {
    if (schoolConferenceFilter === 'All') {
      return getAllConferences().flatMap(conf => getTeamsByConference(conf));
    }
    return getTeamsByConference(schoolConferenceFilter);
  };

  const handleSchoolConferenceChange = (conf: Conference | 'All') => {
    setSchoolConferenceFilter(conf);
    // Reset school selection when conference changes
    if (selectedSchool !== 'All') {
      onSchoolChange('All');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value as PlayerStatus | 'All')}
            className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 transition-all text-base sm:text-sm"
          >
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {/* School Filter - Smart Single Dropdown */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            School
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              {schoolConferenceFilter === 'All' ? (
                // Conference Selection Mode
                <select
                  value="All"
                  onChange={(e) => {
                    const value = e.target.value as Conference | 'All';
                    if (value !== 'All') {
                      handleSchoolConferenceChange(value);
                    }
                  }}
                  className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 transition-all text-base sm:text-sm"
                >
                  <option value="All">Select Conference</option>
                  {getAllConferences().map(conf => (
                    <option key={conf} value={conf}>{conf}</option>
                  ))}
                </select>
              ) : (
                // School Selection Mode
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleSchoolConferenceChange('All')}
                    className="px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium whitespace-nowrap"
                    title="Change conference"
                  >
                    ← {schoolConferenceFilter}
                  </button>
                  <select
                    value={selectedSchool}
                    onChange={(e) => {
                      const schoolName = e.target.value;
                      onSchoolChange(schoolName);

                      // Navigate to team page if a specific school is selected
                      if (schoolName !== 'All') {
                        const team = getTeamById(schoolName);
                        if (team) {
                          router.push(`/college/${team.slug}`);
                        }
                      }
                    }}
                    className="flex-1 px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 transition-all text-base sm:text-sm"
                  >
                    <option value="All">All {schoolConferenceFilter} Schools</option>
                    {getSchoolOptions().map(team => (
                      <option key={team.id} value={team.name}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Class Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Class
          </label>
          <select
            value={selectedClass}
            onChange={(e) => onClassChange(e.target.value as PlayerClass | 'All')}
            className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 transition-all text-base sm:text-sm"
          >
            {classes.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>

        {/* Position Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Position
          </label>
          <select
            value={selectedPosition}
            onChange={(e) => onPositionChange(e.target.value as PlayerPosition | 'All')}
            className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 transition-all text-base sm:text-sm"
          >
            {positions.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
        </div>

        {/* Conference Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Conference
          </label>
          <select
            value={selectedConference}
            onChange={(e) => onConferenceChange(e.target.value as Conference | 'All')}
            className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 transition-all text-base sm:text-sm"
          >
            {conferences.map(conf => (
              <option key={conf} value={conf}>{conf}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
