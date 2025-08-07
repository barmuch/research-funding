import { NextRequest } from 'next/server'
import connectDB from '@/lib/mongodb'
import Expense from '@/models/Expense'
import Plan from '@/models/Plan'
import { createExpenseSchema, getExpensesByWorkspaceSchema } from '@/lib/validations/expense'
import { verifyWorkspaceAccess } from '@/lib/middleware/workspace-auth'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-response'
import { Types } from 'mongoose'
import type { 
  ExpenseFilter, 
  ExpenseDocument, 
  PopulatedUser,
  ObjectId 
} from '@/types/api'

// GET /api/expenses?workspaceId=... - Ambil semua expenses dari workspace tertentu
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    const planType = searchParams.get('planType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = searchParams.get('limit') || '50'
    const offset = searchParams.get('offset') || '0'

    console.log('GET /api/expenses - Query params received:', {
      workspaceId,
      planType,
      startDate,
      endDate,
      limit,
      offset
    })

    // Validate query parameters
    const validation = getExpensesByWorkspaceSchema.safeParse({ 
      workspaceId, 
      planType, 
      startDate, 
      endDate, 
      limit, 
      offset 
    })
    
    if (!validation.success) {
      console.log('GET /api/expenses - Validation failed:', validation.error.flatten())
      return createErrorResponse('Validation failed', 400, validation.error.flatten().fieldErrors)
    }

    const queryParams = validation.data

    // Verify workspace access
    const accessCheck = await verifyWorkspaceAccess(request, queryParams.workspaceId)
    if (!accessCheck.success) {
      return createErrorResponse(accessCheck.message, accessCheck.status)
    }

    // Connect to database
    await connectDB()

    // Build query filter
    const filter: ExpenseFilter = { workspaceId: queryParams.workspaceId }
    
    if (queryParams.planType) {
      filter.planType = queryParams.planType
    }
    
    if (queryParams.startDate || queryParams.endDate) {
      filter.date = {}
      if (queryParams.startDate) {
        filter.date.$gte = queryParams.startDate
      }
      if (queryParams.endDate) {
        filter.date.$lte = queryParams.endDate
      }
    }

    // Get expenses with pagination
    const expenses = await Expense.find(filter)
      .populate('createdBy', 'email name')
      .sort({ date: -1, createdAt: -1 })
      .limit(queryParams.limit)
      .skip(queryParams.offset)
      .lean()

    // Get total count for pagination
    const totalCount = await Expense.countDocuments(filter)
    
    // Get summary data
    const totalExpenseAmount = await Expense.getTotalExpenseAmount(queryParams.workspaceId)
    const expensesByPlanType = await Expense.getTotalByPlanType(queryParams.workspaceId)

    return createSuccessResponse('Expenses retrieved successfully', {
      expenses: expenses.map(expense => ({
        id: (expense._id as any).toString(),
        workspaceId: (expense.workspaceId as any).toString(),
        planType: expense.planType,
        amount: expense.amount,
        note: expense.note,
        date: expense.date,
        createdBy: {
          id: (expense.createdBy as any)?._id?.toString() || (expense.createdBy as any).toString(),
          email: (expense.createdBy as any)?.email,
          name: (expense.createdBy as any)?.name
        },
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt
      })),
      pagination: {
        total: totalCount,
        limit: queryParams.limit,
        offset: queryParams.offset,
        hasMore: (queryParams.offset + queryParams.limit) < totalCount
      },
      summary: {
        totalExpenses: totalCount,
        totalAmount: totalExpenseAmount,
        byPlanType: expensesByPlanType
      }
    })
  } catch (error) {
    console.error('GET /api/expenses error:', error)
    return createErrorResponse('Failed to retrieve expenses', 500)
  }
}

// POST /api/expenses - Tambah expense baru ke workspace
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = createExpenseSchema.safeParse(body)
    if (!validation.success) {
      return createErrorResponse('Validation failed', 400, validation.error.flatten().fieldErrors)
    }

    const { workspaceId, planType, amount, note, date } = validation.data

    // Verify workspace access
    const accessCheck = await verifyWorkspaceAccess(request, workspaceId)
    if (!accessCheck.success) {
      return createErrorResponse(accessCheck.message, accessCheck.status)
    }

    // Connect to database
    await connectDB()

    // Validate planType if provided and not 'other'
    if (planType && planType !== 'other') {
      const existingPlan = await Plan.findOne({ 
        workspaceId, 
        type: planType 
      })
      
      if (!existingPlan) {
        return createErrorResponse(
          'Invalid plan type. Plan type must exist in the workspace or use "other"', 
          400,
          { planType: ['Plan type does not exist in this workspace'] }
        )
      }
    }

    // Create new expense
    const newExpense = new Expense({
      workspaceId,
      planType: planType || 'other',
      amount,
      note,
      date,
      createdBy: accessCheck.data.user.userId
    })

    await newExpense.save()

    // Populate createdBy for response
    await newExpense.populate('createdBy', 'email name')

    return createSuccessResponse('Expense created successfully', {
      expense: {
        id: (newExpense._id as any).toString(),
        workspaceId: (newExpense.workspaceId as any).toString(),
        planType: newExpense.planType,
        amount: newExpense.amount,
        note: newExpense.note,
        date: newExpense.date,
        createdBy: {
          id: (newExpense.createdBy as any)._id.toString(),
          email: (newExpense.createdBy as any).email,
          name: (newExpense.createdBy as any).name
        },
        createdAt: newExpense.createdAt,
        updatedAt: newExpense.updatedAt
      }
    }, 201)
  } catch (error) {
    console.error('POST /api/expenses error:', error)
    return createErrorResponse('Failed to create expense', 500)
  }
}
