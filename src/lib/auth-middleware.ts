import { NextRequest } from 'next/server'
import { getUserFromToken } from '@/lib/jwt'
import { createUnauthorizedResponse } from '@/lib/api-response'

export interface UserInfo {
  userId: string
  email: string
}

/**
 * Middleware to protect API routes that require authentication
 */
export function withAuth(handler: (request: NextRequest, userInfo: UserInfo) => Promise<Response>) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      // Get user from JWT token
      const userInfo = getUserFromToken(request)
      
      if (!userInfo) {
        return createUnauthorizedResponse('Authentication required')
      }

      // Call the actual handler with user info
      return await handler(request, userInfo)
      
    } catch (error) {
      console.error('Auth middleware error:', error)
      return createUnauthorizedResponse('Authentication failed')
    }
  }
}

/**
 * Type for authenticated request handler
 */
export type AuthenticatedHandler = (
  request: NextRequest, 
  userInfo: UserInfo
) => Promise<Response>
