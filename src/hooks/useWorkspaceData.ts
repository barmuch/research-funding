'use client'

import useSWR from 'swr'
import { clientFetchers } from '@/lib/data-fetching'

// SWR configuration
const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 5000, // 5 seconds
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  loadingTimeout: 10000
}

// Custom hooks for workspace data
export function useWorkspace(workspaceId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    workspaceId ? `/api/workspaces/${workspaceId}` : null,
    clientFetchers.workspace,
    {
      ...swrConfig,
      revalidateIfStale: true
    }
  )

  return {
    workspace: data,
    isLoading,
    isError: error,
    mutate
  }
}

export function useWorkspaceExpenses(workspaceId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    workspaceId ? `/api/workspaces/${workspaceId}/expenses` : null,
    clientFetchers.expenses,
    {
      ...swrConfig,
      refreshInterval: 30000, // Auto refresh every 30 seconds for financial data
      revalidateIfStale: true
    }
  )

  return {
    expenses: data || [],
    isLoading,
    isError: error,
    mutate
  }
}

export function useWorkspacePlans(workspaceId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    workspaceId ? `/api/workspaces/${workspaceId}/plans` : null,
    clientFetchers.plans,
    {
      ...swrConfig,
      revalidateIfStale: true
    }
  )

  return {
    plans: data || [],
    isLoading,
    isError: error,
    mutate
  }
}

// Combined hook for dashboard summary
export function useWorkspaceSummary(workspaceId: string) {
  const { expenses, isLoading: expensesLoading } = useWorkspaceExpenses(workspaceId)
  const { plans, isLoading: plansLoading } = useWorkspacePlans(workspaceId)

  const isLoading = expensesLoading || plansLoading

  const summary = {
    totalExpenses: expenses.reduce((sum: number, expense: any) => sum + expense.amount, 0),
    totalPlannedAmount: plans.reduce((sum: number, plan: any) => sum + plan.plannedAmount, 0),
    totalPlans: plans.length,
    totalExpenseItems: expenses.length,
    averageExpense: expenses.length > 0 ? expenses.reduce((sum: number, expense: any) => sum + expense.amount, 0) / expenses.length : 0,
    averagePlan: plans.length > 0 ? plans.reduce((sum: number, plan: any) => sum + plan.plannedAmount, 0) / plans.length : 0
  }

  return {
    summary,
    isLoading,
    expenses,
    plans
  }
}

// Prefetch utilities
export function prefetchWorkspaceData(workspaceId: string) {
  // This can be called on route transitions to warm up the cache
  if (typeof window !== 'undefined') {
    fetch(`/api/workspaces/${workspaceId}`)
    fetch(`/api/workspaces/${workspaceId}/expenses`)
    fetch(`/api/workspaces/${workspaceId}/plans`)
  }
}
