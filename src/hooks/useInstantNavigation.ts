'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect } from 'react'
import { prefetchWorkspaceData } from '@/hooks/useWorkspaceData'

interface UseInstantNavigationOptions {
  prefetchRoutes?: string[]
  workspaceId?: string
  enableAggressivePrefetch?: boolean
}

export function useInstantNavigation(options: UseInstantNavigationOptions = {}) {
  const router = useRouter()
  const { prefetchRoutes = [], workspaceId, enableAggressivePrefetch = true } = options

  // Aggressive prefetching on mount
  useEffect(() => {
    if (enableAggressivePrefetch) {
      // Prefetch common routes immediately
      const commonRoutes = [
        '/workspaces',
        '/dashboard',
        ...prefetchRoutes
      ]

      commonRoutes.forEach(route => {
        router.prefetch(route)
      })

      // Prefetch workspace data if workspaceId provided
      if (workspaceId) {
        prefetchWorkspaceData(workspaceId)
        
        // Prefetch workspace-specific routes
        const workspaceRoutes = [
          `/workspaces/${workspaceId}`,
          `/workspaces/${workspaceId}/plans`,
          `/workspaces/${workspaceId}/expenses`
        ]
        
        workspaceRoutes.forEach(route => {
          router.prefetch(route)
        })
      }
    }
  }, [router, prefetchRoutes, workspaceId, enableAggressivePrefetch])

  // Instant navigation function
  const navigateInstantly = useCallback((href: string, options?: { replace?: boolean }) => {
    if (options?.replace) {
      router.replace(href)
    } else {
      router.push(href)
    }
  }, [router])

  // Prefetch function for hover events
  const prefetchOnHover = useCallback((href: string, workspaceId?: string) => {
    router.prefetch(href)
    if (workspaceId) {
      prefetchWorkspaceData(workspaceId)
    }
  }, [router])

  return {
    navigateInstantly,
    prefetchOnHover,
    router
  }
}

// Hook specifically for workspace navigation
export function useWorkspaceNavigation(workspaceId: string) {
  const { navigateInstantly, prefetchOnHover } = useInstantNavigation({
    workspaceId,
    prefetchRoutes: [
      `/workspaces/${workspaceId}`,
      `/workspaces/${workspaceId}/plans`,
      `/workspaces/${workspaceId}/expenses`
    ]
  })

  const navigateToTab = useCallback((tab: 'overview' | 'plans' | 'expenses') => {
    const routes = {
      overview: `/workspaces/${workspaceId}`,
      plans: `/workspaces/${workspaceId}/plans`,
      expenses: `/workspaces/${workspaceId}/expenses`
    }
    
    navigateInstantly(routes[tab])
  }, [workspaceId, navigateInstantly])

  return {
    navigateToTab,
    navigateInstantly,
    prefetchOnHover
  }
}
