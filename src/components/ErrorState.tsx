'use client'

import Link from 'next/link'

interface ErrorStateProps {
  message: string
  backLink?: {
    href: string
    label: string
  }
  className?: string
}

export default function ErrorState({ 
  message,
  backLink,
  className = "min-h-screen flex items-center justify-center"
}: ErrorStateProps) {
  return (
    <div className={className}>
      <div className="text-center">
        <p className="text-red-600 mb-4">{message}</p>
        {backLink && (
          <Link 
            href={backLink.href} 
            className="text-indigo-600 hover:text-indigo-500 inline-block"
          >
            {backLink.label}
          </Link>
        )}
      </div>
    </div>
  )
}
