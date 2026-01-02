'use client'

import { useState, useEffect } from 'react'

/**
 * Hook to detect if a media query matches
 * @param query - CSS media query string (e.g., '(min-width: 768px)')
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)

    // Set initial value
    setMatches(mediaQuery.matches)

    // Create listener
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Add listener
    mediaQuery.addEventListener('change', handler)

    // Cleanup
    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])

  return matches
}

/**
 * Hook to detect mobile viewport (< 768px by default)
 * Returns true on mobile, false on desktop
 */
export function useIsMobile(breakpoint = 768): boolean {
  const isDesktop = useMediaQuery(`(min-width: ${breakpoint}px)`)
  return !isDesktop
}
