'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Expense, CreateExpenseRequest, ExpensesResponse, ExpenseSummary } from '@/types'
import SummaryCards, { SummaryCard } from '@/components/SummaryCards'
import ErrorState from '@/components/ErrorState'
import Modal from '@/components/Modal'
import FormField from '@/components/FormField'
import ConfirmDialog from '@/components/ConfirmDialog'
import VisionOCR from '@/components/VisionOCR'
import { appToast, crudToast } from '@/lib/toast'
import { useCrudOperations, useConfirmation } from '@/hooks/useConfirmation'

export default function WorkspaceExpensesPage() {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [summary, setSummary] = useState<ExpenseSummary | null>(null)
  const [planTypes, setPlanTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  const [extractedItems, setExtractedItems] = useState<any[]>([])

  // Filter states
  const [selectedPlanType, setSelectedPlanType] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showOCRModal, setShowOCRModal] = useState(false)
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
    if (workspaceId) {
      loadData()
    }
  }, [workspaceId, selectedPlanType, startDate, endDate])

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      // Build query parameters
      const expenseParams = new URLSearchParams({ workspaceId })
      if (selectedPlanType) expenseParams.append('planType', selectedPlanType)
      if (startDate) expenseParams.append('startDate', new Date(startDate).toISOString())
      if (endDate) expenseParams.append('endDate', new Date(endDate).toISOString())

      // Load data
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
          return
        }
        setError(expensesData.message || 'Failed to load expenses')
      }

      if (planTypesData.success) {
        setPlanTypes(planTypesData.data.planTypes)
      }

    } catch (error) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault()

    setFormLoading(true)
    setFormErrors({})

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
            throw new Error('Validation failed')
          }
          throw new Error(data.message || 'Failed to create expense')
        }

        return data
      },
      'expense',
      { skipConfirmation: true }
    )

    if (result) {
      setShowCreateModal(false)
      resetForm()
      loadData()
    }

    setFormLoading(false)
  }

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingExpense) return

    setFormLoading(true)
    setFormErrors({})

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
            throw new Error('Validation failed')
          }
          throw new Error(data.message || 'Failed to update expense')
        }

        return data
      },
      'expense',
      { skipConfirmation: true }
    )

    if (result) {
      setShowEditModal(false)
      setEditingExpense(null)
      resetForm()
      loadData()
    }

    setFormLoading(false)
  }

  const handleDeleteExpense = async (expenseId: string) => {
    const confirmed = await showConfirmation({
      title: 'Hapus Expense',
      message: 'Apakah Anda yakin ingin menghapus expense ini? Tindakan ini tidak dapat dibatalkan.',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      confirmButtonStyle: 'danger'
    })

    if (confirmed) {
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
        'expense',
        { skipConfirmation: true }
      )

      if (result) {
        loadData()
      }
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

  const resetForm = () => {
    setFormData({
      workspaceId: workspaceId,
      planType: 'other',
      amount: 0,
      note: '',
      date: new Date().toISOString().split('T')[0]
    })
    setFormErrors({})
    setFormLoading(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getSummaryCards = (): SummaryCard[] => {
    if (!summary) return []

    return [
      {
        title: 'Total Expenses',
        value: summary.totalExpenses.toString(),
        icon: '📊',
        iconBgColor: 'bg-blue-100'
      },
      {
        title: 'Total Amount',
        value: formatCurrency(summary.totalAmount),
        icon: '💰',
        iconBgColor: 'bg-green-100'
      },
      {
        title: 'Average',
        value: formatCurrency(summary.totalAmount / (summary.totalExpenses || 1)),
        icon: '📈',
        iconBgColor: 'bg-purple-100'
      }
    ]
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return <ErrorState message={error} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track and manage your workspace expenses
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          {/* OCR Scan Button */}
          <button
            onClick={() => setShowOCRModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center space-x-2"
          >
            <span>📷</span>
            <span>Scan Receipt</span>
          </button>
          {/* Add Expense Button */}
          <button
            onClick={() => openCreateModal()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Expense
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards cards={getSummaryCards()} />

      {/* OCR Extracted Items */}
      {extractedItems.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-blue-900">📷 Extracted from Receipt</h3>
            <button
              onClick={() => setExtractedItems([])}
              className="text-blue-700 hover:text-blue-900 text-sm font-medium"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {extractedItems.map((item, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900 text-sm">{item.item}</h4>
                  <span className="text-green-600 font-semibold text-sm">
                    Rp {Number(item.price).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={async () => {
                      // Fill form with this item's data
                      const itemData = {
                        workspaceId: workspaceId,
                        planType: item.planType || 'other',
                        amount: parseFloat(item.price.replace(/[^\d.-]/g, '')),
                        note: item.item,
                        date: new Date().toISOString().split('T')[0]
                      }
                      
                      // Save directly without opening modal
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
                              ...itemData,
                              date: new Date(itemData.date!).toISOString()
                            })
                          })

                          const data = await response.json()

                          if (!data.success) {
                            throw new Error(data.message || 'Failed to create expense')
                          }

                          return data
                        },
                        'expense'
                      )

                      if (result) {
                        // Remove item from extracted items
                        const updated = extractedItems.filter((_, i) => i !== index)
                        setExtractedItems(updated)
                        
                        // Reload expense data to show new item in table
                        loadData()
                      }
                    }}
                    className="flex-1 bg-indigo-600 text-white px-3 py-1 text-xs rounded hover:bg-indigo-700 transition-colors"
                  >
                    Add to Expenses
                  </button>
                  <button
                    onClick={() => {
                      const updated = extractedItems.filter((_, i) => i !== index)
                      setExtractedItems(updated)
                    }}
                    className="bg-red-600 text-white px-2 py-1 text-xs rounded hover:bg-red-700 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
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
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Expenses</h3>
          {expenses.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">💰</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
              <p className="text-gray-600 mb-6">
                {selectedPlanType || startDate || endDate 
                  ? 'No expenses match your current filters.' 
                  : 'Start by adding your first expense.'}
              </p>
              <button
                onClick={() => openCreateModal()}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                Add First Expense
              </button>
            </div>
          ) : (
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
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {expense.planType === 'other' ? 'Other' : 
                           expense.planType ? expense.planType.charAt(0).toUpperCase() + expense.planType.slice(1) : 'Other'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {expense.note || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {expense.createdBy.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(expense)}
                            className="text-indigo-600 hover:text-indigo-900 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          resetForm()
        }}
        title="Add New Expense"
      >
        <form
          onSubmit={handleCreateExpense}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </FormField>
          </div>

          <FormField
            label="Date"
            error={formErrors.date}
            required
          >
            <input
              type="date"
              value={formData.date?.toString()}
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
              placeholder="Add any additional notes..."
            />
            <p className="mt-1 text-sm text-gray-500">
              {formData.note?.length || 0}/500 characters
            </p>
          </FormField>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false)
                resetForm()
              }}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {formLoading ? 'Creating...' : 'Create Expense'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingExpense(null)
          resetForm()
        }}
        title="Edit Expense"
      >
        <form
          onSubmit={handleUpdateExpense}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <FormField
            label="Date"
            error={formErrors.date}
            required
          >
            <input
              type="date"
              value={formData.date?.toString()}
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
              placeholder="Add any additional notes..."
            />
            <p className="mt-1 text-sm text-gray-500">
              {formData.note?.length || 0}/500 characters
            </p>
          </FormField>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false)
                setEditingExpense(null)
                resetForm()
              }}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {formLoading ? 'Updating...' : 'Update Expense'}
            </button>
          </div>
        </form>
      </Modal>

      {/* OCR Modal */}
      <Modal
        isOpen={showOCRModal}
        onClose={() => setShowOCRModal(false)}
        title="📷 Scan Receipt"
      >
        <VisionOCR
          workspaceId={workspaceId}
          planTypes={planTypes}
          onExtractedItems={(items) => {
            // Close OCR modal and display extracted items on main page
            setShowOCRModal(false)
            setExtractedItems(items)
          }}
          onSuccessAddItem={() => {
            // Reload data after successful addition directly from OCR
            loadData()
            setShowOCRModal(false)
            resetForm()
          }}
        />
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmDialog {...confirmationProps} />
    </div>
  )
}
