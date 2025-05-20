"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

const GoogleAnalytics = () => {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'G-DXR752DMTX', {
        page_path: pathname,
      });
    }
  }, [pathname]);

  return null;
};

export default GoogleAnalytics;
