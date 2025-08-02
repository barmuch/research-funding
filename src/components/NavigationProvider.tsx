'use client'

import React, { createContext, useContext, useCallback, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { prefetchWorkspaceData } from '@/hooks/useWorkspaceData'

interface NavigationContextType {
  isNavigating: boolean
  navigateInstantly: (href: string) => void
  prefetchRoute: (href: string, workspaceId?: string) => void
  currentPath: string
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isNavigating, setIsNavigating] = useState(false)

  // Aggressive prefetching on app load
  useEffect(() => {
    const commonRoutes = [
      '/workspaces',
      '/dashboard'
    ]

    // Prefetch common routes immediately
    commonRoutes.forEach(route => {
      router.prefetch(route)
    })
  }, [router])

  const navigateInstantly = useCallback((href: string) => {
    setIsNavigating(true)
    
    // Use replace to avoid back button issues during instant navigation
    if (pathname === href) {
      setIsNavigating(false)
      return
    }

    // Instant navigation - no waiting
    router.push(href)
    
    // Reset navigation state quickly
    setTimeout(() => setIsNavigating(false), 100)
  }, [router, pathname])

  const prefetchRoute = useCallback((href: string, workspaceId?: string) => {
    router.prefetch(href)
    if (workspaceId) {
      prefetchWorkspaceData(workspaceId)
    }
  }, [router])

  return (
    <NavigationContext.Provider value={{
      isNavigating,
      navigateInstantly,
      prefetchRoute,
      currentPath: pathname
    }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}

// Hook for workspace-specific navigation
export function useWorkspaceNavigation(workspaceId?: string) {
  const { navigateInstantly, prefetchRoute } = useNavigation()

  const navigateToWorkspaceTab = useCallback((tab: 'overview' | 'plans' | 'expenses') => {
    if (!workspaceId) return

    const routes = {
      overview: `/workspaces/${workspaceId}`,
      plans: `/workspaces/${workspaceId}/plans`,
      expenses: `/workspaces/${workspaceId}/expenses`
    }
    
    navigateInstantly(routes[tab])
  }, [workspaceId, navigateInstantly])

  const prefetchWorkspaceRoutes = useCallback(() => {
    if (!workspaceId) return

    const routes = [
      `/workspaces/${workspaceId}`,
      `/workspaces/${workspaceId}/plans`,
      `/workspaces/${workspaceId}/expenses`
    ]
    
    routes.forEach(route => {
      prefetchRoute(route, workspaceId)
    })
  }, [workspaceId, prefetchRoute])

  // Auto-prefetch on mount
  useEffect(() => {
    prefetchWorkspaceRoutes()
  }, [prefetchWorkspaceRoutes])

  return {
    navigateToWorkspaceTab,
    prefetchWorkspaceRoutes,
    navigateInstantly,
    prefetchRoute
  }
}
