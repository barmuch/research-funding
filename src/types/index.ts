// User related types
export interface User {
  userId: string
  email: string
  createdAt: Date
  updatedAt: Date
  workspaces: string[]
}

// Authentication related types
export interface AuthResponse {
  user: User
  token: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, string[]>
}

export interface ApiError {
  success: false
  message: string
  errors?: Record<string, string[]>
}

export interface ApiSuccess<T> {
  success: true
  message: string
  data: T
}

// Workspace related types
export interface Workspace {
  _id: string
  workspaceId: string
  name: string
  description: string
  ownerId: string
  owner: User | string
  members: (User | string)[]
  memberCount: number
  createdAt: Date
  updatedAt: Date
}

export interface WorkspaceMember {
  userId: string
  email: string
  role: 'owner' | 'member'
  joinedAt: Date
}

export interface CreateWorkspaceRequest {
  name: string
  description?: string
}

export interface UpdateWorkspaceRequest {
  name?: string
  description?: string
}

export interface AddMemberRequest {
  email: string
}

export interface RemoveMemberRequest {
  userId: string
}

// Plan/Budget related types
export interface Plan {
  id: string
  workspaceId: string
  type: string
  plannedAmount: number
  createdAt: Date
  updatedAt: Date
}

export interface CreatePlanRequest {
  workspaceId: string
  type: string
  plannedAmount: number
}

export interface UpdatePlanRequest {
  type?: string
  plannedAmount?: number
}

export interface PlanSummary {
  totalPlans: number
  totalPlannedAmount: number
  averageAmount: number
}

export interface PlansResponse {
  plans: Plan[]
  summary: PlanSummary
}

// Expense/Actual spending related types
export interface Expense {
  id: string
  workspaceId: string
  planType?: string
  amount: number
  note?: string
  date: Date
  createdBy: {
    id: string
    email: string
    name?: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface CreateExpenseRequest {
  workspaceId: string
  planType?: string
  amount: number
  note?: string
  date?: string | Date
}

export interface UpdateExpenseRequest {
  planType?: string
  amount?: number
  note?: string
  date?: string | Date
}

export interface ExpenseSummary {
  totalExpenses: number
  totalAmount: number
  byPlanType: {
    planType: string
    total: number
    count: number
  }[]
}

export interface ExpensesResponse {
  success: boolean
  message: string
  data: {
    expenses: Expense[]
    pagination: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }
    summary: ExpenseSummary
  }
}

export interface GetExpensesQuery {
  workspaceId: string
  planType?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

// JWT Token payload
export interface JWTPayload {
  userId: string
  email: string
  iat?: number
  exp?: number
}
