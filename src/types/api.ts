// Type definitions for MongoDB documents and API responses
import { Types } from 'mongoose'

// MongoDB Object ID type
export type ObjectId = Types.ObjectId | string

// Base MongoDB document interface
export interface MongoDocument {
  _id: ObjectId
  createdAt: Date
  updatedAt: Date
}

// User populated in expenses
export interface PopulatedUser {
  _id: ObjectId
  email: string
  name?: string
}

// Expense document from MongoDB
export interface ExpenseDocument extends MongoDocument {
  workspaceId: ObjectId
  planType: string
  amount: number
  note?: string
  date: Date
  createdBy: ObjectId | PopulatedUser
}

// Plan document from MongoDB
export interface PlanDocument extends MongoDocument {
  workspaceId: ObjectId
  name: string
  budget: number
  createdBy: ObjectId | PopulatedUser
}

// Workspace document from MongoDB
export interface WorkspaceDocument extends MongoDocument {
  name: string
  description?: string
  ownerId: ObjectId
  members: ObjectId[]
}

// Filter types for database queries
export interface ExpenseFilter {
  workspaceId: ObjectId | string
  planType?: string
  date?: {
    $gte?: Date
    $lte?: Date
  }
}

export interface PlanFilter {
  workspaceId: ObjectId | string
  name?: string
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: string
}

// Query parameter types
export interface ExpenseQueryParams {
  workspaceId: string
  planType?: string
  startDate?: Date
  endDate?: Date
  limit: number
  offset: number
}

export interface PlanQueryParams {
  workspaceId: string
  limit: number
  offset: number
}

// OCR Types
export interface OCRResult {
  text: string
  confidence?: number
}
