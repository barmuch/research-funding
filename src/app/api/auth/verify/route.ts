import { NextRequest } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { getUserFromToken } from '@/lib/jwt'
import { 
  createSuccessResponse, 
  createUnauthorizedResponse,
  createInternalErrorResponse 
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await connectDB()

    // Get user from JWT token
    const tokenPayload = getUserFromToken(request)
    if (!tokenPayload) {
      return createUnauthorizedResponse('Invalid or missing token')
    }

    // Find user in database
    const user = await User.findById(tokenPayload.userId)
    if (!user) {
      return createUnauthorizedResponse('User not found')
    }

    // Return user data
    return createSuccessResponse(
      'Token is valid',
      {
        user: {
          userId: user._id.toString(),
          email: user.email,
          createdAt: user.createdAt,
          workspaces: user.workspaces
        }
      }
    )

  } catch (error) {
    console.error('Token verification error:', error)
    return createInternalErrorResponse('Token verification failed')
  }
}
