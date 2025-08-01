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

// Workspace related types (for future use)
export interface Workspace {
  workspaceId: string
  name: string
  description?: string
  ownerId: string
  members: WorkspaceMember[]
  createdAt: Date
  updatedAt: Date
}

export interface WorkspaceMember {
  userId: string
  email: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  joinedAt: Date
}

// JWT Token payload
export interface JWTPayload {
  userId: string
  email: string
  iat?: number
  exp?: number
}
