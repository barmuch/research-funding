'use client'

interface LoadingStateProps {
  message?: string
  className?: string
}

export default function LoadingState({ 
  message = "Loading...",
  className = "min-h-screen flex items-center justify-center"
}: LoadingStateProps) {
  return (
    <div className={className}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </div>
  )
}
