import { NextRequest } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { withAuth, UserInfo } from '@/lib/auth-middleware'
import { 
  createSuccessResponse,
  createInternalErrorResponse 
} from '@/lib/api-response'

async function profileHandler(request: NextRequest, userInfo: UserInfo) {
  try {
    // Connect to database
    await connectDB()

    // Find user in database
    const user = await User.findById(userInfo.userId)
    if (!user) {
      return createInternalErrorResponse('User not found')
    }

    // Return user profile data
    return createSuccessResponse(
      'Profile retrieved successfully',
      {
        user: {
          userId: user._id.toString(),
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          workspaces: user.workspaces
        }
      }
    )

  } catch (error) {
    console.error('Profile retrieval error:', error)
    return createInternalErrorResponse('Failed to retrieve profile')
  }
}

// Export protected GET handler
export const GET = withAuth(profileHandler)
