'use client'

import { ReactNode } from 'react'
import Navbar from '@/components/Navbar'

interface DashboardLayoutProps {
  children: ReactNode
  breadcrumbs?: Array<{
    label: string
    href?: string
    active?: boolean
  }>
  className?: string
}

export default function DashboardLayout({ 
  children, 
  breadcrumbs = [],
  className = "min-h-screen bg-gray-50"
}: DashboardLayoutProps) {
  return (
    <div className={className}>
      <Navbar breadcrumbs={breadcrumbs} />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {children}
        </div>
      </main>
    </div>
  )
}
