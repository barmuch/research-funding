'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { prefetchWorkspaceData } from '@/hooks/useWorkspaceData'

export default function WorkspaceTemplate({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const workspaceId = params?.workspaceId as string

  useEffect(() => {
    // Prefetch workspace data when entering workspace routes
    if (workspaceId) {
      prefetchWorkspaceData(workspaceId)
    }
  }, [workspaceId])

  return <>{children}</>
}
