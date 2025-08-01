'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@/types'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        setUser(data.data.user)
      } else {
        localStorage.removeItem('token')
        router.push('/auth/login')
      }
    } catch (error) {
      setError('Failed to verify authentication')
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
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Research Fund Tracker
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
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
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Dashboard
              </h2>
              
              {/* User Information Card */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-2">
                  User Information
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>User ID:</strong> {user?.userId}</p>
                  <p><strong>Email:</strong> {user?.email}</p>
                  <p><strong>Account Created:</strong> {new Date(user?.createdAt || '').toLocaleDateString()}</p>
                  <p><strong>Workspaces:</strong> {user?.workspaces.length || 0}</p>
                </div>
              </div>

              {/* Welcome Message */}
              <div className="text-center py-8">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Welcome to Research Fund Tracker! 🎉
                </h3>
                <p className="text-gray-600 mb-4">
                  Your authentication system is working perfectly. You can now build amazing features for tracking research funds.
                </p>
                
                {/* Feature Coming Soon Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900">Workspaces</h4>
                    <p className="text-sm text-blue-700 mt-1">Create and manage research projects</p>
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full mt-2 inline-block">
                      Coming Soon
                    </span>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900">Fund Tracking</h4>
                    <p className="text-sm text-green-700 mt-1">Monitor your research funding</p>
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full mt-2 inline-block">
                      Coming Soon
                    </span>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-900">Collaboration</h4>
                    <p className="text-sm text-purple-700 mt-1">Work with your research team</p>
                    <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full mt-2 inline-block">
                      Coming Soon
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
