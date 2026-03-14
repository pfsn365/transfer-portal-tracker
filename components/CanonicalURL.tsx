'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const BASE_URL = 'https://www.profootballnetwork.com/cfb-hq';

export default function CanonicalURL() {
  const pathname = usePathname();

  useEffect(() => {
    // Remove any existing canonical link
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.remove();
    }

    // Build canonical URL: strip trailing slashes and query params
    const cleanPath = pathname.replace(/\/+$/, '');
    const link = document.createElement('link');
    link.rel = 'canonical';
    link.href = `${BASE_URL}${cleanPath}`;
    document.head.appendChild(link);

    return () => {
      // Cleanup on unmount
      const canonicalLink = document.querySelector('link[rel="canonical"]');
      if (canonicalLink) {
        canonicalLink.remove();
      }
    };
  }, [pathname]);

  return null;
}
