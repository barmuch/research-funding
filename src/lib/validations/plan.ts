import { z } from 'zod'

// Validation schema untuk membuat plan baru
export const createPlanSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  type: z.string()
    .min(1, 'Plan type is required')
    .max(100, 'Plan type must be less than 100 characters')
    .trim(),
  plannedAmount: z.number()
    .min(0, 'Planned amount must be positive')
    .finite('Planned amount must be a valid number')
})

// Validation schema untuk update plan
export const updatePlanSchema = z.object({
  type: z.string()
    .min(1, 'Plan type is required')
    .max(100, 'Plan type must be less than 100 characters')
    .trim()
    .optional(),
  plannedAmount: z.number()
    .min(0, 'Planned amount must be positive')
    .finite('Planned amount must be a valid number')
    .optional()
}).refine(data => 
  data.type !== undefined || data.plannedAmount !== undefined,
  { message: 'At least one field (type or plannedAmount) must be provided' }
)

// Validation schema untuk query parameters
export const getPlansByWorkspaceSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required')
})

// Type exports untuk TypeScript
export type CreatePlanInput = z.infer<typeof createPlanSchema>
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>
export type GetPlansByWorkspaceInput = z.infer<typeof getPlansByWorkspaceSchema>
