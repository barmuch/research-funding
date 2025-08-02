'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface NavbarProps {
  breadcrumbs?: Array<{
    label: string
    href?: string
    active?: boolean
  }>
  showLogout?: boolean
  className?: string
}

export default function Navbar({ 
  breadcrumbs = [],
  showLogout = true,
  className = ""
}: NavbarProps) {
  const router = useRouter()

  // Aggressive prefetching for navbar links
  React.useEffect(() => {
    // Prefetch common routes
    router.prefetch('/workspaces')
    router.prefetch('/dashboard')
    
    // Prefetch breadcrumb routes
    breadcrumbs.forEach(item => {
      if (item.href && !item.active) {
        router.prefetch(item.href)
      }
    })
  }, [breadcrumbs, router])

  const handleNavigation = (e: React.MouseEvent, href: string) => {
    e.preventDefault()
    router.push(href)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/auth/login')
  }

  return (
    <nav className={`bg-white shadow ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link 
              href="/dashboard" 
              className="text-xl font-semibold text-gray-900"
              onClick={(e) => handleNavigation(e, '/dashboard')}
            >
              Research Fund Tracker
            </Link>
            
            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
              <div className="flex items-center space-x-2 text-sm">
                {breadcrumbs.map((crumb, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    {index > 0 && <span className="text-gray-400">/</span>}
                    {crumb.href && !crumb.active ? (
                      <Link 
                        href={crumb.href} 
                        className="text-gray-600 hover:text-indigo-600"
                        prefetch={true}
                        onClick={(e) => handleNavigation(e, crumb.href!)}
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className={crumb.active ? "text-indigo-600 font-medium" : "text-gray-600"}>
                        {crumb.label}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {showLogout && (
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
