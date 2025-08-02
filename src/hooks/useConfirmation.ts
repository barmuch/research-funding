'use client'

import { useState } from 'react'
import { appToast, crudToast } from '@/lib/toast'

interface ConfirmationOptions {
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  confirmButtonStyle?: 'danger' | 'primary' | 'warning'
}

interface UseConfirmationReturn {
  isOpen: boolean
  showConfirmation: (options: ConfirmationOptions) => Promise<boolean>
  confirmationProps: {
    isOpen: boolean
    title: string
    message: string
    confirmText: string
    cancelText: string
    confirmButtonStyle: 'danger' | 'primary' | 'warning'
    onConfirm: () => void
    onCancel: () => void
  }
}

export function useConfirmation(): UseConfirmationReturn {
  const [isOpen, setIsOpen] = useState(false)
  const [currentOptions, setCurrentOptions] = useState<ConfirmationOptions>({})
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null)

  const showConfirmation = (options: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setCurrentOptions({
        title: 'Konfirmasi',
        message: 'Apakah Anda yakin ingin melanjutkan?',
        confirmText: 'Ya',
        cancelText: 'Batal',
        confirmButtonStyle: 'primary',
        ...options,
      })
      setResolvePromise(() => resolve)
      setIsOpen(true)
    })
  }

  const handleConfirm = () => {
    setIsOpen(false)
    if (resolvePromise) {
      resolvePromise(true)
      setResolvePromise(null)
    }
  }

  const handleCancel = () => {
    setIsOpen(false)
    if (resolvePromise) {
      resolvePromise(false)
      setResolvePromise(null)
    }
  }

  const confirmationProps = {
    isOpen,
    title: currentOptions.title || 'Konfirmasi',
    message: currentOptions.message || 'Apakah Anda yakin ingin melanjutkan?',
    confirmText: currentOptions.confirmText || 'Ya',
    cancelText: currentOptions.cancelText || 'Batal',
    confirmButtonStyle: currentOptions.confirmButtonStyle || 'primary' as const,
    onConfirm: handleConfirm,
    onCancel: handleCancel,
  }

  return {
    isOpen,
    showConfirmation,
    confirmationProps,
  }
}

// Utility functions for common confirmation dialogs
export const confirmActions = {
  // Delete confirmation
  delete: async (
    showConfirmation: (options: ConfirmationOptions) => Promise<boolean>,
    entityName: string = 'item'
  ) => {
    return showConfirmation({
      title: 'Hapus Data',
      message: `Apakah Anda yakin ingin menghapus ${entityName} ini? Data yang dihapus tidak dapat dikembalikan.`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      confirmButtonStyle: 'danger',
    })
  },

  // Save confirmation
  save: async (
    showConfirmation: (options: ConfirmationOptions) => Promise<boolean>,
    message: string = 'Apakah Anda yakin ingin menyimpan perubahan?'
  ) => {
    return showConfirmation({
      title: 'Simpan Perubahan',
      message,
      confirmText: 'Ya, Simpan',
      cancelText: 'Batal',
      confirmButtonStyle: 'primary',
    })
  },

  // Leave confirmation (for unsaved changes)
  leave: async (
    showConfirmation: (options: ConfirmationOptions) => Promise<boolean>
  ) => {
    return showConfirmation({
      title: 'Keluar dari Halaman',
      message: 'Anda memiliki perubahan yang belum disimpan. Apakah Anda yakin ingin keluar?',
      confirmText: 'Ya, Keluar',
      cancelText: 'Tetap di Sini',
      confirmButtonStyle: 'warning',
    })
  },

  // Archive confirmation
  archive: async (
    showConfirmation: (options: ConfirmationOptions) => Promise<boolean>,
    entityName: string = 'item'
  ) => {
    return showConfirmation({
      title: 'Arsipkan Data',
      message: `Apakah Anda yakin ingin mengarsipkan ${entityName} ini?`,
      confirmText: 'Ya, Arsipkan',
      cancelText: 'Batal',
      confirmButtonStyle: 'warning',
    })
  },
}

// Enhanced CRUD operations with confirmation and toast
export const useCrudOperations = () => {
  const { showConfirmation, confirmationProps } = useConfirmation()

  const createWithToast = async <T>(
    operation: () => Promise<T>,
    entityName: string,
    options?: {
      successMessage?: string
      errorMessage?: string
      skipConfirmation?: boolean
    }
  ): Promise<T | null> => {
    try {
      const loadingToast = appToast.loading(`Menambah ${entityName}...`)
      
      const result = await operation()
      
      appToast.dismiss(loadingToast)
      crudToast.createSuccess(options?.successMessage || entityName)
      
      return result
    } catch (error: any) {
      crudToast.createError(entityName, options?.errorMessage || error?.message)
      return null
    }
  }

  const updateWithToast = async <T>(
    operation: () => Promise<T>,
    entityName: string,
    options?: {
      successMessage?: string
      errorMessage?: string
      skipConfirmation?: boolean
    }
  ): Promise<T | null> => {
    try {
      if (!options?.skipConfirmation) {
        const confirmed = await confirmActions.save(
          showConfirmation,
          `Apakah Anda yakin ingin mengupdate ${entityName}?`
        )
        if (!confirmed) return null
      }

      const loadingToast = appToast.loading(`Mengupdate ${entityName}...`)
      
      const result = await operation()
      
      appToast.dismiss(loadingToast)
      crudToast.updateSuccess(options?.successMessage || entityName)
      
      return result
    } catch (error: any) {
      crudToast.updateError(entityName, options?.errorMessage || error?.message)
      return null
    }
  }

  const deleteWithToast = async <T>(
    operation: () => Promise<T>,
    entityName: string,
    options?: {
      successMessage?: string
      errorMessage?: string
      skipConfirmation?: boolean
    }
  ): Promise<T | null> => {
    try {
      if (!options?.skipConfirmation) {
        const confirmed = await confirmActions.delete(showConfirmation, entityName)
        if (!confirmed) return null
      }

      const loadingToast = appToast.loading(`Menghapus ${entityName}...`)
      
      const result = await operation()
      
      appToast.dismiss(loadingToast)
      crudToast.deleteSuccess(options?.successMessage || entityName)
      
      return result
    } catch (error: any) {
      crudToast.deleteError(entityName, options?.errorMessage || error?.message)
      return null
    }
  }

  return {
    showConfirmation,
    confirmationProps,
    createWithToast,
    updateWithToast,
    deleteWithToast,
  }
}

export default useConfirmation
