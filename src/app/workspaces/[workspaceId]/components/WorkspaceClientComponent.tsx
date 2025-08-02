'use client'

import { useState } from 'react'
import { useWorkspace, useWorkspaceSummary } from '@/hooks/useWorkspaceData'
import Modal from '@/components/Modal'
import FormField from '@/components/FormField'

interface WorkspaceClientComponentProps {
  workspaceId: string
  initialData?: {
    workspace: any
    summary: any
  }
}

export default function WorkspaceClientComponent({ 
  workspaceId, 
  initialData 
}: WorkspaceClientComponentProps) {
  // Use SWR with initial data for client-side updates
  const { workspace } = useWorkspace(workspaceId)
  const { summary, expenses, plans } = useWorkspaceSummary(workspaceId)
  
  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  
  // Form states
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [editData, setEditData] = useState({ 
    name: workspace?.name || '', 
    description: workspace?.description || '' 
  })
  const [editLoading, setEditLoading] = useState(false)

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteLoading(true)
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/workspaces/${workspaceId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: inviteEmail })
      })

      if (response.ok) {
        setInviteEmail('')
        setShowInviteModal(false)
        // Show success message
      }
    } catch (error) {
      console.error('Invite error:', error)
    } finally {
      setInviteLoading(false)
    }
  }

  const handleEditWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditLoading(true)
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editData)
      })

      if (response.ok) {
        setShowEditModal(false)
        // Trigger revalidation
        window.location.reload()
      }
    } catch (error) {
      console.error('Edit error:', error)
    } finally {
      setEditLoading(false)
    }
  }

  return (
    <>
      {/* Workspace Members Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Workspace Members</h2>
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
          >
            Invite Member
          </button>
        </div>
        
        <div className="space-y-3">
          <div className="text-sm text-gray-500">
            Members management will be implemented here
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activities</h2>
        <div className="space-y-4">
          <div className="text-sm text-gray-500">
            Recent activities feed will be implemented here
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <Modal
          title="Invite Member"
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
        >
          <form onSubmit={handleInviteMember}>
            <FormField
              label="Email Address"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@university.edu"
              required
            />
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={inviteLoading}
                className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {inviteLoading ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <Modal
          title="Edit Workspace"
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
        >
          <form onSubmit={handleEditWorkspace}>
            <div className="space-y-4">
              <FormField
                label="Workspace Name"
                type="text"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                required
              />
              
              <FormField
                label="Description"
                type="textarea"
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                rows={3}
              />
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
