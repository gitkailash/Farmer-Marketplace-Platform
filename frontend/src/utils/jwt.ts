/**
 * JWT utility functions for token handling and validation
 */

interface JWTPayload {
  exp: number
  iat: number
  userId: string
  role: string
  [key: string]: any
}

/**
 * Decode JWT token without verification (client-side only)
 * @param token JWT token string
 * @returns Decoded payload or null if invalid
 */
export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    const payload = parts[1]
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return decoded as JWTPayload
  } catch (error) {
    console.error('Failed to decode JWT:', error)
    return null
  }
}

/**
 * Check if JWT token is expired
 * @param token JWT token string
 * @returns true if expired, false if valid, null if invalid token
 */
export const isTokenExpired = (token: string): boolean | null => {
  const payload = decodeJWT(token)
  if (!payload || !payload.exp) {
    return null
  }

  const currentTime = Math.floor(Date.now() / 1000)
  return payload.exp < currentTime
}

/**
 * Check if JWT token will expire within a given time frame
 * @param token JWT token string
 * @param bufferMinutes Minutes before expiration to consider as "expiring soon"
 * @returns true if expiring soon, false if not, null if invalid token
 */
export const isTokenExpiringSoon = (token: string, bufferMinutes: number = 5): boolean | null => {
  const payload = decodeJWT(token)
  if (!payload || !payload.exp) {
    return null
  }

  const currentTime = Math.floor(Date.now() / 1000)
  const bufferSeconds = bufferMinutes * 60
  return payload.exp < (currentTime + bufferSeconds)
}

/**
 * Get token expiration time as Date object
 * @param token JWT token string
 * @returns Date object or null if invalid token
 */
export const getTokenExpiration = (token: string): Date | null => {
  const payload = decodeJWT(token)
  if (!payload || !payload.exp) {
    return null
  }

  return new Date(payload.exp * 1000)
}

/**
 * Get time remaining until token expires
 * @param token JWT token string
 * @returns Milliseconds until expiration, or null if invalid token
 */
export const getTokenTimeRemaining = (token: string): number | null => {
  const payload = decodeJWT(token)
  if (!payload || !payload.exp) {
    return null
  }

  const currentTime = Math.floor(Date.now() / 1000)
  const timeRemaining = (payload.exp - currentTime) * 1000
  return Math.max(0, timeRemaining)
}

/**
 * Extract user information from JWT token
 * @param token JWT token string
 * @returns User info object or null if invalid token
 */
export const getUserFromToken = (token: string): { userId: string; role: string } | null => {
  const payload = decodeJWT(token)
  if (!payload || !payload.userId || !payload.role) {
    return null
  }

  return {
    userId: payload.userId,
    role: payload.role
  }
}

/**
 * Validate token format and basic structure
 * @param token JWT token string
 * @returns true if token has valid format, false otherwise
 */
export const isValidTokenFormat = (token: string): boolean => {
  if (!token || typeof token !== 'string') {
    return false
  }

  const parts = token.split('.')
  if (parts.length !== 3) {
    return false
  }

  try {
    // Try to decode each part to ensure it's valid base64
    atob(parts[0].replace(/-/g, '+').replace(/_/g, '/'))
    atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    return true
  } catch {
    return false
  }
}