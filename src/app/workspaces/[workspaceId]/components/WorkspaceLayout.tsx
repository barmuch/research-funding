'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import PageHeader from '@/components/PageHeader'
import TabNavigation, { TabItem } from '@/components/TabNavigation'
import ErrorState from '@/components/ErrorState'

interface WorkspaceLayoutProps {
  children: React.ReactNode
  params: Promise<{ workspaceId: string }>
}

export default function WorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  const [workspaceId, setWorkspaceId] = useState<string>('')
  const [workspaceName, setWorkspaceName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const router = useRouter()
  const pathname = usePathname()

  // Resolve params
  useEffect(() => {
    params.then(({ workspaceId: id }) => {
      setWorkspaceId(id)
    })
  }, [params])

  // Load workspace data
  useEffect(() => {
    if (workspaceId) {
      loadWorkspaceInfo()
    }
  }, [workspaceId])

  const loadWorkspaceInfo = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()

      if (data.success) {
        setWorkspaceName(data.data.workspace.name)
      } else {
        if (response.status === 401) {
          localStorage.removeItem('token')
          router.push('/auth/login')
        } else {
          setError('Failed to load workspace')
        }
      }
    } catch (error) {
      setError('Failed to load workspace')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse">
          <div className="h-16 bg-white shadow"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-12 bg-gray-200 rounded w-full mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <ErrorState 
        message={error} 
        backLink={{ href: '/workspaces', label: 'Back to Workspaces' }}
      />
    )
  }

  // Determine current active tab based on pathname
  const getCurrentTab = () => {
    if (pathname.includes('/overview')) return 'overview'
    if (pathname.includes('/expenses')) return 'expenses'
    if (pathname.includes('/plans')) return 'plans'
    return 'members' // default for workspace root
  }

  // Prepare breadcrumbs
  const breadcrumbs = [
    { label: 'Workspaces', href: '/workspaces' },
    { label: workspaceName || 'Workspace', href: `/workspaces/${workspaceId}` }
  ]

  // Add current page to breadcrumbs
  const currentTab = getCurrentTab()
  if (currentTab !== 'members') {
    const tabLabels = {
      overview: 'Overview',
      expenses: 'Expenses', 
      plans: 'Budget Plans'
    }
    breadcrumbs.push({
      label: tabLabels[currentTab as keyof typeof tabLabels],
      href: pathname
    })
  }

  // Prepare tabs
  const tabs: TabItem[] = [
    { 
      label: 'Members', 
      href: `/workspaces/${workspaceId}`,
      active: currentTab === 'members'
    },
    { 
      label: 'Overview', 
      href: `/workspaces/${workspaceId}/overview`,
      active: currentTab === 'overview'
    },
    { 
      label: 'Expenses', 
      href: `/workspaces/${workspaceId}/expenses`,
      active: currentTab === 'expenses'
    },
    { 
      label: 'Budget Plans', 
      href: `/workspaces/${workspaceId}/plans`,
      active: currentTab === 'plans'
    }
  ]

  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      {/* Header - hanya tampil di halaman members (root workspace)
      {currentTab === 'members' && (
        <PageHeader
          title={workspaceName}
          description="Manage workspace members, view analytics, and track budget plans"
        />
      )} */}

      {/* Tab Navigation - selalu tampil dan konsisten */}
      <div className="mb-6">
        <TabNavigation tabs={tabs} />
      </div>

      {/* Content */}
      <div className="space-y-6">
        {children}
      </div>
    </DashboardLayout>
  )
}
