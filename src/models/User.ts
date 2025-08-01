import mongoose, { Document, Schema } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IUser extends Document {
  _id: string
  email: string
  password: string
  createdAt: Date
  updatedAt: Date
  workspaces: string[] // Array of workspace IDs that user owns or has access to
  comparePassword(candidatePassword: string): Promise<boolean>
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  workspaces: [{
    type: Schema.Types.ObjectId,
    ref: 'Workspace',
    default: []
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret: Record<string, unknown>) {
      ret.userId = ret._id
      delete ret._id
      delete ret.__v
      delete ret.password
      return ret
    }
  }
})

// Hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next()
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error: unknown) {
    next(error instanceof Error ? error : new Error('Unknown error'))
  }
})

// Instance method to check password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password)
  } catch (error) {
    throw new Error('Password comparison failed')
  }
}

// Prevent model re-compilation during development
const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

export default User
