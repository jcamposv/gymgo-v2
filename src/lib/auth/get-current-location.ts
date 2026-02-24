import { cookies } from 'next/headers'

const COOKIE_NAME = 'gymgo-location-id'

/**
 * Get the current location ID from the cookie (server-side)
 * Returns null if no location is selected or cookie doesn't exist
 */
export async function getCurrentLocationId(): Promise<string | null> {
  const cookieStore = await cookies()
  const locationCookie = cookieStore.get(COOKIE_NAME)
  return locationCookie?.value || null
}

/**
 * Get the current location ID, with optional validation against user's locations
 * This is useful to ensure the location belongs to the user's organization
 */
export async function getValidatedLocationId(
  userLocationIds: string[]
): Promise<string | null> {
  const locationId = await getCurrentLocationId()

  if (!locationId) return null

  // Validate the location belongs to the user's organization
  if (!userLocationIds.includes(locationId)) {
    return null
  }

  return locationId
}
