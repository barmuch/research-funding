'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Workspace, WorkspaceMember } from '@/types'

export default function WorkspaceDetailPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [budgetSummary, setBudgetSummary] = useState({ totalPlans: 0, totalAmount: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isOwner, setIsOwner] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ userId: string; email: string } | null>(null)
  
  // Modals state
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  
  // Form states
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState('')
  
  const [editData, setEditData] = useState({ name: '', description: '' })
  const [editLoading, setEditLoading] = useState(false)
  const [editErrors, setEditErrors] = useState<Record<string, string[]>>({})
  
  const router = useRouter()
  const params = useParams()
  const workspaceId = params?.workspaceId as string

  useEffect(() => {
    if (workspaceId) {
      loadWorkspaceData()
    }
  }, [workspaceId])

  const loadWorkspaceData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      // Load workspace details
      const workspaceResponse = await fetch(`/api/workspaces/${workspaceId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      // Load members
      const membersResponse = await fetch(`/api/workspaces/${workspaceId}/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      // Load budget summary
      const budgetResponse = await fetch(`/api/plans?workspaceId=${workspaceId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      // Load current user info
      const userResponse = await fetch('/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const workspaceData = await workspaceResponse.json()
      const membersData = await membersResponse.json()
      const budgetData = await budgetResponse.json()
      const userData = await userResponse.json()

      if (workspaceData.success && membersData.success && userData.success) {
        setWorkspace(workspaceData.data.workspace)
        setMembers(membersData.data.members)
        setCurrentUser(userData.data.user)
        
        // Load budget summary if available
        if (budgetData.success) {
          setBudgetSummary({
            totalPlans: budgetData.data.summary.totalPlans,
            totalAmount: budgetData.data.summary.totalPlannedAmount
          })
        }
        
        // Check if current user is owner
        const ownerMember = membersData.data.members.find((m: WorkspaceMember) => m.role === 'owner')
        setIsOwner(ownerMember?.userId === userData.data.user.userId)
        
        // Set edit form data
        setEditData({
          name: workspaceData.data.workspace.name,
          description: workspaceData.data.workspace.description || ''
        })
      } else {
        if (workspaceResponse.status === 401 || userResponse.status === 401) {
          localStorage.removeItem('token')
          router.push('/auth/login')
        } else {
          setError('Failed to load workspace data')
        }
      }
    } catch (error) {
      setError('Failed to load workspace data')
    } finally {
      setLoading(false)
    }
  }

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteLoading(true)
    setInviteError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: inviteEmail })
      })

      const data = await response.json()

      if (data.success) {
        setShowInviteModal(false)
        setInviteEmail('')
        loadWorkspaceData() // Reload to get updated members list
      } else {
        setInviteError(data.message || 'Failed to invite member')
      }
    } catch (error) {
      setInviteError('Failed to invite member')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      })

      const data = await response.json()

      if (data.success) {
        loadWorkspaceData() // Reload to get updated members list
      } else {
        alert(data.message || 'Failed to remove member')
      }
    } catch (error) {
      alert('Failed to remove member')
    }
  }

  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditLoading(true)
    setEditErrors({})

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editData)
      })

      const data = await response.json()

      if (data.success) {
        setWorkspace(data.data.workspace)
        setShowEditModal(false)
      } else {
        setEditErrors(data.errors || {})
      }
    } catch (error) {
      setError('Failed to update workspace')
    } finally {
      setEditLoading(false)
    }
  }

  const handleDeleteWorkspace = async () => {
    if (!confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        router.push('/workspaces')
      } else {
        alert(data.message || 'Failed to delete workspace')
      }
    } catch (error) {
      alert('Failed to delete workspace')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading workspace...</p>
        </div>
      </div>
    )
  }

  if (error || !workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || 'Workspace not found'}</p>
          <Link href="/workspaces" className="text-indigo-600 hover:text-indigo-500 mt-4 inline-block">
            Back to Workspaces
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl font-semibold text-gray-900">
                Research Fund Tracker
              </Link>
              <Link href="/workspaces" className="text-gray-600 hover:text-indigo-600">
                Workspaces
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-indigo-600 font-medium">{workspace.name}</span>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => {
                  localStorage.removeItem('token')
                  router.push('/auth/login')
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Workspace Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{workspace.name}</h1>
                {workspace.description && (
                  <p className="text-gray-600 mt-2">{workspace.description}</p>
                )}
                <div className="flex items-center space-x-4 mt-4 text-sm text-gray-500">
                  <span>Created: {new Date(workspace.createdAt).toLocaleDateString()}</span>
                  <span>Members: {members.length}</span>
                  <span>
                    Your role: <span className="font-medium text-indigo-600">
                      {isOwner ? 'Owner' : 'Member'}
                    </span>
                  </span>
                </div>
              </div>
              
              {isOwner && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDeleteWorkspace}
                    className="bg-red-100 text-red-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                <button className="border-indigo-500 text-indigo-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                  Overview
                </button>
                <Link 
                  href={`/workspaces/${workspaceId}/plans`}
                  className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
                >
                  Budget Plans
                </Link>
              </nav>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Members
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {members.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Budget Plans
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {budgetSummary.totalPlans}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Budget
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(budgetSummary.totalAmount)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Members Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Members</h2>
              {isOwner && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                  Invite Member
                </button>
              )}
            </div>

            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <p className="font-medium text-gray-900">{member.email}</p>
                    <p className="text-sm text-gray-500">
                      {member.role === 'owner' ? 'Owner' : 'Member'} • Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {isOwner && member.role !== 'owner' && (
                    <button
                      onClick={() => handleRemoveMember(member.userId)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Future: Fund tracking will go here */}
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Fund Tracking</h2>
            <div className="text-center py-8 text-gray-500">
              <p>Fund tracking features coming soon...</p>
            </div>
          </div>
        </div>
      </main>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Invite Member</h2>
            
            <form onSubmit={handleInviteMember}>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                />
              </div>

              {inviteError && (
                <div className="mb-4 text-red-600 text-sm">{inviteError}</div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false)
                    setInviteEmail('')
                    setInviteError('')
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {inviteLoading ? 'Inviting...' : 'Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Workspace Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Edit Workspace</h2>
            
            <form onSubmit={handleUpdateWorkspace} className="space-y-4">
              <div>
                <label htmlFor="editName" className="block text-sm font-medium text-gray-700">
                  Workspace Name
                </label>
                <input
                  type="text"
                  id="editName"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={editData.name}
                  onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                />
                {editErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{editErrors.name.join(', ')}</p>
                )}
              </div>

              <div>
                <label htmlFor="editDescription" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="editDescription"
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={editData.description}
                  onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                />
                {editErrors.description && (
                  <p className="text-red-500 text-xs mt-1">{editErrors.description.join(', ')}</p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditErrors({})
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {editLoading ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
