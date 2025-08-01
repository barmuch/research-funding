import { NextRequest } from 'next/server'
import connectDB from '@/lib/mongodb'
import Plan from '@/models/Plan'
import { createPlanSchema, getPlansByWorkspaceSchema } from '@/lib/validations/plan'
import { verifyWorkspaceAccess } from '@/lib/middleware/workspace-auth'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-response'

// GET /api/plans?workspaceId=... - Ambil semua plans dari workspace tertentu
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')

    // Validate query parameters
    const validation = getPlansByWorkspaceSchema.safeParse({ workspaceId })
    if (!validation.success) {
      return createErrorResponse('Validation failed', 400, validation.error.flatten().fieldErrors)
    }

    // Verify workspace access
    const accessCheck = await verifyWorkspaceAccess(request, workspaceId!)
    if (!accessCheck.success) {
      return createErrorResponse(accessCheck.message, accessCheck.status)
    }

    // Connect to database
    await connectDB()

    // Get all plans for the workspace
    const plans = await Plan.getPlansByWorkspace(workspaceId!)
    const totalPlannedAmount = await Plan.getTotalPlannedAmount(workspaceId!)

    return createSuccessResponse('Plans retrieved successfully', {
      plans: plans.map(plan => ({
        id: (plan._id as any).toString(),
        workspaceId: (plan.workspaceId as any).toString(),
        type: plan.type,
        plannedAmount: plan.plannedAmount,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt
      })),
      summary: {
        totalPlans: plans.length,
        totalPlannedAmount,
        averageAmount: plans.length > 0 ? totalPlannedAmount / plans.length : 0
      }
    })
  } catch (error) {
    console.error('GET /api/plans error:', error)
    return createErrorResponse('Failed to retrieve plans', 500)
  }
}

// POST /api/plans - Tambah plan baru ke workspace
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = createPlanSchema.safeParse(body)
    if (!validation.success) {
      return createErrorResponse('Validation failed', 400, validation.error.flatten().fieldErrors)
    }

    const { workspaceId, type, plannedAmount } = validation.data

    // Verify workspace access
    const accessCheck = await verifyWorkspaceAccess(request, workspaceId)
    if (!accessCheck.success) {
      return createErrorResponse(accessCheck.message, accessCheck.status)
    }

    // Connect to database
    await connectDB()

    // Check if plan type already exists in this workspace
    const existingPlan = await Plan.findOne({ 
      workspaceId, 
      type: type.trim() 
    })
    
    if (existingPlan) {
      return createErrorResponse(
        'A plan with this type already exists in this workspace', 
        409
      )
    }

    // Create new plan
    const newPlan = new Plan({
      workspaceId,
      type: type.trim(),
      plannedAmount
    })

    await newPlan.save()

    return createSuccessResponse('Plan created successfully', {
      plan: {
        id: (newPlan._id as any).toString(),
        workspaceId: (newPlan.workspaceId as any).toString(),
        type: newPlan.type,
        plannedAmount: newPlan.plannedAmount,
        createdAt: newPlan.createdAt,
        updatedAt: newPlan.updatedAt
      }
    }, 201)
  } catch (error) {
    console.error('POST /api/plans error:', error)
    
    // Handle duplicate key error
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      return createErrorResponse('A plan with this type already exists in this workspace', 409)
    }
    
    return createErrorResponse('Failed to create plan', 500)
  }
}
