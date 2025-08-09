'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import PageHeader from '@/components/PageHeader'
import ErrorState from '@/components/ErrorState'
import BudgetGauge from '@/components/charts/BudgetGauge'
import CategoryComparison from '@/components/charts/CategoryComparison'
import MonthlyTrend from '@/components/charts/MonthlyTrend'
import AlertsPanel from '@/components/charts/AlertsPanel'
import { appToast } from '@/lib/toast'

interface AnalyticsData {
  summary: {
    totalPlanned: number
    totalSpent: number
    remaining: number
    usagePercentage: number
    overSpent: boolean
  }
  categoryComparison: Array<{
    category: string
    planned: number
    spent: number
    percentage: number
    status: 'over' | 'unused' | 'normal'
  }>
  monthlyTrend: Array<{
    month: string
    expenses: number
  }>
  alerts: Array<{
    type: 'warning' | 'info' | 'danger'
    category?: string
    message: string
    amount?: number
  }>
  totals: {
    totalPlans: number
    totalExpenses: number
    categoriesCount: number
  }
}

export default function OverviewPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [workspaceName, setWorkspaceName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const router = useRouter()
  const params = useParams()
  const workspaceId = params?.workspaceId as string

  useEffect(() => {
    if (workspaceId) {
      loadAnalyticsData()
    }
  }, [workspaceId])

  const loadAnalyticsData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      // Load analytics and workspace data in parallel
      const [analyticsResponse, workspaceResponse] = await Promise.all([
        fetch(`/api/analytics/${workspaceId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/workspaces/${workspaceId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      const analyticsData = await analyticsResponse.json()
      const workspaceData = await workspaceResponse.json()

      if (analyticsData.success) {
        setAnalytics(analyticsData.data)
      } else {
        if (analyticsResponse.status === 401) {
          localStorage.removeItem('token')
          router.push('/auth/login')
        } else {
          setError('Failed to load analytics data')
          appToast.error('Gagal memuat data analytics')
        }
      }

      if (workspaceData.success) {
        setWorkspaceName(workspaceData.data.workspace.name)
      }

    } catch (error) {
      setError('Failed to load analytics data')
      appToast.error('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="h-8 bg-gray-100 rounded w-1/3 animate-pulse"></div>
        
        {/* Charts grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow">
              <div className="h-6 bg-gray-100 rounded w-1/2 mb-4 animate-pulse"></div>
              <div className="h-48 bg-gray-100 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <ErrorState 
        message={error || 'Analytics data not found'} 
        backLink={{ href: `/workspaces/${workspaceId}`, label: 'Back to Workspace' }}
      />
    )
  }

  return (
    <>
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Financial Overview</h1>
        <p className="mt-1 text-sm text-gray-500">Analisis keuangan untuk workspace {workspaceName}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {analytics.totals.totalPlans}
          </div>
          <div className="text-sm text-gray-600">Total Rencana</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-red-600">
            {analytics.totals.totalExpenses}
          </div>
          <div className="text-sm text-gray-600">Total Pengeluaran</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-green-600">
            {analytics.totals.categoriesCount}
          </div>
          <div className="text-sm text-gray-600">Kategori Aktif</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className={`text-2xl font-bold ${analytics.summary.usagePercentage > 100 ? 'text-red-600' : analytics.summary.usagePercentage > 80 ? 'text-yellow-600' : 'text-green-600'}`}>
            {analytics.summary.usagePercentage.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Penggunaan Dana</div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Budget Gauge */}
        <BudgetGauge 
          totalPlanned={analytics.summary.totalPlanned}
          totalSpent={analytics.summary.totalSpent}
        />

        {/* Alerts Panel */}
        <AlertsPanel alerts={analytics.alerts} />
      </div>

      {/* Category Comparison - Full Width */}
      <div className="mb-8">
        <CategoryComparison data={analytics.categoryComparison} />
      </div>

      {/* Monthly Trend */}
      <div className="mb-8">
        <MonthlyTrend data={analytics.monthlyTrend} />
      </div>

      {/* Summary Footer */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Ringkasan Analisis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-medium text-gray-700">Status Keuangan</div>
            <div className={analytics.summary.overSpent ? 'text-red-600' : 'text-green-600'}>
              {analytics.summary.overSpent ? 'Melebihi Budget' : 'Dalam Batas Budget'}
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-700">Kategori Bermasalah</div>
            <div className="text-gray-900">
              {analytics.categoryComparison.filter(c => c.status === 'over').length} dari {analytics.categoryComparison.length} kategori
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-700">Rekomendasi</div>
            <div className="text-gray-900">
              {analytics.summary.usagePercentage > 90 
                ? 'Perlu pengendalian ketat' 
                : analytics.summary.usagePercentage > 70 
                ? 'Monitor secara berkala' 
                : 'Penggunaan dana sehat'
              }
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
