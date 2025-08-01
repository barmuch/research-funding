import { NextResponse } from 'next/server'

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, string[]>
}

/**
 * Create a success response
 */
export function createSuccessResponse<T>(
  message: string,
  data?: T,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    message,
    data
  }, { status })
}

/**
 * Create an error response
 */
export function createErrorResponse(
  message: string,
  status: number = 400,
  errors?: Record<string, string[]>
): NextResponse<ApiResponse> {
  return NextResponse.json({
    success: false,
    message,
    errors
  }, { status })
}

/**
 * Create validation error response
 */
export function createValidationErrorResponse(
  errors: Record<string, string[]>
): NextResponse<ApiResponse> {
  return createErrorResponse(
    'Validation failed',
    422,
    errors
  )
}

/**
 * Create unauthorized response
 */
export function createUnauthorizedResponse(
  message: string = 'Unauthorized'
): NextResponse<ApiResponse> {
  return createErrorResponse(message, 401)
}

/**
 * Create internal server error response
 */
export function createInternalErrorResponse(
  message: string = 'Internal server error'
): NextResponse<ApiResponse> {
  return createErrorResponse(message, 500)
}
