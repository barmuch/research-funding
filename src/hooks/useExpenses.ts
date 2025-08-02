'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Expense, 
  CreateExpenseRequest, 
  UpdateExpenseRequest, 
  ExpensesResponse, 
  ExpenseSummary 
} from '@/types'

interface UseExpensesOptions {
  workspaceId: string
  planType?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

interface UseExpensesResult {
  expenses: Expense[]
  summary: ExpenseSummary | null
  loading: boolean
  error: string | null
  hasMore: boolean
  total: number
  
  // Actions
  loadExpenses: () => Promise<void>
  createExpense: (data: CreateExpenseRequest) => Promise<boolean>
  updateExpense: (id: string, data: UpdateExpenseRequest) => Promise<boolean>
  deleteExpense: (id: string) => Promise<boolean>
  refreshExpenses: () => Promise<void>
}

export function useExpenses(options: UseExpensesOptions): UseExpensesResult {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [summary, setSummary] = useState<ExpenseSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  
  const router = useRouter()

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      throw new Error('No authentication token')
    }
    return { 'Authorization': `Bearer ${token}` }
  }, [router])

  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams({
        workspaceId: options.workspaceId,
        ...(options.planType && { planType: options.planType }),
        ...(options.startDate && { startDate: new Date(options.startDate).toISOString() }),
        ...(options.endDate && { endDate: new Date(options.endDate).toISOString() }),
        ...(options.limit && { limit: options.limit.toString() }),
        ...(options.offset && { offset: options.offset.toString() })
      })

      const response = await fetch(`/api/expenses?${searchParams}`, {
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ExpensesResponse = await response.json()

      if (data.success) {
        setExpenses(data.data.expenses)
        setSummary(data.data.summary)
        setHasMore(data.data.pagination.hasMore)
        setTotal(data.data.pagination.total)
      } else {
        throw new Error('Failed to load expenses')
      }
    } catch (error) {
      console.error('Load expenses error:', error)
      setError(error instanceof Error ? error.message : 'Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }, [options, getAuthHeaders])

  const createExpense = useCallback(async (data: CreateExpenseRequest): Promise<boolean> => {
    try {
      setError(null)

      const requestData = {
        ...data,
        date: data.date ? new Date(data.date).toISOString() : new Date().toISOString()
      }

      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(requestData)
      })

      const result = await response.json()

      if (result.success) {
        await loadExpenses() // Refresh the list
        return true
      } else {
        setError(result.message || 'Failed to create expense')
        return false
      }
    } catch (error) {
      console.error('Create expense error:', error)
      setError(error instanceof Error ? error.message : 'Failed to create expense')
      return false
    }
  }, [getAuthHeaders, loadExpenses])

  const updateExpense = useCallback(async (id: string, data: UpdateExpenseRequest): Promise<boolean> => {
    try {
      setError(null)

      const requestData = {
        ...data,
        ...(data.date && { date: new Date(data.date).toISOString() })
      }

      const response = await fetch(`/api/expenses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(requestData)
      })

      const result = await response.json()

      if (result.success) {
        await loadExpenses() // Refresh the list
        return true
      } else {
        setError(result.message || 'Failed to update expense')
        return false
      }
    } catch (error) {
      console.error('Update expense error:', error)
      setError(error instanceof Error ? error.message : 'Failed to update expense')
      return false
    }
  }, [getAuthHeaders, loadExpenses])

  const deleteExpense = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null)

      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      const result = await response.json()

      if (result.success) {
        await loadExpenses() // Refresh the list
        return true
      } else {
        setError(result.message || 'Failed to delete expense')
        return false
      }
    } catch (error) {
      console.error('Delete expense error:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete expense')
      return false
    }
  }, [getAuthHeaders, loadExpenses])

  const refreshExpenses = useCallback(async () => {
    await loadExpenses()
  }, [loadExpenses])

  // Load expenses when dependencies change
  useEffect(() => {
    loadExpenses()
  }, [loadExpenses])

  return {
    expenses,
    summary,
    loading,
    error,
    hasMore,
    total,
    loadExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    refreshExpenses
  }
}

// Hook for single expense
interface UseSingleExpenseResult {
  expense: Expense | null
  loading: boolean
  error: string | null
  loadExpense: () => Promise<void>
  updateExpense: (data: UpdateExpenseRequest) => Promise<boolean>
  deleteExpense: () => Promise<boolean>
}

export function useSingleExpense(expenseId: string): UseSingleExpenseResult {
  const [expense, setExpense] = useState<Expense | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      throw new Error('No authentication token')
    }
    return { 'Authorization': `Bearer ${token}` }
  }, [router])

  const loadExpense = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/expenses/${expenseId}`, {
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setExpense(data.data.expense)
      } else {
        throw new Error('Failed to load expense')
      }
    } catch (error) {
      console.error('Load expense error:', error)
      setError(error instanceof Error ? error.message : 'Failed to load expense')
    } finally {
      setLoading(false)
    }
  }, [expenseId, getAuthHeaders])

  const updateExpense = useCallback(async (data: UpdateExpenseRequest): Promise<boolean> => {
    try {
      setError(null)

      const requestData = {
        ...data,
        ...(data.date && { date: new Date(data.date).toISOString() })
      }

      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(requestData)
      })

      const result = await response.json()

      if (result.success) {
        setExpense(result.data.expense)
        return true
      } else {
        setError(result.message || 'Failed to update expense')
        return false
      }
    } catch (error) {
      console.error('Update expense error:', error)
      setError(error instanceof Error ? error.message : 'Failed to update expense')
      return false
    }
  }, [expenseId, getAuthHeaders])

  const deleteExpense = useCallback(async (): Promise<boolean> => {
    try {
      setError(null)

      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      const result = await response.json()

      if (result.success) {
        return true
      } else {
        setError(result.message || 'Failed to delete expense')
        return false
      }
    } catch (error) {
      console.error('Delete expense error:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete expense')
      return false
    }
  }, [expenseId, getAuthHeaders])

  useEffect(() => {
    if (expenseId) {
      loadExpense()
    }
  }, [expenseId, loadExpense])

  return {
    expense,
    loading,
    error,
    loadExpense,
    updateExpense,
    deleteExpense
  }
}
