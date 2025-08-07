import { NextRequest } from 'next/server'
import connectDB from '@/lib/mongodb'
import Plan, { IPlan } from '@/models/Plan'
import Expense, { IExpense } from '@/models/Expense'
import Workspace from '@/models/Workspace'
import { withAuth, UserInfo } from '@/lib/auth-middleware'
import { 
  createSuccessResponse, 
  createErrorResponse,
  createUnauthorizedResponse,
  createInternalErrorResponse 
} from '@/lib/api-response'

// Types for lean documents
type PlanLean = Pick<IPlan, 'type' | 'plannedAmount' | 'workspaceId' | 'createdAt' | 'updatedAt'>
type ExpenseLean = Pick<IExpense, 'planType' | 'amount' | 'workspaceId' | 'date' | 'createdAt' | 'updatedAt'>

// GET /api/analytics/[workspaceId] - Get financial analytics for workspace
async function getAnalyticsHandler(
  request: NextRequest, 
  userInfo: UserInfo,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    await connectDB()

    const { workspaceId } = await params

    // Check if user has access to workspace
    const workspace = await Workspace.findById(workspaceId)
    if (!workspace) {
      return createErrorResponse('Workspace not found', 404)
    }

    const isOwner = workspace.isOwner(userInfo.userId)
    const isMember = workspace.isMember(userInfo.userId)
    
    if (!isOwner && !isMember) {
      return createUnauthorizedResponse('You do not have access to this workspace')
    }

    // Get all plans and expenses for this workspace
    const [plansData, expensesData] = await Promise.all([
      Plan.find({ workspaceId }).lean(),
      Expense.find({ workspaceId }).lean()
    ])

    // Type the lean results properly
    const plans = plansData as PlanLean[]
    const expenses = expensesData as ExpenseLean[]

    // Calculate totals
    const totalPlannedAmount = plans.reduce((sum, plan) => sum + plan.plannedAmount, 0)
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const usagePercentage = totalPlannedAmount > 0 ? (totalExpenses / totalPlannedAmount) * 100 : 0

    // Group by planType for comparison
    const plansByType = plans.reduce((acc, plan) => {
      const planType = plan.type
      if (!acc[planType]) {
        acc[planType] = { planned: 0, spent: 0 }
      }
      acc[planType].planned += plan.plannedAmount
      return acc
    }, {} as Record<string, { planned: number; spent: number }>)

    // Add expenses to plansByType
    expenses.forEach(expense => {
      const expenseType = expense.planType || 'other'
      if (!plansByType[expenseType]) {
        plansByType[expenseType] = { planned: 0, spent: 0 }
      }
      plansByType[expenseType].spent += expense.amount
    })

    // Convert to array format for charts
    const categoryComparison = Object.entries(plansByType).map(([category, data]) => ({
      category,
      planned: data.planned,
      spent: data.spent,
      percentage: data.planned > 0 ? (data.spent / data.planned) * 100 : 0,
      status: data.spent > data.planned ? 'over' : data.spent === 0 ? 'unused' : 'normal'
    }))

    // Monthly trend (last 6 months)
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    
    const monthlyData = []
    for (let i = 0; i < 6; i++) {
      const month = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth() + i, 1)
      const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1)
      
      const monthlyExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date)
        return expenseDate >= month && expenseDate < nextMonth
      }).reduce((sum, expense) => sum + expense.amount, 0)

      monthlyData.push({
        month: month.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
        expenses: monthlyExpenses
      })
    }

    // Alerts and notifications
    const alerts = []
    
    // Check for overspending categories
    categoryComparison.forEach(item => {
      if (item.status === 'over') {
        alerts.push({
          type: 'warning',
          category: item.category,
          message: `Pengeluaran ${item.category} melebihi rencana sebesar ${((item.spent - item.planned) / 1000000).toFixed(1)}M`,
          amount: item.spent - item.planned
        })
      }
    })

    // Check for unused categories
    const unusedCategories = categoryComparison.filter(item => item.status === 'unused')
    if (unusedCategories.length > 0) {
      alerts.push({
        type: 'info',
        message: `${unusedCategories.length} kategori belum direalisasikan: ${unusedCategories.map(c => c.category).join(', ')}`
      })
    }

    // Check if total spending is getting close to budget
    if (usagePercentage > 80 && usagePercentage <= 100) {
      alerts.push({
        type: 'warning',
        message: `Penggunaan dana sudah mencapai ${usagePercentage.toFixed(1)}% dari total rencana`
      })
    } else if (usagePercentage > 100) {
      alerts.push({
        type: 'danger',
        message: `Pengeluaran melebihi rencana sebesar ${((totalExpenses - totalPlannedAmount) / 1000000).toFixed(1)}M`
      })
    }

    const analytics = {
      summary: {
        totalPlanned: totalPlannedAmount,
        totalSpent: totalExpenses,
        remaining: totalPlannedAmount - totalExpenses,
        usagePercentage: Math.min(usagePercentage, 100),
        overSpent: totalExpenses > totalPlannedAmount
      },
      categoryComparison,
      monthlyTrend: monthlyData,
      alerts,
      totals: {
        totalPlans: plans.length,
        totalExpenses: expenses.length,
        categoriesCount: Object.keys(plansByType).length
      }
    }

    return createSuccessResponse('Analytics data retrieved successfully', analytics)

  } catch (error) {
    console.error('Analytics error:', error)
    return createInternalErrorResponse('Failed to retrieve analytics data')
  }
}

// Export protected handler
export async function GET(request: NextRequest, context: { params: Promise<{ workspaceId: string }> }) {
  return withAuth((req, userInfo) => getAnalyticsHandler(req, userInfo, context))(request)
}
