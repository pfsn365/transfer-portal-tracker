// CSV Export utility for downloading player data

import { TransferPlayer } from '@/types/player';

export function exportToCSV(players: TransferPlayer[], filename: string = 'transfer-portal-data.csv'): void {
  if (players.length === 0) {
    alert('No data to export');
    return;
  }

  // Define CSV headers
  const headers = [
    'Player Name',
    'Position',
    'Class',
    'Status',
    'Former School',
    'Former Conference',
    'New School',
    'New Conference',
    'Impact Grade',
    'Date Announced'
  ];

  // Create CSV rows
  const rows = players.map(player => {
    return [
      escapeCSVField(player.name),
      player.position,
      player.class,
      player.status,
      escapeCSVField(player.formerSchool),
      escapeCSVField(player.formerConference || ''),
      escapeCSVField(player.newSchool || ''),
      escapeCSVField(player.newConference || ''),
      player.rating ? player.rating.toFixed(1) : '-',
      formatDate(player.announcedDate)
    ].join(',');
  });

  // Combine headers and rows
  const csv = [headers.join(','), ...rows].join('\n');

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Escape CSV fields that contain commas, quotes, or newlines
function escapeCSVField(field: string): string {
  if (!field) return '';

  // If field contains comma, quote, or newline, wrap in quotes and escape existing quotes
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }

  return field;
}

// Format date for CSV
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}
