import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IPlan extends Document {
  workspaceId: mongoose.Types.ObjectId
  type: string
  plannedAmount: number
  createdAt: Date
  updatedAt: Date
}

// Interface untuk static methods
interface IPlanModel extends Model<IPlan> {
  getTotalPlannedAmount(workspaceId: string): Promise<number>
  getPlansByWorkspace(workspaceId: string): Promise<IPlan[]>
}

const planSchema = new Schema<IPlan>({
  workspaceId: {
    type: Schema.Types.ObjectId,
    ref: 'Workspace',
    required: [true, 'Workspace ID is required'],
    index: true
  },
  type: {
    type: String,
    required: [true, 'Plan type is required'],
    trim: true,
    maxlength: [100, 'Plan type must be less than 100 characters']
  },
  plannedAmount: {
    type: Number,
    required: [true, 'Planned amount is required'],
    min: [0, 'Planned amount must be positive'],
    validate: {
      validator: function(value: number) {
        return value >= 0 && Number.isFinite(value)
      },
      message: 'Planned amount must be a positive number'
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret: Record<string, unknown>) {
      ret.id = ret._id
      delete ret._id
      delete ret.__v
      return ret
    }
  }
})

// Create compound index for efficient queries
planSchema.index({ workspaceId: 1, type: 1 })

// Add instance method to format currency
planSchema.methods.getFormattedAmount = function() {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(this.plannedAmount)
}

// Static method to get total planned amount for a workspace
planSchema.statics.getTotalPlannedAmount = async function(workspaceId: string) {
  const result = await this.aggregate([
    { $match: { workspaceId: new mongoose.Types.ObjectId(workspaceId) } },
    { $group: { _id: null, total: { $sum: '$plannedAmount' } } }
  ])
  return result.length > 0 ? result[0].total : 0
}

// Static method to get plans grouped by type
planSchema.statics.getPlansByWorkspace = async function(workspaceId: string) {
  return this.find({ workspaceId: new mongoose.Types.ObjectId(workspaceId) })
    .sort({ type: 1, createdAt: -1 })
    .lean()
}

const Plan = (mongoose.models.Plan as IPlanModel) || mongoose.model<IPlan, IPlanModel>('Plan', planSchema)

export default Plan
