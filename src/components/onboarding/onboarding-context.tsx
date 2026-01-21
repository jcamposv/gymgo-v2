'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { OnboardingFormData } from '@/schemas/onboarding.schema'

// =============================================================================
// TYPES
// =============================================================================

type OnboardingData = Partial<OnboardingFormData>

interface OnboardingContextValue {
  data: OnboardingData
  updateData: (stepData: Partial<OnboardingData>) => void
  clearData: () => void
  isHydrated: boolean
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STORAGE_KEY = 'gymgo-onboarding-data'

const initialData: OnboardingData = {
  name: '',
  slug: '',
  business_type: undefined,
  country: 'MX',
  currency: 'MXN',
  timezone: 'America/Mexico_City',
  language: 'es',
  primary_color: '#84cc16',
  secondary_color: '#1e293b',
}

// =============================================================================
// CONTEXT
// =============================================================================

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

// =============================================================================
// PROVIDER
// =============================================================================

interface OnboardingProviderProps {
  children: ReactNode
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [data, setData] = useState<OnboardingData>(initialData)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as OnboardingData
        setData((prev) => ({ ...prev, ...parsed }))
      }
    } catch (error) {
      console.error('Error loading onboarding data from localStorage:', error)
    } finally {
      setIsHydrated(true)
    }
  }, [])

  // Persist data to localStorage whenever it changes (after hydration)
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      } catch (error) {
        console.error('Error saving onboarding data to localStorage:', error)
      }
    }
  }, [data, isHydrated])

  const updateData = useCallback((stepData: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...stepData }))
  }, [])

  const clearData = useCallback(() => {
    setData(initialData)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Error clearing onboarding data from localStorage:', error)
    }
  }, [])

  return (
    <OnboardingContext.Provider value={{ data, updateData, clearData, isHydrated }}>
      {children}
    </OnboardingContext.Provider>
  )
}

// =============================================================================
// HOOK
// =============================================================================

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}
