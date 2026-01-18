/**
 * Get the API path for the current environment
 * Handles basePath (/cfb-hq) in both development and production
 */
export function getApiPath(path: string): string {
  const basePath = '/cfb-hq';

  // Remove leading slash if present for consistency
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // In browser, use basePath + relative path
  if (typeof window !== 'undefined') {
    return `${basePath}/${cleanPath}`;
  }

  // On server, use the full URL with basePath
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return `${baseUrl}${basePath}/${cleanPath}`;
}
