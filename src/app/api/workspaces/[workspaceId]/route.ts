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
  createUnauthorizedResponse,
  createInternalErrorResponse 
} from '@/lib/api-response'

// Validation schema for workspace update
const updateWorkspaceSchema = z.object({
  name: z
    .string()
    .min(2, 'Workspace name must be at least 2 characters long')
    .max(100, 'Workspace name must be less than 100 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional()
})

// Helper function to check if user has access to workspace
async function checkWorkspaceAccess(workspaceId: string, userId: string) {
  const workspace = await Workspace.findById(workspaceId)
  if (!workspace) {
    return { workspace: null, hasAccess: false, isOwner: false }
  }

  const isOwner = workspace.isOwner(userId)
  const isMember = workspace.isMember(userId)
  
  return { 
    workspace, 
    hasAccess: isOwner || isMember, 
    isOwner 
  }
}

// GET /api/workspaces/[workspaceId] - Get specific workspace
async function getWorkspaceHandler(
  request: NextRequest, 
  userInfo: UserInfo,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    await connectDB()

    const { workspaceId } = await params
    const { workspace, hasAccess } = await checkWorkspaceAccess(workspaceId, userInfo.userId)

    if (!workspace) {
      return createErrorResponse('Workspace not found', 404)
    }

    if (!hasAccess) {
      return createUnauthorizedResponse('You do not have access to this workspace')
    }

    // Populate owner and members
    await workspace.populate('owner', 'email')
    await workspace.populate('members', 'email')

    return createSuccessResponse(
      'Workspace retrieved successfully',
      { workspace }
    )

  } catch (error) {
    console.error('Get workspace error:', error)
    return createInternalErrorResponse('Failed to retrieve workspace')
  }
}

// PUT /api/workspaces/[workspaceId] - Update workspace (owner only)
async function updateWorkspaceHandler(
  request: NextRequest, 
  userInfo: UserInfo,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    await connectDB()

    const { workspaceId } = await params
    const { workspace, hasAccess, isOwner } = await checkWorkspaceAccess(workspaceId, userInfo.userId)

    if (!workspace) {
      return createErrorResponse('Workspace not found', 404)
    }

    if (!hasAccess) {
      return createUnauthorizedResponse('You do not have access to this workspace')
    }

    if (!isOwner) {
      return createUnauthorizedResponse('Only workspace owners can update workspace details')
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = validateInput(updateWorkspaceSchema, body)
    
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors!)
    }

    const updates = validation.data!

    // Check for duplicate name if name is being updated
    if (updates.name && updates.name !== workspace.name) {
      const existingWorkspace = await Workspace.findOne({
        name: updates.name,
        owner: userInfo.userId,
        _id: { $ne: workspace._id }
      })

      if (existingWorkspace) {
        return createErrorResponse(
          'Update failed',
          409,
          { name: ['You already have a workspace with this name'] }
        )
      }
    }

    // Update workspace
    Object.assign(workspace, updates)
    await workspace.save()

    // Populate for response
    await workspace.populate('owner', 'email')
    await workspace.populate('members', 'email')

    return createSuccessResponse(
      'Workspace updated successfully',
      { workspace }
    )

  } catch (error) {
    console.error('Update workspace error:', error)
    return createInternalErrorResponse('Failed to update workspace')
  }
}

// DELETE /api/workspaces/[workspaceId] - Delete workspace (owner only)
async function deleteWorkspaceHandler(
  request: NextRequest, 
  userInfo: UserInfo,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    await connectDB()

    const { workspaceId } = await params
    const { workspace, hasAccess, isOwner } = await checkWorkspaceAccess(workspaceId, userInfo.userId)

    if (!workspace) {
      return createErrorResponse('Workspace not found', 404)
    }

    if (!hasAccess) {
      return createUnauthorizedResponse('You do not have access to this workspace')
    }

    if (!isOwner) {
      return createUnauthorizedResponse('Only workspace owners can delete workspaces')
    }

    // Remove workspace from all users' workspaces arrays
    await User.updateMany(
      { workspaces: workspace._id },
      { $pull: { workspaces: workspace._id } }
    )

    // Delete the workspace
    await Workspace.findByIdAndDelete(workspace._id)

    return createSuccessResponse(
      'Workspace deleted successfully',
      { workspaceId: workspace._id }
    )

  } catch (error) {
    console.error('Delete workspace error:', error)
    return createInternalErrorResponse('Failed to delete workspace')
  }
}

// Export protected handlers with proper typing for Next.js dynamic routes
export async function GET(request: NextRequest, context: { params: Promise<{ workspaceId: string }> }) {
  return withAuth((req, userInfo) => getWorkspaceHandler(req, userInfo, context))(request)
}

export async function PUT(request: NextRequest, context: { params: Promise<{ workspaceId: string }> }) {
  return withAuth((req, userInfo) => updateWorkspaceHandler(req, userInfo, context))(request)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ workspaceId: string }> }) {
  return withAuth((req, userInfo) => deleteWorkspaceHandler(req, userInfo, context))(request)
}
