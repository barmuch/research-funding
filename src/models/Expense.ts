import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IExpense extends Document {
  _id: mongoose.Types.ObjectId
  workspaceId: mongoose.Types.ObjectId
  planType?: string
  amount: number
  note?: string
  date: Date
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export interface IExpenseModel extends Model<IExpense> {
  getExpensesByWorkspace(workspaceId: string): Promise<IExpense[]>
  getTotalExpenseAmount(workspaceId: string): Promise<number>
  getExpensesByPlanType(workspaceId: string, planType: string): Promise<IExpense[]>
  getTotalByPlanType(workspaceId: string): Promise<{ planType: string; total: number }[]>
}

const expenseSchema = new Schema<IExpense>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace ID is required'],
      index: true
    },
    planType: {
      type: String,
      trim: true,
      default: 'other',
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
      validate: {
        validator: (value: number) => value > 0,
        message: 'Amount must be a positive number'
      }
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, 'Note cannot exceed 500 characters']
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
      index: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user ID is required'],
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

// Indexes for better query performance
expenseSchema.index({ workspaceId: 1, date: -1 })
expenseSchema.index({ workspaceId: 1, planType: 1 })
expenseSchema.index({ workspaceId: 1, createdBy: 1 })

// Static methods
expenseSchema.statics.getExpensesByWorkspace = async function(workspaceId: string): Promise<IExpense[]> {
  return this.find({ workspaceId })
    .populate('createdBy', 'email name')
    .sort({ date: -1, createdAt: -1 })
    .lean()
}

expenseSchema.statics.getTotalExpenseAmount = async function(workspaceId: string): Promise<number> {
  const result = await this.aggregate([
    { $match: { workspaceId: new mongoose.Types.ObjectId(workspaceId) } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ])
  
  return result.length > 0 ? result[0].total : 0
}

expenseSchema.statics.getExpensesByPlanType = async function(
  workspaceId: string, 
  planType: string
): Promise<IExpense[]> {
  return this.find({ workspaceId, planType })
    .populate('createdBy', 'email name')
    .sort({ date: -1, createdAt: -1 })
    .lean()
}

expenseSchema.statics.getTotalByPlanType = async function(
  workspaceId: string
): Promise<{ planType: string; total: number }[]> {
  return this.aggregate([
    { $match: { workspaceId: new mongoose.Types.ObjectId(workspaceId) } },
    { 
      $group: { 
        _id: '$planType', 
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      } 
    },
    { 
      $project: { 
        planType: '$_id', 
        total: 1, 
        count: 1,
        _id: 0 
      } 
    },
    { $sort: { total: -1 } }
  ])
}

// Virtual for workspace relationship
expenseSchema.virtual('workspace', {
  ref: 'Workspace',
  localField: 'workspaceId',
  foreignField: '_id',
  justOne: true
})

// Virtual for creator relationship
expenseSchema.virtual('creator', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true
})

const Expense = (mongoose.models.Expense as IExpenseModel) || 
  mongoose.model<IExpense, IExpenseModel>('Expense', expenseSchema)

export default Expense
