import { NextRequest } from 'next/server'
import connectDB from '@/lib/mongodb'
import Workspace from '@/models/Workspace'
import User from '@/models/User'
import { withAuth, UserInfo } from '@/lib/auth-middleware'
import { validateInput } from '@/lib/validation'
import { z } from 'zod'
import { 
  createSuccessResponse, 
  createErrorResponse,
  createValidationErrorResponse,
  createInternalErrorResponse 
} from '@/lib/api-response'

// Validation schema for workspace creation
const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(2, 'Workspace name must be at least 2 characters long')
    .max(100, 'Workspace name must be less than 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional()
    .default('')
})

// GET /api/workspaces - Get all workspaces for the authenticated user
async function getWorkspacesHandler(request: NextRequest, userInfo: UserInfo) {
  try {
    await connectDB()

    // Find workspaces where user is owner or member
    const workspaces = await Workspace.find({
      $or: [
        { owner: userInfo.userId },
        { members: userInfo.userId }
      ]
    })
    .populate('owner', 'email')
    .populate('members', 'email')
    .sort({ updatedAt: -1 })

    return createSuccessResponse(
      'Workspaces retrieved successfully',
      { workspaces }
    )

  } catch (error) {
    console.error('Get workspaces error:', error)
    return createInternalErrorResponse('Failed to retrieve workspaces')
  }
}

// POST /api/workspaces - Create a new workspace
async function createWorkspaceHandler(request: NextRequest, userInfo: UserInfo) {
  try {
    await connectDB()

    // Parse and validate request body
    const body = await request.json()
    const validation = validateInput(createWorkspaceSchema, body)
    
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors!)
    }

    const { name, description } = validation.data!

    // Check if user already has a workspace with this name
    const existingWorkspace = await Workspace.findOne({
      name,
      owner: userInfo.userId
    })

    if (existingWorkspace) {
      return createErrorResponse(
        'Workspace creation failed',
        { name: ['You already have a workspace with this name'] },
        409
      )
    }

    // Create new workspace
    const workspace = new Workspace({
      name,
      description,
      owner: userInfo.userId,
      members: [] // Start with no additional members
    })

    await workspace.save()

    // Add workspace to user's workspaces array
    await User.findByIdAndUpdate(
      userInfo.userId,
      { $addToSet: { workspaces: workspace._id } }
    )

    // Populate owner info for response
    await workspace.populate('owner', 'email')

    return createSuccessResponse(
      'Workspace created successfully',
      { workspace },
      201
    )

  } catch (error) {
    console.error('Create workspace error:', error)
    
    // Handle MongoDB duplicate key error
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      return createErrorResponse(
        'Workspace creation failed',
        { name: ['You already have a workspace with this name'] },
        409
      )
    }

    return createInternalErrorResponse('Failed to create workspace')
  }
}

// Export protected handlers
export const GET = withAuth(getWorkspacesHandler)
export const POST = withAuth(createWorkspaceHandler)
