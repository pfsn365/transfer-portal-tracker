import { useState, useRef, useEffect } from 'react';
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

// Custom School Dropdown Component
function CustomSchoolDropdown({
  selectedSchool,
  onSchoolChange,
  router
}: {
  selectedSchool: string;
  onSchoolChange: (school: string) => void;
  router: ReturnType<typeof useRouter>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedConference, setSelectedConference] = useState<Conference | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedConference(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConferenceClick = (conference: Conference) => {
    setSelectedConference(conference);
    // Dropdown stays open
  };

  const handleTeamClick = (teamName: string) => {
    onSchoolChange(teamName);
    const team = getTeamById(teamName);
    if (team) {
      router.push(`/college/${team.slug}`);
    }
    setIsOpen(false);
    setSelectedConference(null);
  };

  const handleBackClick = () => {
    setSelectedConference(null);
    // Dropdown stays open
  };

  const displayText = selectedSchool !== 'All' ? selectedSchool : 'All Schools';

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 transition-all text-base sm:text-sm text-left flex items-center justify-between"
      >
        <span>{displayText}</span>
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {!selectedConference ? (
            // Conference Selection
            <>
              <div className="px-3 py-2 text-sm font-semibold text-gray-500 bg-gray-50 sticky top-0">
                Select Conference
              </div>
              {getAllConferences().map(conference => (
                <button
                  key={conference}
                  type="button"
                  onClick={() => handleConferenceClick(conference)}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm text-gray-900 transition-colors"
                >
                  {conference}
                </button>
              ))}
            </>
          ) : (
            // Team Selection
            <>
              <button
                type="button"
                onClick={handleBackClick}
                className="w-full text-left px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 sticky top-0 bg-white border-b border-gray-200"
              >
                ← Back to Conferences
              </button>
              <div className="px-3 py-2 text-sm font-semibold text-gray-500 bg-gray-50 sticky top-0">
                {selectedConference} Schools
              </div>
              <button
                type="button"
                onClick={() => {
                  onSchoolChange('All');
                  setIsOpen(false);
                  setSelectedConference(null);
                }}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm text-gray-900 transition-colors"
              >
                All {selectedConference} Schools
              </button>
              {getTeamsByConference(selectedConference).map(team => (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => handleTeamClick(team.name)}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm text-gray-900 transition-colors"
                >
                  {team.name}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

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

        {/* School Filter - Custom Dropdown */}
        <div className="lg:col-span-2 relative">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            School
          </label>
          <CustomSchoolDropdown
            selectedSchool={selectedSchool}
            onSchoolChange={onSchoolChange}
            router={router}
          />
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
