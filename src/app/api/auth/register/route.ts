import { NextRequest } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { registerSchema, validateInput } from '@/lib/validation'
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
    const validation = validateInput(registerSchema, body)
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors!)
    }

    const { email, password } = validation.data!

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return createErrorResponse(
        'Registration failed',
        { email: ['User with this email already exists'] },
        409
      )
    }

    // Create new user
    const user = new User({
      email,
      password, // Will be automatically hashed by the pre-save middleware
    })

    await user.save()

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email
    })

    // Return success response with user data and token
    return createSuccessResponse(
      'User registered successfully',
      {
        user: {
          userId: user._id.toString(),
          email: user.email,
          createdAt: user.createdAt,
          workspaces: user.workspaces
        },
        token
      },
      201
    )

  } catch (error) {
    console.error('Registration error:', error)
    
    // Handle MongoDB duplicate key error
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      return createErrorResponse(
        'Registration failed',
        { email: ['User with this email already exists'] },
        409
      )
    }

    return createInternalErrorResponse('Registration failed. Please try again.')
  }
}
