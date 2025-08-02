'use client'

import { Toaster } from 'react-hot-toast'
import { TOAST_CONFIG } from '@/lib/toast'

export function ToastProvider() {
  return (
    <Toaster
      position={TOAST_CONFIG.position}
      toastOptions={{
        duration: TOAST_CONFIG.duration,
        style: TOAST_CONFIG.style,
      }}
      containerStyle={{
        top: 80, // Account for navbar height
      }}
    />
  )
}

export default ToastProvider
