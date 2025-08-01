'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Workspace } from '@/types'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    loadDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      // Load user data and workspaces in parallel
      const [userResponse, workspacesResponse] = await Promise.all([
        fetch('/api/auth/verify', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/workspaces', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      const userData = await userResponse.json()
      const workspacesData = await workspacesResponse.json()

      if (userData.success) {
        setUser(userData.data.user)
      } else {
        localStorage.removeItem('token')
        router.push('/auth/login')
        return
      }

      if (workspacesData.success) {
        setWorkspaces(workspacesData.data.workspaces)
      }
    } catch (error) {
      setError('Failed to load dashboard data')
      localStorage.removeItem('token')
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
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
              <h1 className="text-xl font-semibold text-gray-900">
                Research Fund Tracker
              </h1>
              <Link 
                href="/workspaces" 
                className="text-gray-600 hover:text-indigo-600 font-medium"
              >
                Workspaces
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.email}
              </span>
              <button
                onClick={handleLogout}
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
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Workspaces
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {workspaces.length}
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Owned Workspaces
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {workspaces.filter(w => w.ownerId === user?.userId).length}
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
                        Total Funds
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        $0.00
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <span className="text-gray-600">Coming soon</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Workspaces */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Recent Workspaces
                  </h3>
                  <Link 
                    href="/workspaces"
                    className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                  >
                    View all
                  </Link>
                </div>
                
                {workspaces.length === 0 ? (
                  <div className="text-center py-6">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No workspaces</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new workspace.</p>
                    <div className="mt-6">
                      <Link
                        href="/workspaces"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        Create workspace
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {workspaces.slice(0, 3).map((workspace) => (
                      <div key={workspace._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div className="flex-1">
                          <Link 
                            href={`/workspaces/${workspace._id}`}
                            className="text-sm font-medium text-gray-900 hover:text-indigo-600"
                          >
                            {workspace.name}
                          </Link>
                          <p className="text-xs text-gray-500 mt-1">
                            {workspace.description || 'No description'}
                          </p>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-400">
                            <span>{workspace.memberCount} members</span>
                            <span>Updated {new Date(workspace.updatedAt).toLocaleDateString()}</span>
                          </div>
                          
                        </div>
                        <div className="ml-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            workspace.ownerId === user?.userId 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {workspace.ownerId === user?.userId ? 'Owner' : 'Member'}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {workspaces.length > 3 && (
                      <div className="text-center pt-2">
                        <Link 
                          href="/workspaces"
                          className="text-sm text-indigo-600 hover:text-indigo-500"
                        >
                          View {workspaces.length - 3} more workspaces
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* User Profile Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Profile Information
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">User ID</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{user?.userId}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Member Since</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(user?.createdAt || '').toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Quick Actions</span>
                    </div>
                    <div className="mt-2 flex space-x-2">
                      <Link
                        href="/workspaces"
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Manage Workspaces
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Welcome Message for New Users */}
          {workspaces.length === 0 && (
            <div className="bg-white overflow-hidden shadow rounded-lg mt-8">
              <div className="px-4 py-5 sm:p-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Welcome to Research Fund Tracker! 🎉
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Get started by creating your first workspace to track research funding and collaborate with your team.
                  </p>
                  
                  {/* Getting Started Steps */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center mx-auto mb-2">
                        <span className="text-white font-bold text-sm">1</span>
                      </div>
                      <h4 className="font-medium text-indigo-900">Create Workspace</h4>
                      <p className="text-sm text-indigo-700 mt-1">Set up your first research project workspace</p>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center mx-auto mb-2">
                        <span className="text-white font-bold text-sm">2</span>
                      </div>
                      <h4 className="font-medium text-green-900">Invite Team</h4>
                      <p className="text-sm text-green-700 mt-1">Add collaborators to your workspace</p>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center mx-auto mb-2">
                        <span className="text-white font-bold text-sm">3</span>
                      </div>
                      <h4 className="font-medium text-purple-900">Track Funds</h4>
                      <p className="text-sm text-purple-700 mt-1">Monitor your research funding progress</p>
                      <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full mt-2 inline-block">
                        Coming Soon
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
