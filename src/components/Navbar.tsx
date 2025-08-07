'use client'

import React, { useState } from 'react'
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
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
    setIsMenuOpen(false) // Close mobile menu on navigation
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/auth/login')
    setIsMenuOpen(false)
  }

  return (
    <nav className={`bg-white shadow ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link 
              href="/dashboard" 
              className="text-lg sm:text-xl font-semibold text-gray-900 truncate"
              onClick={(e) => handleNavigation(e, '/dashboard')}
            >
              <span className="hidden sm:inline">Research Fund Tracker</span>
              <span className="sm:hidden">RFT</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
              <div className="flex items-center space-x-2 text-sm">
                {breadcrumbs.map((crumb, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    {index > 0 && <span className="text-gray-400">/</span>}
                    {crumb.href && !crumb.active ? (
                      <Link 
                        href={crumb.href} 
                        className="text-gray-600 hover:text-indigo-600 transition-colors"
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
            
            {showLogout && (
              <button
                onClick={handleLogout}
                className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Logout
              </button>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Hamburger icon */}
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {/* Close icon */}
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile menu dropdown */}
        <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
            {/* Mobile breadcrumbs */}
            {breadcrumbs.length > 0 && (
              <div className="py-2">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Navigation</div>
                {breadcrumbs.map((crumb, index) => (
                  <div key={index} className="ml-4">
                    {crumb.href && !crumb.active ? (
                      <Link 
                        href={crumb.href} 
                        className="block px-3 py-2 text-base text-gray-600 hover:text-indigo-600 hover:bg-gray-50 rounded-md transition-colors"
                        prefetch={true}
                        onClick={(e) => handleNavigation(e, crumb.href!)}
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className={`block px-3 py-2 text-base rounded-md ${crumb.active ? "text-indigo-600 font-medium bg-indigo-50" : "text-gray-600"}`}>
                        {crumb.label}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {showLogout && (
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-base text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
