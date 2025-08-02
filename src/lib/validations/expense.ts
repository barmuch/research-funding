import { z } from 'zod'

// Schema untuk membuat expense baru
export const createExpenseSchema = z.object({
  workspaceId: z
    .string()
    .min(1, 'Workspace ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid workspace ID format'),
  planType: z
    .string()
    .trim()
    .min(1, 'Plan type cannot be empty')
    .max(100, 'Plan type must be less than 100 characters')
    .optional()
    .default('other'),
  amount: z
    .number()
    .positive('Amount must be greater than 0')
    .max(999999999, 'Amount cannot exceed 999,999,999')
    .refine((val) => Number.isFinite(val), 'Amount must be a valid number'),
  note: z
    .string()
    .trim()
    .max(500, 'Note cannot exceed 500 characters')
    .optional(),
  date: z
    .string()
    .datetime('Invalid date format')
    .or(z.date())
    .transform((val) => new Date(val))
    .optional()
    .default(() => new Date())
})

// Schema untuk update expense
export const updateExpenseSchema = z.object({
  planType: z
    .string()
    .trim()
    .min(1, 'Plan type cannot be empty')
    .max(100, 'Plan type must be less than 100 characters')
    .optional(),
  amount: z
    .number()
    .positive('Amount must be greater than 0')
    .max(999999999, 'Amount cannot exceed 999,999,999')
    .refine((val) => Number.isFinite(val), 'Amount must be a valid number')
    .optional(),
  note: z
    .string()
    .trim()
    .max(500, 'Note cannot exceed 500 characters')
    .optional(),
  date: z
    .string()
    .datetime('Invalid date format')
    .or(z.date())
    .transform((val) => new Date(val))
    .optional()
})

// Schema untuk query parameters
export const getExpensesByWorkspaceSchema = z.object({
  workspaceId: z
    .string()
    .min(1, 'Workspace ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid workspace ID format'),
  planType: z
    .string()
    .trim()
    .optional()
    .or(z.null())
    .transform(val => val === null || val === '' ? undefined : val),
  startDate: z
    .string()
    .optional()
    .or(z.null())
    .transform(val => {
      if (val === null || val === '' || val === undefined) return undefined
      try {
        return new Date(val)
      } catch {
        return undefined
      }
    }),
  endDate: z
    .string()
    .optional()
    .or(z.null())
    .transform(val => {
      if (val === null || val === '' || val === undefined) return undefined
      try {
        return new Date(val)
      } catch {
        return undefined
      }
    }),
  limit: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .optional()
    .transform((val) => {
      if (val === null || val === undefined || val === '') return 50
      const num = typeof val === 'string' ? parseInt(val, 10) : val
      return isNaN(num) ? 50 : Math.min(Math.max(num, 1), 100)
    }),
  offset: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .optional()
    .transform((val) => {
      if (val === null || val === undefined || val === '') return 0
      const num = typeof val === 'string' ? parseInt(val, 10) : val
      return isNaN(num) ? 0 : Math.max(num, 0)
    })
})

// Schema untuk validasi planType dengan workspace plans
export const validatePlanTypeSchema = z.object({
  planType: z.string().trim().min(1),
  workspaceId: z.string().regex(/^[0-9a-fA-F]{24}$/)
})

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>
export type GetExpensesQuery = z.infer<typeof getExpensesByWorkspaceSchema>
