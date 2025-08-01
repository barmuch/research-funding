import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables')
}

export interface JWTPayload {
  userId: string
  email: string
  iat?: number
  exp?: number
}

/**
 * Generate JWT token for user
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  })
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & JWTPayload
    return {
      userId: decoded.userId,
      email: decoded.email,
      iat: decoded.iat,
      exp: decoded.exp
    }
  } catch {
    return null
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  return authHeader.substring(7) // Remove 'Bearer ' prefix
}

/**
 * Get user data from JWT token in request
 */
export function getUserFromToken(request: NextRequest): JWTPayload | null {
  const token = extractTokenFromHeader(request)
  
  if (!token) {
    return null
  }
  
  return verifyToken(token)
}
