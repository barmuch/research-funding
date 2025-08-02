import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import PageHeader from '@/components/PageHeader'
import TabNavigation, { TabItem } from '@/components/TabNavigation'
import SummaryCards, { SummaryCard } from '@/components/SummaryCards'
import { getWorkspaceData, getWorkspaceSummary } from '@/lib/data-fetching'
import WorkspaceClientComponent from '@/app/workspaces/[workspaceId]/components/WorkspaceClientComponent'

interface PageProps {
  params: Promise<{ workspaceId: string }>
}

// Server Component with async data fetching
export default async function WorkspaceDetailPage({ params }: PageProps) {
  const { workspaceId } = await params
  
  // Get token from cookies (more secure for SSR)
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  
  if (!token) {
    redirect('/auth/login')
  }

  // Fetch data on server side with caching
  try {
    const [workspace, summary] = await Promise.all([
      getWorkspaceData(workspaceId, token),
      getWorkspaceSummary(workspaceId, token)
    ])

    // Prepare breadcrumbs
    const breadcrumbs = [
      { label: 'Workspaces', href: '/workspaces' },
      { label: workspace.name, active: true }
    ]

    // Prepare tabs with prefetch data
    const tabs: TabItem[] = [
      { label: 'Overview', active: true, isButton: true, workspaceId },
      { label: 'Budget Plans', href: `/workspaces/${workspaceId}/plans`, workspaceId },
      { label: 'Expenses', href: `/workspaces/${workspaceId}/expenses`, workspaceId }
    ]

    // Prepare summary cards
    const summaryCards: SummaryCard[] = [
      {
        title: 'Total Budget Plans',
        value: summary.totalPlans,
        icon: (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        ),
        iconBgColor: 'bg-indigo-500'
      },
      {
        title: 'Total Planned Amount',
        value: `Rp ${summary.totalPlannedAmount.toLocaleString('id-ID')}`,
        icon: (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        ),
        iconBgColor: 'bg-green-500'
      },
      {
        title: 'Total Expenses',
        value: `Rp ${summary.totalExpenses.toLocaleString('id-ID')}`,
        icon: (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
        iconBgColor: 'bg-red-500'
      }
    ]

    return (
      <DashboardLayout breadcrumbs={breadcrumbs}>
        {/* Header */}
        <PageHeader
          title={workspace.name}
          description={workspace.description || 'Manage your research funding workspace'}
          actions={
            <div className="flex space-x-3">
              <button className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors">
                Edit Workspace
              </button>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors">
                Invite Member
              </button>
            </div>
          }
        />

        {/* Navigation Tabs */}
        <TabNavigation tabs={tabs} />

        {/* Summary Cards */}
        <SummaryCards cards={summaryCards} />

        {/* Client-side interactive components wrapped in Suspense */}
        <Suspense fallback={
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        }>
          <WorkspaceClientComponent 
            workspaceId={workspaceId} 
            initialData={{ workspace, summary }}
          />
        </Suspense>
      </DashboardLayout>
    )
  } catch (error) {
    console.error('Error loading workspace:', error)
    
    // Error boundary with proper layout
    const breadcrumbs = [
      { label: 'Workspaces', href: '/workspaces' },
      { label: 'Error', active: true }
    ]
    
    return (
      <DashboardLayout breadcrumbs={breadcrumbs}>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load workspace</h2>
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
