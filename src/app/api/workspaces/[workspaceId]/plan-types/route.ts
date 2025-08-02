import { NextRequest } from 'next/server'
import connectDB from '@/lib/mongodb'
import Plan from '@/models/Plan'
import { verifyWorkspaceAccess } from '@/lib/middleware/workspace-auth'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-response'

// GET /api/workspaces/[workspaceId]/plan-types - Ambil semua plan types dari workspace
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params

    // Verify workspace access
    const accessCheck = await verifyWorkspaceAccess(request, workspaceId)
    if (!accessCheck.success) {
      return createErrorResponse(accessCheck.message, accessCheck.status)
    }

    // Connect to database
    await connectDB()

    // Get all plans for the workspace
    const plans = await Plan.find({ workspaceId }).select('type').lean()
    
    // Extract unique plan types and add 'other' option
    const planTypes = Array.from(new Set(plans.map(plan => plan.type)))
    
    // Ensure 'other' is always available
    if (!planTypes.includes('other')) {
      planTypes.push('other')
    }

    return createSuccessResponse('Plan types retrieved successfully', {
      planTypes: planTypes.sort(),
      totalPlans: plans.length
    })
  } catch (error) {
    console.error('GET /api/workspaces/[workspaceId]/plan-types error:', error)
    return createErrorResponse('Failed to retrieve plan types', 500)
  }
}
