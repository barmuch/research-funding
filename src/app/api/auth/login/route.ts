import { NextRequest } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { loginSchema, validateInput } from '@/lib/validation'
import { generateToken } from '@/lib/jwt'
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createValidationErrorResponse,
  createInternalErrorResponse 
} from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await connectDB()

    // Parse request body
    const body = await request.json()

    // Validate input
    const validation = validateInput(loginSchema, body)
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors!)
    }

    const { email, password } = validation.data!

    // Find user by email and include password field
    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return createErrorResponse(
        'Login failed',
        { email: ['Invalid email or password'] },
        401
      )
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return createErrorResponse(
        'Login failed',
        { password: ['Invalid email or password'] },
        401
      )
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email
    })

    // Return success response with user data and token
    return createSuccessResponse(
      'Login successful',
      {
        user: {
          userId: user._id.toString(),
          email: user.email,
          createdAt: user.createdAt,
          workspaces: user.workspaces
        },
        token
      }
    )

  } catch (error) {
    console.error('Login error:', error)
    return createInternalErrorResponse('Login failed. Please try again.')
  }
}
