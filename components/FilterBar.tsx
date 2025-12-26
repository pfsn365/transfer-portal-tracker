import { PlayerStatus, PlayerClass, PlayerPosition, Conference } from '@/types/player';

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
  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
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

        {/* School Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            School
          </label>
          <select
            value={selectedSchool}
            onChange={(e) => onSchoolChange(e.target.value)}
            className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 transition-all text-base sm:text-sm"
          >
            <option value="All">All</option>
            {schools.map(school => (
              <option key={school} value={school}>{school}</option>
            ))}
          </select>
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
