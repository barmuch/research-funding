'use client'

import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export default function PageHeader({ 
  title, 
  description, 
  actions,
  className = "bg-white rounded-lg shadow-md p-6 mb-6"
}: PageHeaderProps) {
  return (
    <div className={className}>
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="text-gray-600 mt-2">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex space-x-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
