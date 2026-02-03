/**
 * Tests for JWT utility functions
 */

import {
  decodeJWT,
  isTokenExpired,
  isTokenExpiringSoon,
  getTokenExpiration,
  getTokenTimeRemaining,
  getUserFromToken,
  isValidTokenFormat
} from '../jwt'

// Mock JWT tokens for testing
const createMockToken = (payload: any): string => {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = btoa(JSON.stringify(header))
  const encodedPayload = btoa(JSON.stringify(payload))
  const signature = 'mock-signature'
  return `${encodedHeader}.${encodedPayload}.${signature}`
}

describe('JWT Utilities', () => {
  const futureTime = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
  const pastTime = Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
  const soonTime = Math.floor(Date.now() / 1000) + 120 // 2 minutes from now

  const validPayload = {
    userId: 'user123',
    role: 'BUYER',
    exp: futureTime,
    iat: Math.floor(Date.now() / 1000)
  }

  const expiredPayload = {
    userId: 'user123',
    role: 'BUYER',
    exp: pastTime,
    iat: Math.floor(Date.now() / 1000) - 7200
  }

  const expiringSoonPayload = {
    userId: 'user123',
    role: 'BUYER',
    exp: soonTime,
    iat: Math.floor(Date.now() / 1000)
  }

  describe('decodeJWT', () => {
    it('should decode a valid JWT token', () => {
      const token = createMockToken(validPayload)
      const decoded = decodeJWT(token)
      
      expect(decoded).toEqual(validPayload)
    })

    it('should return null for invalid token format', () => {
      expect(decodeJWT('invalid-token')).toBeNull()
      expect(decodeJWT('invalid.token')).toBeNull()
      expect(decodeJWT('')).toBeNull()
    })
  })

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const token = createMockToken(validPayload)
      expect(isTokenExpired(token)).toBe(false)
    })

    it('should return true for expired token', () => {
      const token = createMockToken(expiredPayload)
      expect(isTokenExpired(token)).toBe(true)
    })

    it('should return null for invalid token', () => {
      expect(isTokenExpired('invalid-token')).toBeNull()
    })
  })

  describe('isTokenExpiringSoon', () => {
    it('should return false for token with plenty of time', () => {
      const token = createMockToken(validPayload)
      expect(isTokenExpiringSoon(token, 5)).toBe(false)
    })

    it('should return true for token expiring soon', () => {
      const token = createMockToken(expiringSoonPayload)
      expect(isTokenExpiringSoon(token, 5)).toBe(true)
    })

    it('should return null for invalid token', () => {
      expect(isTokenExpiringSoon('invalid-token', 5)).toBeNull()
    })
  })

  describe('getTokenExpiration', () => {
    it('should return correct expiration date', () => {
      const token = createMockToken(validPayload)
      const expiration = getTokenExpiration(token)
      
      expect(expiration).toBeInstanceOf(Date)
      expect(expiration?.getTime()).toBe(futureTime * 1000)
    })

    it('should return null for invalid token', () => {
      expect(getTokenExpiration('invalid-token')).toBeNull()
    })
  })

  describe('getTokenTimeRemaining', () => {
    it('should return positive time for valid token', () => {
      const token = createMockToken(validPayload)
      const timeRemaining = getTokenTimeRemaining(token)
      
      expect(timeRemaining).toBeGreaterThan(0)
    })

    it('should return 0 for expired token', () => {
      const token = createMockToken(expiredPayload)
      const timeRemaining = getTokenTimeRemaining(token)
      
      expect(timeRemaining).toBe(0)
    })

    it('should return null for invalid token', () => {
      expect(getTokenTimeRemaining('invalid-token')).toBeNull()
    })
  })

  describe('getUserFromToken', () => {
    it('should extract user info from valid token', () => {
      const token = createMockToken(validPayload)
      const userInfo = getUserFromToken(token)
      
      expect(userInfo).toEqual({
        userId: 'user123',
        role: 'BUYER'
      })
    })

    it('should return null for invalid token', () => {
      expect(getUserFromToken('invalid-token')).toBeNull()
    })

    it('should return null for token missing user info', () => {
      const incompletePayload = { exp: futureTime }
      const token = createMockToken(incompletePayload)
      expect(getUserFromToken(token)).toBeNull()
    })
  })

  describe('isValidTokenFormat', () => {
    it('should return true for valid token format', () => {
      const token = createMockToken(validPayload)
      expect(isValidTokenFormat(token)).toBe(true)
    })

    it('should return false for invalid formats', () => {
      expect(isValidTokenFormat('invalid-token')).toBe(false)
      expect(isValidTokenFormat('invalid.token')).toBe(false)
      expect(isValidTokenFormat('')).toBe(false)
      expect(isValidTokenFormat('too.many.parts.here')).toBe(false)
    })

    it('should return false for non-string input', () => {
      expect(isValidTokenFormat(null as any)).toBe(false)
      expect(isValidTokenFormat(undefined as any)).toBe(false)
      expect(isValidTokenFormat(123 as any)).toBe(false)
    })
  })
})