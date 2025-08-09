'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Plan, PlansResponse } from '@/types'
import PageHeader from '@/components/PageHeader'
import SummaryCards, { SummaryCard } from '@/components/SummaryCards'
import ErrorState from '@/components/ErrorState'
import Modal from '@/components/Modal'
import FormField from '@/components/FormField'
import ConfirmDialog from '@/components/ConfirmDialog'
import { appToast, crudToast } from '@/lib/toast'
import { useCrudOperations } from '@/hooks/useConfirmation'

export default function WorkspacePlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [summary, setSummary] = useState({ totalPlans: 0, totalPlannedAmount: 0, averageAmount: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  
  // Form states
  const [formData, setFormData] = useState({ type: '', plannedAmount: 0 })
  const [formLoading, setFormLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({})
  
  // Toast and confirmation hooks
  const { showConfirmation, confirmationProps, createWithToast, updateWithToast, deleteWithToast } = useCrudOperations()
  
  const router = useRouter()
  const params = useParams()
  const workspaceId = params?.workspaceId as string

  useEffect(() => {
    if (workspaceId) {
      loadData()
    }
  }, [workspaceId])

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      // Load workspace info and plans in parallel
      const [workspaceResponse, plansResponse] = await Promise.all([
        fetch(`/api/workspaces/${workspaceId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/plans?workspaceId=${workspaceId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      const workspaceData = await workspaceResponse.json()
      const plansData: PlansResponse = await plansResponse.json()

      if (workspaceData.success) {
        setWorkspaceName(workspaceData.data.workspace.name)
      }

      if ((plansData as any).success) {
        setPlans((plansData as any).data.plans)
        setSummary((plansData as any).data.summary)
      } else {
        if (plansResponse.status === 401) {
          localStorage.removeItem('token')
          crudToast.unauthorized()
          router.push('/auth/login')
        } else {
          const errorMessage = 'Gagal memuat data rencana anggaran'
          setError(errorMessage)
          crudToast.loadError('rencana anggaran', errorMessage)
        }
      }
    } catch (error) {
      const errorMessage = 'Gagal memuat data rencana anggaran'
      setError(errorMessage)
      crudToast.networkError()
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormErrors({})

    const result = await createWithToast(
      async () => {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/plans', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            workspaceId,
            type: formData.type,
            plannedAmount: formData.plannedAmount
          })
        })

        const data = await response.json()

        if (!data.success) {
          if (data.errors) {
            setFormErrors(data.errors)
            throw new Error('Validasi gagal')
          }
          throw new Error(data.message || 'Gagal membuat rencana anggaran')
        }

        return data
      },
      'rencana anggaran',
      { skipConfirmation: true }
    )

    if (result) {
      setShowCreateModal(false)
      setFormData({ type: '', plannedAmount: 0 })
      loadData() // Reload data
    }

    setFormLoading(false)
  }

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPlan) return

    setFormLoading(true)
    setFormErrors({})

    const result = await updateWithToast(
      async () => {
        const token = localStorage.getItem('token')
        const response = await fetch(`/api/plans/${editingPlan.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            type: formData.type,
            plannedAmount: formData.plannedAmount
          })
        })

        const data = await response.json()

        if (!data.success) {
          if (data.errors) {
            setFormErrors(data.errors)
            throw new Error('Validasi gagal')
          }
          throw new Error(data.message || 'Gagal mengupdate rencana anggaran')
        }

        return data
      },
      'rencana anggaran'
    )

    if (result) {
      setShowEditModal(false)
      setEditingPlan(null)
      setFormData({ type: '', plannedAmount: 0 })
      loadData() // Reload data
    }

    setFormLoading(false)
  }

  const handleDeletePlan = async (planId: string) => {
    const result = await deleteWithToast(
      async () => {
        const token = localStorage.getItem('token')
        const response = await fetch(`/api/plans/${planId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.message || 'Gagal menghapus rencana anggaran')
        }

        return data
      },
      'rencana anggaran'
    )

    if (result) {
      loadData() // Reload data
    }
  }

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan)
    setFormData({ type: plan.type, plannedAmount: plan.plannedAmount })
    setFormErrors({})
    setShowEditModal(true)
  }

  const openCreateModal = () => {
    setFormData({ type: '', plannedAmount: 0 })
    setFormErrors({})
    setShowCreateModal(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-100 rounded w-1/3 animate-pulse"></div>
        <div className="h-10 bg-gray-100 rounded w-full animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow">
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-2 animate-pulse"></div>
              <div className="h-6 bg-gray-100 rounded w-3/4 animate-pulse"></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-6 bg-gray-100 rounded w-1/4 mb-4 animate-pulse"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-4">
                <div className="h-4 bg-gray-100 rounded flex-1 animate-pulse"></div>
                <div className="h-4 bg-gray-100 rounded w-24 animate-pulse"></div>
                <div className="h-4 bg-gray-100 rounded w-20 animate-pulse"></div>
                <div className="h-4 bg-gray-100 rounded w-16 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <ErrorState 
        message={error} 
        backLink={{ href: `/workspaces/${workspaceId}`, label: 'Back to Workspace' }}
      />
    )
  }

  // Prepare breadcrumbs
  // Prepare summary cards
  const summaryCards: SummaryCard[] = [
    {
      title: 'Total Plans',
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
      value: formatCurrency(summary.totalPlannedAmount),
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      iconBgColor: 'bg-green-500'
    },
    {
      title: 'Average Amount',
      value: formatCurrency(summary.averageAmount),
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      iconBgColor: 'bg-blue-500'
    }
  ]

  return (
    <>
      {/* Header Section */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget Planning</h1>
          <p className="mt-1 text-sm text-gray-500">Manage funding plans for {workspaceName}</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={openCreateModal}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Add New Plan
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards cards={summaryCards} />

      {/* Plans List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h2 className="text-lg font-medium text-gray-900">Budget Plans</h2>
              <p className="mt-1 text-sm text-gray-500">Manage your research funding plans</p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button
                onClick={openCreateModal}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Add New Plan
              </button>
            </div>
          </div>
          
          <div className="mt-6">
            {plans.length > 0 ? (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Start Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        End Date
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {plans.map((plan) => (
                      <tr key={plan.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{plan.type}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(plan.plannedAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Equipment
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(plan.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          -
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => openEditModal(plan)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePlan(plan.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No plans</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new budget plan.</p>
                <div className="mt-6">
                  <button
                    onClick={openCreateModal}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Add New Plan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Budget Plan</h2>
            
            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Category/Type
                </label>
                <input
                  type="text"
                  id="type"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  placeholder="e.g., Equipment, Research Materials"
                />
                {formErrors.type && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.type.join(', ')}</p>
                )}
              </div>

              <div>
                <label htmlFor="plannedAmount" className="block text-sm font-medium text-gray-700">
                  Planned Amount (IDR)
                </label>
                <input
                  type="number"
                  id="plannedAmount"
                  required
                  min="0"
                  step="1000"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.plannedAmount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, plannedAmount: Number(e.target.value) }))}
                  placeholder="0"
                />
                {formErrors.plannedAmount && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.plannedAmount.join(', ')}</p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setFormErrors({})
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {formLoading ? 'Creating...' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Plan Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Edit Budget Plan</h2>
            
            <form onSubmit={handleUpdatePlan} className="space-y-4">
              <div>
                <label htmlFor="editType" className="block text-sm font-medium text-gray-700">
                  Category/Type
                </label>
                <input
                  type="text"
                  id="editType"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                />
                {formErrors.type && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.type.join(', ')}</p>
                )}
              </div>

              <div>
                <label htmlFor="editPlannedAmount" className="block text-sm font-medium text-gray-700">
                  Planned Amount (IDR)
                </label>
                <input
                  type="number"
                  id="editPlannedAmount"
                  required
                  min="0"
                  step="1000"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.plannedAmount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, plannedAmount: Number(e.target.value) }))}
                />
                {formErrors.plannedAmount && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.plannedAmount.join(', ')}</p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingPlan(null)
                    setFormErrors({})
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {formLoading ? 'Updating...' : 'Update Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog {...confirmationProps} />
    </>
  )
}
