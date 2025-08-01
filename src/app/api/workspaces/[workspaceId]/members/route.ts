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
  createInternalErrorResponse,
  createUnauthorizedResponse
} from '@/lib/api-response'

// Validation schema for adding member
const addMemberSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim()
})

// Validation schema for removing member
const removeMemberSchema = z.object({
  userId: z
    .string()
    .min(1, 'User ID is required')
})

// Helper function to check if user is workspace owner
async function checkWorkspaceOwnership(workspaceId: string, userId: string) {
  const workspace = await Workspace.findById(workspaceId)
  if (!workspace) {
    return { workspace: null, isOwner: false }
  }

  return { 
    workspace, 
    isOwner: workspace.isOwner(userId)
  }
}

// POST /api/workspaces/[workspaceId]/members - Add member to workspace (owner only)
async function addMemberHandler(
  request: NextRequest, 
  userInfo: UserInfo,
  { params }: { params: { workspaceId: string } }
) {
  try {
    await connectDB()

    const { workspace, isOwner } = await checkWorkspaceOwnership(params.workspaceId, userInfo.userId)

    if (!workspace) {
      return createErrorResponse('Workspace not found', undefined, 404)
    }

    if (!isOwner) {
      return createUnauthorizedResponse('Only workspace owners can invite members')
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = validateInput(addMemberSchema, body)
    
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors!)
    }

    const { email } = validation.data!

    // Find user by email
    const userToAdd = await User.findOne({ email })
    if (!userToAdd) {
      return createErrorResponse(
        'User not found',
        { email: ['No user found with this email address'] },
        404
      )
    }

    // Check if user is trying to add themselves
    if (userToAdd._id.toString() === userInfo.userId) {
      return createErrorResponse(
        'Invalid operation',
        { email: ['You cannot add yourself to the workspace'] },
        400
      )
    }

    // Check if user is already a member
    if (workspace.isMember(userToAdd._id.toString())) {
      return createErrorResponse(
        'User already a member',
        { email: ['This user is already a member of the workspace'] },
        409
      )
    }

    // Add user to workspace
    workspace.addMember(userToAdd._id.toString())
    await workspace.save()

    // Add workspace to user's workspaces array
    await User.findByIdAndUpdate(
      userToAdd._id,
      { $addToSet: { workspaces: workspace._id } }
    )

    // Populate for response
    await workspace.populate('owner', 'email')
    await workspace.populate('members', 'email')

    return createSuccessResponse(
      'Member added successfully',
      { 
        workspace,
        addedUser: {
          userId: userToAdd._id.toString(),
          email: userToAdd.email
        }
      }
    )

  } catch (error) {
    console.error('Add member error:', error)
    return createInternalErrorResponse('Failed to add member')
  }
}

// DELETE /api/workspaces/[workspaceId]/members - Remove member from workspace (owner only)
async function removeMemberHandler(
  request: NextRequest, 
  userInfo: UserInfo,
  { params }: { params: { workspaceId: string } }
) {
  try {
    await connectDB()

    const { workspace, isOwner } = await checkWorkspaceOwnership(params.workspaceId, userInfo.userId)

    if (!workspace) {
      return createErrorResponse('Workspace not found', undefined, 404)
    }

    if (!isOwner) {
      return createUnauthorizedResponse('Only workspace owners can remove members')
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = validateInput(removeMemberSchema, body)
    
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors!)
    }

    const { userId } = validation.data!

    // Check if trying to remove the owner
    if (userId === userInfo.userId) {
      return createErrorResponse(
        'Invalid operation',
        { userId: ['You cannot remove yourself from your own workspace'] },
        400
      )
    }

    // Check if user is actually a member
    if (!workspace.isMember(userId)) {
      return createErrorResponse(
        'User not found',
        { userId: ['This user is not a member of the workspace'] },
        404
      )
    }

    // Remove user from workspace
    workspace.removeMember(userId)
    await workspace.save()

    // Remove workspace from user's workspaces array
    await User.findByIdAndUpdate(
      userId,
      { $pull: { workspaces: workspace._id } }
    )

    // Get removed user info for response
    const removedUser = await User.findById(userId, 'email')

    // Populate for response
    await workspace.populate('owner', 'email')
    await workspace.populate('members', 'email')

    return createSuccessResponse(
      'Member removed successfully',
      { 
        workspace,
        removedUser: removedUser ? {
          userId: removedUser._id.toString(),
          email: removedUser.email
        } : null
      }
    )

  } catch (error) {
    console.error('Remove member error:', error)
    return createInternalErrorResponse('Failed to remove member')
  }
}

// GET /api/workspaces/[workspaceId]/members - Get workspace members
async function getMembersHandler(
  request: NextRequest, 
  userInfo: UserInfo,
  { params }: { params: { workspaceId: string } }
) {
  try {
    await connectDB()

    const workspace = await Workspace.findById(params.workspaceId)
    if (!workspace) {
      return createErrorResponse('Workspace not found', undefined, 404)
    }

    // Check if user has access to workspace
    if (!workspace.isMember(userInfo.userId)) {
      return createUnauthorizedResponse('You do not have access to this workspace')
    }

    // Populate members and owner
    await workspace.populate('owner', 'email createdAt')
    await workspace.populate('members', 'email createdAt')

    const ownerData = workspace.owner as { _id: string; email: string }
    const members = [
      {
        userId: ownerData._id.toString(),
        email: ownerData.email,
        role: 'owner' as const,
        joinedAt: workspace.createdAt
      },
      ...workspace.members.map((member: { _id: string; email: string; createdAt: Date }) => ({
        userId: member._id.toString(),
        email: member.email,
        role: 'member' as const,
        joinedAt: member.createdAt
      }))
    ]

    return createSuccessResponse(
      'Members retrieved successfully',
      { members }
    )

  } catch (error) {
    console.error('Get members error:', error)
    return createInternalErrorResponse('Failed to retrieve members')
  }
}

// Export protected handlers with proper typing for Next.js dynamic routes
export async function POST(request: NextRequest, context: { params: { workspaceId: string } }) {
  return withAuth((req, userInfo) => addMemberHandler(req, userInfo, context))(request)
}

export async function DELETE(request: NextRequest, context: { params: { workspaceId: string } }) {
  return withAuth((req, userInfo) => removeMemberHandler(req, userInfo, context))(request)
}

export async function GET(request: NextRequest, context: { params: { workspaceId: string } }) {
  return withAuth((req, userInfo) => getMembersHandler(req, userInfo, context))(request)
}
