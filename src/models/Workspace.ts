import mongoose, { Document, Schema } from 'mongoose'

export interface IWorkspace extends Document {
  _id: string
  name: string
  description: string
  owner: mongoose.Types.ObjectId // Change back to owner for consistency
  members: mongoose.Types.ObjectId[] // Simple array of user IDs
  createdAt: Date
  updatedAt: Date
}

const WorkspaceSchema = new Schema<IWorkspace>({
  name: {
    type: String,
    required: [true, 'Workspace name is required'],
    trim: true,
    minlength: [2, 'Workspace name must be at least 2 characters long'],
    maxlength: [100, 'Workspace name must be less than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description must be less than 500 characters'],
    default: ''
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Workspace owner is required']
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret: Record<string, unknown>) {
      ret.workspaceId = ret._id
      delete ret._id
      delete ret.__v
      return ret
    }
  }
})

// Index for better performance
WorkspaceSchema.index({ owner: 1 })
WorkspaceSchema.index({ members: 1 })
WorkspaceSchema.index({ name: 1, owner: 1 }, { unique: true }) // Prevent duplicate workspace names per owner

// Instance methods
WorkspaceSchema.methods.isMember = function(userId: string): boolean {
  return this.members.includes(userId) || this.owner.toString() === userId
}

WorkspaceSchema.methods.isOwner = function(userId: string): boolean {
  return this.owner.toString() === userId
}

WorkspaceSchema.methods.addMember = function(userId: string): void {
  if (!this.members.includes(userId) && this.owner.toString() !== userId) {
    this.members.push(userId)
  }
}

WorkspaceSchema.methods.removeMember = function(userId: string): void {
  this.members = this.members.filter((memberId: string) => memberId.toString() !== userId)
}

// Prevent model re-compilation during development
const Workspace = mongoose.models.Workspace || mongoose.model<IWorkspace>('Workspace', WorkspaceSchema)

export default Workspace
