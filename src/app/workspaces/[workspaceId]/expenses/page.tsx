'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Expense, CreateExpenseRequest, ExpensesResponse, ExpenseSummary } from '@/types'
import DashboardLayout from '@/components/DashboardLayout'
import PageHeader from '@/components/PageHeader'
import TabNavigation, { TabItem } from '@/components/TabNavigation'
import SummaryCards, { SummaryCard } from '@/components/SummaryCards'
import ErrorState from '@/components/ErrorState'
import Modal from '@/components/Modal'
import FormField from '@/components/FormField'
import ConfirmDialog from '@/components/ConfirmDialog'
import { appToast, crudToast } from '@/lib/toast'
import { useCrudOperations, useConfirmation } from '@/hooks/useConfirmation'

interface ExpensesPageProps {
  params: Promise<{ workspaceId: string }>
}

export default async function ExpensesPage({ params }: ExpensesPageProps) {
  const { workspaceId } = await params
  
  return <ExpensesContent workspaceId={workspaceId} />
}

function ExpensesContent({ workspaceId }: { workspaceId: string }) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [summary, setSummary] = useState<ExpenseSummary | null>(null)
  const [planTypes, setPlanTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  
  // Filters
  const [selectedPlanType, setSelectedPlanType] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  
  // Form states
  const [formData, setFormData] = useState<CreateExpenseRequest>({
    workspaceId: workspaceId,
    planType: 'other',
    amount: 0,
    note: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({})

  // Toast hooks
  const { createWithToast, updateWithToast, deleteWithToast } = useCrudOperations()
  const { showConfirmation, confirmationProps } = useConfirmation()

  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [workspaceId, selectedPlanType, startDate, endDate])

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      // Build query parameters properly
      const expenseParams = new URLSearchParams({ workspaceId })
      if (selectedPlanType) expenseParams.append('planType', selectedPlanType)
      if (startDate) expenseParams.append('startDate', new Date(startDate).toISOString())
      if (endDate) expenseParams.append('endDate', new Date(endDate).toISOString())

      // Load workspace info, expenses, and plan types in parallel
      const [workspaceResponse, expensesResponse, planTypesResponse] = await Promise.all([
        fetch(`/api/workspaces/${workspaceId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/expenses?${expenseParams.toString()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/workspaces/${workspaceId}/plan-types`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      const workspaceData = await workspaceResponse.json()
      const expensesData: ExpensesResponse = await expensesResponse.json()
      const planTypesData = await planTypesResponse.json()

      if (workspaceData.success) {
        setWorkspaceName(workspaceData.data.workspace.name)
      }

      if (expensesData.success) {
        setExpenses(expensesData.data.expenses)
        setSummary(expensesData.data.summary)
      } else {
        if (expensesResponse.status === 401) {
          localStorage.removeItem('token')
          router.push('/auth/login')
        } else {
          setError('Failed to load expenses data')
        }
      }

      if (planTypesData.success) {
        setPlanTypes(planTypesData.data.planTypes)
      }
    } catch (error) {
      setError('Failed to load expenses data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = await createWithToast(
      async () => {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/expenses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...formData,
            date: new Date(formData.date!).toISOString()
          })
        })

        const data = await response.json()

        if (!data.success) {
          if (data.errors) {
            setFormErrors(data.errors)
          }
          throw new Error(data.message || 'Failed to create expense')
        }

        return data
      },
      'expense'
    )

    if (result) {
      setShowCreateModal(false)
      setFormData({
        workspaceId: workspaceId,
        planType: 'other',
        amount: 0,
        note: '',
        date: new Date().toISOString().split('T')[0]
      })
      loadData() // Reload data
    }
  }

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingExpense) return

    const result = await updateWithToast(
      async () => {
        const token = localStorage.getItem('token')
        const response = await fetch(`/api/expenses/${editingExpense.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            planType: formData.planType,
            amount: formData.amount,
            note: formData.note,
            date: new Date(formData.date!).toISOString()
          })
        })

        const data = await response.json()

        if (!data.success) {
          if (data.errors) {
            setFormErrors(data.errors)
          }
          throw new Error(data.message || 'Failed to update expense')
        }

        return data
      },
      'expense'
    )

    if (result) {
      setShowEditModal(false)
      setEditingExpense(null)
      setFormData({
        workspaceId: workspaceId,
        planType: 'other',
        amount: 0,
        note: '',
        date: new Date().toISOString().split('T')[0]
      })
      loadData() // Reload data
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    const result = await deleteWithToast(
      async () => {
        const token = localStorage.getItem('token')
        const response = await fetch(`/api/expenses/${expenseId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.message || 'Failed to delete expense')
        }

        return data
      },
      'expense'
    )

    if (result) {
      loadData() // Reload data after successful deletion
    }
  }

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense)
    setFormData({
      workspaceId: workspaceId,
      planType: expense.planType,
      amount: expense.amount,
      note: expense.note || '',
      date: new Date(expense.date).toISOString().split('T')[0]
    })
    setFormErrors({})
    setShowEditModal(true)
  }

  const openCreateModal = () => {
    setFormData({
      workspaceId: workspaceId,
      planType: 'other',
      amount: 0,
      note: '',
      date: new Date().toISOString().split('T')[0]
    })
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <DashboardLayout breadcrumbs={[
        { label: 'Workspaces', href: '/workspaces' },
        { label: 'Workspace', href: `/workspaces/${workspaceId}` },
        { label: 'Expenses', active: true }
      ]}>
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
      </DashboardLayout>
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
  const breadcrumbs = [
    { label: 'Workspaces', href: '/workspaces' },
    { label: workspaceName || 'Workspace', href: `/workspaces/${workspaceId}` },
    { label: 'Expenses', active: true }
  ]

  // Prepare tabs
  const tabs: TabItem[] = [
    { label: 'Members', href: `/workspaces/${workspaceId}` },
    { label: 'Overview', href: `/workspaces/${workspaceId}/overview` },
    { label: 'Expenses', active: true, isButton: true },
    { label: 'Budget Plans', href: `/workspaces/${workspaceId}/plans` }
  ]

  // Prepare summary cards
  const summaryCards: SummaryCard[] = summary ? [
    {
      title: 'Total Expenses',
      value: summary.totalExpenses,
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      iconBgColor: 'bg-red-500'
    },
    {
      title: 'Total Amount',
      value: formatCurrency(summary.totalAmount),
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      iconBgColor: 'bg-green-500'
    },
    {
      title: 'Average Amount',
      value: summary.totalExpenses > 0 ? formatCurrency(summary.totalAmount / summary.totalExpenses) : formatCurrency(0),
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      iconBgColor: 'bg-blue-500'
    }
  ] : []

  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      {/* Header */}
      <PageHeader
        title="Actual Expenses"
        description="Track and manage actual spending for this workspace"
        actions={
          <button
            onClick={openCreateModal}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Add Expense
          </button>
        }
      />

      {/* Navigation Tabs */}
      <TabNavigation tabs={tabs} />

      {/* Summary Cards */}
      {summary && <SummaryCards cards={summaryCards} />}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan Type
              </label>
              <select
                value={selectedPlanType}
                onChange={(e) => setSelectedPlanType(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Categories</option>
                {planTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === 'other' ? 'Other' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedPlanType('')
                  setStartDate('')
                  setEndDate('')
                }}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Expense Records</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Note
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created By
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(expense.date.toString())}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {expense.planType === 'other' ? 'Other' : 
                       expense.planType ? expense.planType.charAt(0).toUpperCase() + expense.planType.slice(1) : 'Other'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                    <div className="truncate" title={expense.note}>
                      {expense.note || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {expense.createdBy.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => openEditModal(expense)}
                        className="text-indigo-600 hover:text-indigo-900 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {expenses.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <p className="text-lg font-medium">No expenses found</p>
                <p className="text-sm">Start by adding your first expense record.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Expense Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Expense"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <FormField
            label="Category"
            error={formErrors.planType}
            required
          >
            <select
              value={formData.planType}
              onChange={(e) => setFormData({ ...formData, planType: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              {planTypes.map((type) => (
                <option key={type} value={type}>
                  {type === 'other' ? 'Other' : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Amount (IDR)"
            error={formErrors.amount}
            required
          >
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </FormField>

          <FormField
            label="Date"
            error={formErrors.date}
            required
          >
            <input
              type="date"
              value={formData.date?.toString().split('T')[0]}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </FormField>

          <FormField
            label="Note (Optional)"
            error={formErrors.note}
          >
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
              maxLength={500}
            />
          </FormField>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {formLoading ? 'Creating...' : 'Create Expense'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Expense Modal */}
      <Modal
        isOpen={showEditModal && !!editingExpense}
        onClose={() => {
          setShowEditModal(false)
          setEditingExpense(null)
        }}
        title="Edit Expense"
      >
        <form onSubmit={handleUpdateExpense} className="space-y-4">
          <FormField
            label="Category"
            error={formErrors.planType}
            required
          >
            <select
              value={formData.planType}
              onChange={(e) => setFormData({ ...formData, planType: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              {planTypes.map((type) => (
                <option key={type} value={type}>
                  {type === 'other' ? 'Other' : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Amount (IDR)"
            error={formErrors.amount}
            required
          >
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </FormField>

          <FormField
            label="Date"
            error={formErrors.date}
            required
          >
            <input
              type="date"
              value={formData.date?.toString().split('T')[0]}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </FormField>

          <FormField
            label="Note (Optional)"
            error={formErrors.note}
          >
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
              maxLength={500}
            />
          </FormField>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false)
                setEditingExpense(null)
              }}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {formLoading ? 'Updating...' : 'Update Expense'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog {...confirmationProps} />
    </DashboardLayout>
  )
}
