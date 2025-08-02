'use client'

import { SWRConfig } from 'swr'
import { ReactNode } from 'react'

interface SWRProviderProps {
  children: ReactNode
}

const fetcher = async (url: string) => {
  const token = localStorage.getItem('token')
  
  const response = await fetch(url, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = new Error('Failed to fetch data')
    // Attach additional info to the error object
    ;(error as any).info = await response.text()
    ;(error as any).status = response.status
    throw error
  }

  return response.json()
}

export default function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 10000, // 10 seconds
        errorRetryCount: 3,
        errorRetryInterval: 2000,
        loadingTimeout: 15000,
        // Global cache configuration
        compare: (a, b) => {
          // Custom comparison for better cache optimization
          return JSON.stringify(a) === JSON.stringify(b)
        },
        // Error handling
        onError: (error, key) => {
          console.error(`SWR Error for ${key}:`, error)
          
          // Handle authentication errors
          if ((error as any).status === 401) {
            localStorage.removeItem('token')
            window.location.href = '/auth/login'
          }
        },
        // Success callback for debugging
        onSuccess: (data, key) => {
          // console.log(`SWR Success for ${key}:`, data)
        }
      }}
    >
      {children}
    </SWRConfig>
  )
}
