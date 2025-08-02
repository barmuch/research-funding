'use client'

import React from 'react'
import Link from 'next/link'
import { useNavigation, useWorkspaceNavigation } from '@/components/NavigationProvider'

export interface TabItem {
  label: string
  href?: string
  active?: boolean
  isButton?: boolean
  onClick?: () => void
  workspaceId?: string // Add for prefetching
}

interface TabNavigationProps {
  tabs: TabItem[]
  className?: string
  containerClassName?: string
}

export default function TabNavigation({ 
  tabs, 
  className = "",
  containerClassName = "bg-white rounded-lg shadow-md mb-6"
}: TabNavigationProps) {
  const { navigateInstantly, prefetchRoute } = useNavigation()
  
  // Get workspace ID from first tab that has it
  const workspaceId = tabs.find(tab => tab.workspaceId)?.workspaceId
  const { navigateToWorkspaceTab, prefetchWorkspaceRoutes } = useWorkspaceNavigation(workspaceId)

  // Aggressive prefetching on component mount
  React.useEffect(() => {
    tabs.forEach(tab => {
      if (tab.href && tab.workspaceId) {
        // Prefetch route and data immediately
        prefetchRoute(tab.href, tab.workspaceId)
      }
    })
  }, [tabs, prefetchRoute])

  const handleTabClick = (e: React.MouseEvent, tab: TabItem) => {
    if (tab.href) {
      e.preventDefault()
      // Instant navigation without waiting
      navigateInstantly(tab.href)
    }
  }

  return (
    <div className={containerClassName}>
      <div className="border-b border-gray-200">
        <nav className={`-mb-px flex space-x-8 px-6 ${className}`} aria-label="Tabs">
          {tabs.map((tab, index) => {
            const baseClasses = "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer"
            const activeClasses = "border-indigo-500 text-indigo-600"
            const inactiveClasses = "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            
            const classes = `${baseClasses} ${tab.active ? activeClasses : inactiveClasses}`

            if (tab.isButton) {
              return (
                <button
                  key={index}
                  onClick={tab.onClick}
                  className={classes}
                >
                  {tab.label}
                </button>
              )
            }

            if (tab.href) {
              return (
                <Link
                  key={index}
                  href={tab.href}
                  className={classes}
                  prefetch={true}
                  onClick={(e) => handleTabClick(e, tab)}
                  onMouseEnter={() => {
                    // Additional prefetch on hover
                    if (tab.href && tab.workspaceId) {
                      prefetchRoute(tab.href, tab.workspaceId)
                    }
                  }}
                >
                  {tab.label}
                </Link>
              )
            }

            return (
              <span key={index} className={classes}>
                {tab.label}
              </span>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
