import { z } from 'zod'

// User registration validation schema
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .max(100, 'Password must be less than 100 characters')
})

// User login validation schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required')
})

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>

// Validation helper function
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { 
  success: boolean
  data?: T
  errors?: Record<string, string[]>
} {
  try {
    const validatedData = schema.parse(data)
    return {
      success: true,
      data: validatedData
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {}
      error.issues.forEach((issue) => {
        const path = issue.path.join('.')
        if (!errors[path]) {
          errors[path] = []
        }
        errors[path].push(issue.message)
      })
      return {
        success: false,
        errors
      }
    }
    return {
      success: false,
      errors: { general: ['Validation failed'] }
    }
  }
}
