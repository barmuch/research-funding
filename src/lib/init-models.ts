// Initialize all Mongoose models
// This file ensures all models are registered before being used in API routes

import '@/models/User'
import '@/models/Workspace' 
import '@/models/Expense'
import '@/models/Plan'

export default function initializeModels() {
  // Models are automatically registered when imported
  // This function can be called in API routes to ensure all models are loaded
}
