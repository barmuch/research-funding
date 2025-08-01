import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import Workspace from '@/models/Workspace'
import connectDB from '@/lib/mongodb'
import mongoose from 'mongoose'

export interface WorkspaceAuthContext {
  user: {
    userId: string
    email: string
  }
  workspace: {
    _id: string
    name: string
    owner: string
    members: string[]
  }
  isOwner: boolean
  isMember: boolean
}

/**
 * Middleware untuk memverifikasi bahwa user memiliki akses ke workspace tertentu
 * User harus menjadi owner atau member dari workspace
 */
export async function verifyWorkspaceAccess(
  request: NextRequest, 
  workspaceId: string
): Promise<{ success: true; data: WorkspaceAuthContext } | { success: false; message: string; status: number }> {
  try {
    // Verify JWT token
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return { success: false, message: 'Access token required', status: 401 }
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return { success: false, message: 'Invalid or expired token', status: 401 }
    }

    // Connect to database
    await connectDB()

    // Find workspace and check if user has access
    const workspace = await Workspace.findById(workspaceId).lean()
    
    if (!workspace) {
      return { success: false, message: 'Workspace not found', status: 404 }
    }

    // Check if user is owner
    const isOwner = workspace.owner.toString() === decoded.userId

    // Check if user is member (including owner)
    const isMember = workspace.members.some(
      (memberId: mongoose.Types.ObjectId) => memberId.toString() === decoded.userId
    ) || isOwner

    // User must be either owner or member
    if (!isOwner && !isMember) {
      return { 
        success: false, 
        message: 'You do not have access to this workspace', 
        status: 403 
      }
    }

    return {
      success: true,
      data: {
        user: {
          userId: decoded.userId,
          email: decoded.email
        },
        workspace: {
          _id: workspace._id.toString(),
          name: workspace.name,
          owner: workspace.owner.toString(),
          members: workspace.members.map((memberId: mongoose.Types.ObjectId) => memberId.toString())
        },
        isOwner,
        isMember
      }
    }
  } catch (error) {
    console.error('Workspace access verification error:', error)
    return { 
      success: false, 
      message: 'Failed to verify workspace access', 
      status: 500 
    }
  }
}

/**
 * Helper function untuk memverifikasi akses workspace dari query parameter atau body
 */
export async function getWorkspaceAccessFromRequest(
  request: NextRequest,
  workspaceIdSource: 'query' | 'body' = 'query'
): Promise<{ success: true; data: WorkspaceAuthContext } | { success: false; message: string; status: number }> {
  let workspaceId: string

  if (workspaceIdSource === 'query') {
    const { searchParams } = new URL(request.url)
    workspaceId = searchParams.get('workspaceId') || ''
  } else {
    try {
      const body = await request.json()
      workspaceId = body.workspaceId || ''
    } catch {
      return { success: false, message: 'Invalid request body', status: 400 }
    }
  }

  if (!workspaceId) {
    return { success: false, message: 'Workspace ID is required', status: 400 }
  }

  return verifyWorkspaceAccess(request, workspaceId)
}
