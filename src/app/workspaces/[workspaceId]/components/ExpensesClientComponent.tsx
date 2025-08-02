'use client'

import { useState } from 'react'
import { useWorkspaceExpenses } from '@/hooks/useWorkspaceData'
import Modal from '@/components/Modal'
import FormField from '@/components/FormField'

interface ExpensesClientComponentProps {
  workspaceId: string
  initialData: {
    expenses: any[]
    summary: any
    workspace: any
  }
}

export default function ExpensesClientComponent({ 
  workspaceId, 
  initialData 
}: ExpensesClientComponentProps) {
  // Use SWR with initial data
  const { expenses, mutate } = useWorkspaceExpenses(workspaceId)
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<any>(null)
  
  // Form states
  const [formData, setFormData] = useState({
    planType: 'Equipment',
    amount: '',
    note: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  // Filter states
  const [selectedPlanType, setSelectedPlanType] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/workspaces/${workspaceId}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          workspaceId,
          amount: Number(formData.amount)
        })
      })

      if (response.ok) {
        setFormData({
          planType: 'Equipment',
          amount: '',
          note: '',
          date: new Date().toISOString().split('T')[0]
        })
        setShowCreateModal(false)
        // Trigger SWR revalidation
        mutate()
      } else {
        const errorData = await response.json()
        setErrors(errorData.errors || { general: ['Failed to create expense'] })
      }
    } catch (error) {
      console.error('Create expense error:', error)
      setErrors({ general: ['Network error occurred'] })
    } finally {
      setLoading(false)
    }
  }

  const handleEditExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingExpense) return
    
    setLoading(true)
    setErrors({})
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/workspaces/${workspaceId}/expenses/${editingExpense.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          amount: Number(formData.amount)
        })
      })

      if (response.ok) {
        setShowEditModal(false)
        setEditingExpense(null)
        mutate()
      } else {
        const errorData = await response.json()
        setErrors(errorData.errors || { general: ['Failed to update expense'] })
      }
    } catch (error) {
      console.error('Edit expense error:', error)
      setErrors({ general: ['Network error occurred'] })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/workspaces/${workspaceId}/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        mutate()
      }
    } catch (error) {
      console.error('Delete expense error:', error)
    }
  }

  const openEditModal = (expense: any) => {
    setEditingExpense(expense)
    setFormData({
      planType: expense.planType,
      amount: expense.amount.toString(),
      note: expense.note || '',
      date: expense.date.split('T')[0]
    })
    setShowEditModal(true)
  }

  // Filter expenses
  const filteredExpenses = expenses.filter((expense: any) => {
    if (selectedPlanType && expense.planType !== selectedPlanType) return false
    if (startDate && expense.date < startDate) return false
    if (endDate && expense.date > endDate) return false
    return true
  })

  // Get unique plan types for filter
  const planTypes = [...new Set(expenses.map((expense: any) => expense.planType).filter(Boolean))] as string[]

  return (
    <>
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            label="Plan Type"
            type="select"
            value={selectedPlanType}
            onChange={(e) => setSelectedPlanType(e.target.value)}
            options={[
              { value: '', label: 'All Types' },
              ...planTypes.map((type: string) => ({ value: type, label: type }))
            ]}
          />
          <FormField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <FormField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h2 className="text-lg font-medium text-gray-900">Expenses</h2>
              <p className="mt-1 text-sm text-gray-500">
                {filteredExpenses.length} of {expenses.length} expenses
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                Add Expense
              </button>
            </div>
          </div>
          
          <div className="mt-6">
            {filteredExpenses.length > 0 ? (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Note
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredExpenses.map((expense: any) => (
                      <tr key={expense.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {expense.planType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(expense.amount)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {expense.note || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(expense.date).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => openEditModal(expense)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedPlanType || startDate || endDate ? 'Try adjusting your filters.' : 'Get started by creating your first expense.'}
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Add Expense
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <Modal
          title="Add New Expense"
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        >
          <form onSubmit={handleCreateExpense}>
            <div className="space-y-4">
              <FormField
                label="Plan Type"
                type="select"
                value={formData.planType}
                onChange={(e) => setFormData({ ...formData, planType: e.target.value })}
                required
                options={[
                  { value: 'Equipment', label: 'Equipment' },
                  { value: 'Personnel', label: 'Personnel' },
                  { value: 'Travel', label: 'Travel' },
                  { value: 'Materials', label: 'Materials' },
                  { value: 'Other', label: 'Other' }
                ]}
                error={errors.planType}
              />

              <FormField
                label="Amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="Enter amount"
                required
                min="0"
                step="1000"
                error={errors.amount}
              />

              <FormField
                label="Note"
                type="textarea"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Enter expense description (optional)"
                rows={3}
                error={errors.note}
              />

              <FormField
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                error={errors.date}
              />
            </div>

            {errors.general && (
              <div className="mt-4 text-sm text-red-600">
                {errors.general[0]}
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Expense'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && editingExpense && (
        <Modal
          title="Edit Expense"
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
        >
          <form onSubmit={handleEditExpense}>
            <div className="space-y-4">
              <FormField
                label="Plan Type"
                type="select"
                value={formData.planType}
                onChange={(e) => setFormData({ ...formData, planType: e.target.value })}
                required
                options={[
                  { value: 'Equipment', label: 'Equipment' },
                  { value: 'Personnel', label: 'Personnel' },
                  { value: 'Travel', label: 'Travel' },
                  { value: 'Materials', label: 'Materials' },
                  { value: 'Other', label: 'Other' }
                ]}
                error={errors.planType}
              />

              <FormField
                label="Amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                min="0"
                step="1000"
                error={errors.amount}
              />

              <FormField
                label="Note"
                type="textarea"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={3}
                error={errors.note}
              />

              <FormField
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                error={errors.date}
              />
            </div>

            {errors.general && (
              <div className="mt-4 text-sm text-red-600">
                {errors.general[0]}
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Expense'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
