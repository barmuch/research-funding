import { NextRequest } from 'next/server'
import connectDB from '@/lib/mongodb'
import Plan from '@/models/Plan'
import { updatePlanSchema } from '@/lib/validations/plan'
import { verifyWorkspaceAccess } from '@/lib/middleware/workspace-auth'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-response'
import mongoose from 'mongoose'

// GET /api/plans/[id] - Ambil plan berdasarkan ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const planId = params.id

    // Validate plan ID format
    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return createErrorResponse('Invalid plan ID format', 400)
    }

    // Connect to database
    await connectDB()

    // Find plan
    const plan = await Plan.findById(planId).lean()
    if (!plan) {
      return createErrorResponse('Plan not found', 404)
    }

    // Verify workspace access
    const accessCheck = await verifyWorkspaceAccess(request, plan.workspaceId.toString())
    if (!accessCheck.success) {
      return createErrorResponse(accessCheck.message, accessCheck.status)
    }

    return createSuccessResponse('Plan retrieved successfully', {
      plan: {
        id: (plan._id as any).toString(),
        workspaceId: (plan.workspaceId as any).toString(),
        type: plan.type,
        plannedAmount: plan.plannedAmount,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt
      }
    })
  } catch (error) {
    console.error('GET /api/plans/[id] error:', error)
    return createErrorResponse('Failed to retrieve plan', 500)
  }
}

// PUT /api/plans/[id] - Update plan
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const planId = params.id
    const body = await request.json()

    // Validate plan ID format
    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return createErrorResponse('Invalid plan ID format', 400)
    }

    // Validate input
    const validation = updatePlanSchema.safeParse(body)
    if (!validation.success) {
      return createErrorResponse('Validation failed', 400, validation.error.flatten().fieldErrors)
    }

    // Connect to database
    await connectDB()

    // Find existing plan
    const existingPlan = await Plan.findById(planId)
    if (!existingPlan) {
      return createErrorResponse('Plan not found', 404)
    }

    // Verify workspace access
    const accessCheck = await verifyWorkspaceAccess(request, existingPlan.workspaceId.toString())
    if (!accessCheck.success) {
      return createErrorResponse(accessCheck.message, accessCheck.status)
    }

    const updateData = validation.data

    // If updating type, check for duplicates
    if (updateData.type && updateData.type.trim() !== existingPlan.type) {
      const duplicatePlan = await Plan.findOne({
        workspaceId: existingPlan.workspaceId,
        type: updateData.type.trim(),
        _id: { $ne: planId }
      })

      if (duplicatePlan) {
        return createErrorResponse(
          'A plan with this type already exists in this workspace',
          409
        )
      }
    }

    // Update plan
    const updatedPlan = await Plan.findByIdAndUpdate(
      planId,
      {
        ...(updateData.type && { type: updateData.type.trim() }),
        ...(updateData.plannedAmount !== undefined && { plannedAmount: updateData.plannedAmount })
      },
      { new: true, runValidators: true }
    )

    return createSuccessResponse('Plan updated successfully', {
      plan: {
        id: (updatedPlan!._id as any).toString(),
        workspaceId: (updatedPlan!.workspaceId as any).toString(),
        type: updatedPlan!.type,
        plannedAmount: updatedPlan!.plannedAmount,
        createdAt: updatedPlan!.createdAt,
        updatedAt: updatedPlan!.updatedAt
      }
    })
  } catch (error) {
    console.error('PUT /api/plans/[id] error:', error)
    
    // Handle duplicate key error
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      return createErrorResponse('A plan with this type already exists in this workspace', 409)
    }
    
    return createErrorResponse('Failed to update plan', 500)
  }
}

// DELETE /api/plans/[id] - Hapus plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const planId = params.id

    // Validate plan ID format
    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return createErrorResponse('Invalid plan ID format', 400)
    }

    // Connect to database
    await connectDB()

    // Find existing plan
    const existingPlan = await Plan.findById(planId)
    if (!existingPlan) {
      return createErrorResponse('Plan not found', 404)
    }

    // Verify workspace access - only owner can delete plans
    const accessCheck = await verifyWorkspaceAccess(request, existingPlan.workspaceId.toString())
    if (!accessCheck.success) {
      return createErrorResponse(accessCheck.message, accessCheck.status)
    }

    // Optional: Only allow workspace owners to delete plans
    if (!accessCheck.data.isOwner) {
      return createErrorResponse('Only workspace owners can delete plans', 403)
    }

    // Delete plan
    await Plan.findByIdAndDelete(planId)

    return createSuccessResponse('Plan deleted successfully', {
      deletedPlan: {
        id: (existingPlan._id as any).toString(),
        type: existingPlan.type,
        plannedAmount: existingPlan.plannedAmount
      }
    })
  } catch (error) {
    console.error('DELETE /api/plans/[id] error:', error)
    return createErrorResponse('Failed to delete plan', 500)
  }
}
