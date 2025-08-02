'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Expense, UpdateExpenseRequest } from '@/types'

interface EditExpensePageProps {
  params: { 
    workspaceId: string
    expenseId: string 
  }
}

export default function EditExpensePage({ params }: EditExpensePageProps) {
  const [expense, setExpense] = useState<Expense | null>(null)
  const [planTypes, setPlanTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState<UpdateExpenseRequest>({
    planType: '',
    amount: 0,
    note: '',
    date: ''
  })

  const router = useRouter()

  useEffect(() => {
    loadExpense()
    loadPlanTypes()
  }, [params.expenseId])

  const loadExpense = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`/api/expenses/${params.expenseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()

      if (data.success) {
        const expenseData = data.data.expense
        setExpense(expenseData)
        setFormData({
          planType: expenseData.planType,
          amount: expenseData.amount,
          note: expenseData.note || '',
          date: new Date(expenseData.date).toISOString().split('T')[0]
        })
      } else {
        setError('Failed to load expense')
      }
    } catch (error) {
      setError('Failed to load expense')
    } finally {
      setLoading(false)
    }
  }

  const loadPlanTypes = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/workspaces/${params.workspaceId}/plan-types`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()

      if (data.success) {
        setPlanTypes(data.data.planTypes)
      }
    } catch (error) {
      console.error('Failed to load plan types:', error)
    }
  }

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const requestData = {
        ...formData,
        date: new Date(formData.date!).toISOString()
      }

      const response = await fetch(`/api/expenses/${params.expenseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      })

      const data = await response.json()

      if (data.success) {
        router.push(`/workspaces/${params.workspaceId}/expenses`)
      } else {
        setError(data.message || 'Failed to update expense')
      }
    } catch (error) {
      setError('Failed to update expense')
    } finally {
      setIsUpdating(false)
    }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading expense...</p>
        </div>
      </div>
    )
  }

  if (!expense) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Expense not found</p>
          <Link 
            href={`/workspaces/${params.workspaceId}/expenses`}
            className="mt-4 inline-block bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
          >
            Back to Expenses
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl font-semibold text-gray-900">
                Research Fund Tracker
              </Link>
              <Link href="/workspaces" className="text-gray-600 hover:text-indigo-600">
                Workspaces
              </Link>
              <span className="text-gray-400">/</span>
              <Link href={`/workspaces/${params.workspaceId}`} className="text-gray-600 hover:text-indigo-600">
                Workspace
              </Link>
              <span className="text-gray-400">/</span>
              <Link href={`/workspaces/${params.workspaceId}/expenses`} className="text-gray-600 hover:text-indigo-600">
                Expenses
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-indigo-600 font-medium">Edit</span>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => {
                  localStorage.removeItem('token')
                  router.push('/auth/login')
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Edit Expense</h1>
            <p className="mt-1 text-sm text-gray-600">
              Update expense details
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Current Expense Info */}
          <div className="bg-gray-100 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Current Expense Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Category</p>
                <p className="text-sm text-gray-900">
                  {expense.planType === 'other' ? 'Other' : 
                   expense.planType ? expense.planType.charAt(0).toUpperCase() + expense.planType.slice(1) : 'Other'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Amount</p>
                <p className="text-sm text-gray-900">{formatCurrency(expense.amount)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Date</p>
                <p className="text-sm text-gray-900">{formatDate(expense.date.toString())}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Created By</p>
                <p className="text-sm text-gray-900">{expense.createdBy.email}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500">Note</p>
                <p className="text-sm text-gray-900">{expense.note || 'No note provided'}</p>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Update Expense</h3>
            </div>
            <div className="p-6">
              <form onSubmit={handleUpdateExpense} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (IDR)
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={formData.date?.toString().split('T')[0]}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Note (Optional)
                    </label>
                    <textarea
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      rows={4}
                      maxLength={500}
                      placeholder="Add any additional notes about this expense..."
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      {formData.note?.length || 0}/500 characters
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <Link
                    href={`/workspaces/${params.workspaceId}/expenses`}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isUpdating ? 'Updating...' : 'Update Expense'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Warning */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Important Note
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Changes to this expense will be reflected immediately in your workspace analytics 
                    and budget tracking. Make sure all information is accurate before saving.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
