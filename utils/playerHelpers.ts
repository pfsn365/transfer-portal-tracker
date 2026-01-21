// Shared player helper utilities

/**
 * Creates a URL-friendly slug from a player name
 * Used for player image paths and URLs
 */
export function createPlayerSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Gets player initials from their full name
 * Returns first and last initial, or first two chars if single name
 */
export function getPlayerInitials(name: string): string {
  const parts = name.split(' ').filter(p => p.length > 0);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0]?.substring(0, 2).toUpperCase() || '??';
}
