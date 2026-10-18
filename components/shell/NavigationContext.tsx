'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

interface NavigationContextValue {
  isMobileNavOpen: boolean;
  openMobileNav: () => void;
  closeMobileNav: () => void;
  toggleMobileNav: () => void;
}

const NavigationContext = createContext<NavigationContextValue>({
  isMobileNavOpen: false,
  openMobileNav: () => {},
  closeMobileNav: () => {},
  toggleMobileNav: () => {},
});

export function useNavigation() {
  return useContext(NavigationContext);
}

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const pathname = usePathname();

  const openMobileNav = useCallback(() => setIsMobileNavOpen(true), []);
  const closeMobileNav = useCallback(() => setIsMobileNavOpen(false), []);
  const toggleMobileNav = useCallback(() => setIsMobileNavOpen((prev) => !prev), []);

  // Automatically close mobile menu on route change
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileNavOpen) {
        setIsMobileNavOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileNavOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileNavOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileNavOpen]);

  return (
    <NavigationContext.Provider
      value={{
        isMobileNavOpen,
        openMobileNav,
        closeMobileNav,
        toggleMobileNav,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}
