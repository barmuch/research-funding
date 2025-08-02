import { unstable_cache } from 'next/cache'

// Cache configuration
const CACHE_TAGS = {
  workspace: (id: string) => `workspace-${id}`,
  expenses: (workspaceId: string) => `expenses-${workspaceId}`,
  plans: (workspaceId: string) => `plans-${workspaceId}`,
  summary: (workspaceId: string) => `summary-${workspaceId}`
}

// Base API fetch function with error handling
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004'
  
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

// Cached data fetchers for Server Components
export const getWorkspaceData = unstable_cache(
  async (workspaceId: string, token: string) => {
    return apiFetch(`/api/workspaces/${workspaceId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
  },
  ['workspace-data'],
  {
    tags: [CACHE_TAGS.workspace('dynamic')],
    revalidate: 300 // 5 minutes
  }
)

export const getWorkspaceExpenses = unstable_cache(
  async (workspaceId: string, token: string) => {
    return apiFetch(`/api/workspaces/${workspaceId}/expenses`, {
      headers: { Authorization: `Bearer ${token}` }
    })
  },
  ['workspace-expenses'],
  {
    tags: [CACHE_TAGS.expenses('dynamic')],
    revalidate: 60 // 1 minute - more frequent updates for financial data
  }
)

export const getWorkspacePlans = unstable_cache(
  async (workspaceId: string, token: string) => {
    return apiFetch(`/api/workspaces/${workspaceId}/plans`, {
      headers: { Authorization: `Bearer ${token}` }
    })
  },
  ['workspace-plans'],
  {
    tags: [CACHE_TAGS.plans('dynamic')],
    revalidate: 300 // 5 minutes
  }
)

export const getWorkspaceSummary = unstable_cache(
  async (workspaceId: string, token: string) => {
    // Fetch both expenses and plans for summary calculation
    const [expenses, plans] = await Promise.all([
      getWorkspaceExpenses(workspaceId, token),
      getWorkspacePlans(workspaceId, token)
    ])

    // Calculate summary data
    const totalExpenses = expenses.reduce((sum: number, expense: any) => sum + expense.amount, 0)
    const totalPlannedAmount = plans.reduce((sum: number, plan: any) => sum + plan.plannedAmount, 0)
    
    return {
      totalExpenses,
      totalPlannedAmount,
      totalPlans: plans.length,
      totalExpenseItems: expenses.length,
      averageExpense: expenses.length > 0 ? totalExpenses / expenses.length : 0,
      averagePlan: plans.length > 0 ? totalPlannedAmount / plans.length : 0
    }
  },
  ['workspace-summary'],
  {
    tags: [CACHE_TAGS.summary('dynamic')],
    revalidate: 300 // 5 minutes
  }
)

// Cache invalidation helpers
export const revalidateWorkspaceData = (workspaceId: string) => {
  // This would be used in API routes after mutations
  return [
    CACHE_TAGS.workspace(workspaceId),
    CACHE_TAGS.expenses(workspaceId),
    CACHE_TAGS.plans(workspaceId),
    CACHE_TAGS.summary(workspaceId)
  ]
}

// Client-side data fetching for SWR
export const clientFetchers = {
  workspace: (url: string) => fetch(url).then(res => res.json()),
  expenses: (url: string) => fetch(url).then(res => res.json()),
  plans: (url: string) => fetch(url).then(res => res.json())
}
