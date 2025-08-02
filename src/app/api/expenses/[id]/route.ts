import { NextRequest } from 'next/server'
import connectDB from '@/lib/mongodb'
import Expense from '@/models/Expense'
import Plan from '@/models/Plan'
import { updateExpenseSchema } from '@/lib/validations/expense'
import { verifyWorkspaceAccess } from '@/lib/middleware/workspace-auth'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-response'
import mongoose from 'mongoose'

// GET /api/expenses/[id] - Ambil expense berdasarkan ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: expenseId } = await params

    // Validate expense ID format
    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      return createErrorResponse('Invalid expense ID format', 400)
    }

    // Connect to database
    await connectDB()

    // Find expense
    const expense = await Expense.findById(expenseId)
      .populate('createdBy', 'email name')
      .lean()
      
    if (!expense) {
      return createErrorResponse('Expense not found', 404)
    }

    // Verify workspace access
    const accessCheck = await verifyWorkspaceAccess(request, (expense.workspaceId as any).toString())
    if (!accessCheck.success) {
      return createErrorResponse(accessCheck.message, accessCheck.status)
    }

    return createSuccessResponse('Expense retrieved successfully', {
      expense: {
        id: (expense._id as any).toString(),
        workspaceId: (expense.workspaceId as any).toString(),
        planType: expense.planType,
        amount: expense.amount,
        note: expense.note,
        date: expense.date,
        createdBy: {
          id: (expense.createdBy as any)._id.toString(),
          email: (expense.createdBy as any).email,
          name: (expense.createdBy as any).name
        },
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt
      }
    })
  } catch (error) {
    console.error('GET /api/expenses/[id] error:', error)
    return createErrorResponse('Failed to retrieve expense', 500)
  }
}

// PUT /api/expenses/[id] - Update expense
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: expenseId } = await params
    const body = await request.json()

    // Validate expense ID format
    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      return createErrorResponse('Invalid expense ID format', 400)
    }

    // Validate input
    const validation = updateExpenseSchema.safeParse(body)
    if (!validation.success) {
      return createErrorResponse('Validation failed', 400, validation.error.flatten().fieldErrors)
    }

    // Connect to database
    await connectDB()

    // Find existing expense
    const existingExpense = await Expense.findById(expenseId)
    if (!existingExpense) {
      return createErrorResponse('Expense not found', 404)
    }

    // Verify workspace access
    const accessCheck = await verifyWorkspaceAccess(request, existingExpense.workspaceId.toString())
    if (!accessCheck.success) {
      return createErrorResponse(accessCheck.message, accessCheck.status)
    }

    const updateData = validation.data

    // Validate planType if being updated and not 'other'
    if (updateData.planType && updateData.planType !== 'other' && updateData.planType !== existingExpense.planType) {
      const existingPlan = await Plan.findOne({
        workspaceId: existingExpense.workspaceId,
        type: updateData.planType
      })

      if (!existingPlan) {
        return createErrorResponse(
          'Invalid plan type. Plan type must exist in the workspace or use "other"',
          400,
          { planType: ['Plan type does not exist in this workspace'] }
        )
      }
    }

    // Update expense
    const updatedExpense = await Expense.findByIdAndUpdate(
      expenseId,
      {
        ...(updateData.planType !== undefined && { planType: updateData.planType }),
        ...(updateData.amount !== undefined && { amount: updateData.amount }),
        ...(updateData.note !== undefined && { note: updateData.note }),
        ...(updateData.date !== undefined && { date: updateData.date })
      },
      { new: true, runValidators: true }
    )

    // Populate for response
    await updatedExpense!.populate('createdBy', 'email name')

    return createSuccessResponse('Expense updated successfully', {
      expense: {
        id: (updatedExpense!._id as any).toString(),
        workspaceId: (updatedExpense!.workspaceId as any).toString(),
        planType: updatedExpense!.planType,
        amount: updatedExpense!.amount,
        note: updatedExpense!.note,
        date: updatedExpense!.date,
        createdBy: {
          id: (updatedExpense!.createdBy as any)._id.toString(),
          email: (updatedExpense!.createdBy as any).email,
          name: (updatedExpense!.createdBy as any).name
        },
        createdAt: updatedExpense!.createdAt,
        updatedAt: updatedExpense!.updatedAt
      }
    })
  } catch (error) {
    console.error('PUT /api/expenses/[id] error:', error)
    return createErrorResponse('Failed to update expense', 500)
  }
}

// DELETE /api/expenses/[id] - Hapus expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: expenseId } = await params

    // Validate expense ID format
    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      return createErrorResponse('Invalid expense ID format', 400)
    }

    // Connect to database
    await connectDB()

    // Find existing expense
    const existingExpense = await Expense.findById(expenseId)
    if (!existingExpense) {
      return createErrorResponse('Expense not found', 404)
    }

    // Verify workspace access
    const accessCheck = await verifyWorkspaceAccess(request, existingExpense.workspaceId.toString())
    if (!accessCheck.success) {
      return createErrorResponse(accessCheck.message, accessCheck.status)
    }

    // Optional: Only allow expense creator or workspace owner to delete
    if (!accessCheck.data.isOwner && existingExpense.createdBy.toString() !== accessCheck.data.user.userId) {
      return createErrorResponse('Only the expense creator or workspace owner can delete this expense', 403)
    }

    // Delete expense
    await Expense.findByIdAndDelete(expenseId)

    return createSuccessResponse('Expense deleted successfully', {
      deletedExpense: {
        id: (existingExpense._id as any).toString(),
        planType: existingExpense.planType,
        amount: existingExpense.amount,
        date: existingExpense.date
      }
    })
  } catch (error) {
    console.error('DELETE /api/expenses/[id] error:', error)
    return createErrorResponse('Failed to delete expense', 500)
  }
}
