import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import PageHeader from '@/components/PageHeader'
import TabNavigation, { TabItem } from '@/components/TabNavigation'
import SummaryCards, { SummaryCard } from '@/components/SummaryCards'
import { getWorkspaceData, getWorkspaceExpenses, getWorkspaceSummary } from '@/lib/data-fetching'
import ExpensesClientComponent from '@/app/workspaces/[workspaceId]/components/ExpensesClientComponent'

interface PageProps {
  params: Promise<{ workspaceId: string }>
}

// Utility function to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

export default async function ExpensesPage({ params }: PageProps) {
  const { workspaceId } = await params
  
  // Get token from cookies
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  
  if (!token) {
    redirect('/auth/login')
  }

  try {
    // Fetch data on server side with caching
    const [workspace, expenses, summary] = await Promise.all([
      getWorkspaceData(workspaceId, token),
      getWorkspaceExpenses(workspaceId, token),
      getWorkspaceSummary(workspaceId, token)
    ])

    // Prepare breadcrumbs
    const breadcrumbs = [
      { label: 'Workspaces', href: '/workspaces' },
      { label: workspace.name, href: `/workspaces/${workspaceId}` },
      { label: 'Expenses', active: true }
    ]

    // Prepare tabs with prefetch
    const tabs: TabItem[] = [
      { label: 'Overview', href: `/workspaces/${workspaceId}`, workspaceId },
      { label: 'Budget Plans', href: `/workspaces/${workspaceId}/plans`, workspaceId },
      { label: 'Expenses', active: true, isButton: true, workspaceId }
    ]

    // Calculate expense-specific summary
    const expenseSummary = {
      totalExpenses: expenses.reduce((sum: number, expense: any) => sum + expense.amount, 0),
      totalItems: expenses.length,
      averageExpense: expenses.length > 0 ? expenses.reduce((sum: number, expense: any) => sum + expense.amount, 0) / expenses.length : 0,
      thisMonthExpenses: expenses.filter((expense: any) => {
        const expenseDate = new Date(expense.date)
        const now = new Date()
        return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear()
      }).reduce((sum: number, expense: any) => sum + expense.amount, 0)
    }

    // Prepare summary cards
    const summaryCards: SummaryCard[] = [
      {
        title: 'Total Expenses',
        value: formatCurrency(expenseSummary.totalExpenses),
        icon: (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
        iconBgColor: 'bg-red-500'
      },
      {
        title: 'Total Items',
        value: expenseSummary.totalItems,
        icon: (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        ),
        iconBgColor: 'bg-blue-500'
      },
      {
        title: 'This Month',
        value: formatCurrency(expenseSummary.thisMonthExpenses),
        icon: (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
        iconBgColor: 'bg-green-500'
      }
    ]

    return (
      <DashboardLayout breadcrumbs={breadcrumbs}>
        {/* Header */}
        <PageHeader
          title="Expense Management"
          description={`Track expenses for ${workspace.name}`}
          actions={
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors">
              Add New Expense
            </button>
          }
        />

        {/* Navigation Tabs */}
        <TabNavigation tabs={tabs} />

        {/* Summary Cards */}
        <SummaryCards cards={summaryCards} />

        {/* Client-side interactive components */}
        <Suspense fallback={
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex space-x-4">
                    <div className="h-4 bg-gray-200 rounded flex-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        }>
          <ExpensesClientComponent 
            workspaceId={workspaceId}
            initialData={{ 
              expenses, 
              summary: expenseSummary,
              workspace 
            }}
          />
        </Suspense>
      </DashboardLayout>
    )
  } catch (error) {
    console.error('Error loading expenses:', error)
    
    const breadcrumbs = [
      { label: 'Workspaces', href: '/workspaces' },
      { label: 'Workspace', href: `/workspaces/${workspaceId}` },
      { label: 'Expenses', active: true }
    ]
    
    return (
      <DashboardLayout breadcrumbs={breadcrumbs}>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load expenses</h2>
          <p className="text-gray-600 mb-4">Please check your connection and try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </DashboardLayout>
    )
  }
}
