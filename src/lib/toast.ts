import toast, { Toast } from 'react-hot-toast'

// Toast configuration constants
export const TOAST_CONFIG = {
  duration: 4000,
  position: 'top-center' as const,
  style: {
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '500',
    minWidth: '300px',
  },
  success: {
    iconTheme: {
      primary: '#10B981',
      secondary: '#FFFFFF',
    },
  },
  error: {
    iconTheme: {
      primary: '#EF4444',
      secondary: '#FFFFFF',
    },
  },
  loading: {
    iconTheme: {
      primary: '#6366F1',
      secondary: '#FFFFFF',
    },
  },
}

// Custom toast utilities
export const appToast = {
  // Success notifications
  success: (message: string, options?: Partial<Toast>) => {
    return toast.success(message, {
      duration: TOAST_CONFIG.duration,
      style: TOAST_CONFIG.style,
      iconTheme: TOAST_CONFIG.success.iconTheme,
      ...options,
    })
  },

  // Error notifications
  error: (message: string, options?: Partial<Toast>) => {
    return toast.error(message, {
      duration: TOAST_CONFIG.duration + 1000, // Error messages stay longer
      style: TOAST_CONFIG.style,
      iconTheme: TOAST_CONFIG.error.iconTheme,
      ...options,
    })
  },

  // Loading notifications
  loading: (message: string = 'Loading...', options?: Partial<Toast>) => {
    return toast.loading(message, {
      style: TOAST_CONFIG.style,
      iconTheme: TOAST_CONFIG.loading.iconTheme,
      ...options,
    })
  },

  // Promise-based toast (automatically handles loading, success, error)
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    },
    options?: Partial<Toast>
  ) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      },
      {
        style: TOAST_CONFIG.style,
        success: {
          duration: TOAST_CONFIG.duration,
          iconTheme: TOAST_CONFIG.success.iconTheme,
        },
        error: {
          duration: TOAST_CONFIG.duration + 1000,
          iconTheme: TOAST_CONFIG.error.iconTheme,
        },
        loading: {
          iconTheme: TOAST_CONFIG.loading.iconTheme,
        },
        ...options,
      }
    )
  },

  // Info notifications
  info: (message: string, options?: Partial<Toast>) => {
    return toast(message, {
      duration: TOAST_CONFIG.duration,
      style: {
        ...TOAST_CONFIG.style,
        backgroundColor: '#3B82F6',
        color: '#FFFFFF',
      },
      icon: 'ℹ️',
      ...options,
    })
  },

  // Warning notifications
  warning: (message: string, options?: Partial<Toast>) => {
    return toast(message, {
      duration: TOAST_CONFIG.duration,
      style: {
        ...TOAST_CONFIG.style,
        backgroundColor: '#F59E0B',
        color: '#FFFFFF',
      },
      icon: '⚠️',
      ...options,
    })
  },

  // Dismiss specific toast
  dismiss: (toastId?: string) => {
    return toast.dismiss(toastId)
  },

  // Dismiss all toasts
  dismissAll: () => {
    return toast.dismiss()
  },

  // Remove specific toast
  remove: (toastId: string) => {
    return toast.remove(toastId)
  },
}

// CRUD operation specific toasts
export const crudToast = {
  // Create operations
  createSuccess: (entityName: string) => 
    appToast.success(`${entityName} berhasil ditambahkan!`),
  
  createError: (entityName: string, error?: string) => 
    appToast.error(error || `Gagal menambahkan ${entityName}`),

  // Update operations
  updateSuccess: (entityName: string) => 
    appToast.success(`${entityName} berhasil diupdate!`),
  
  updateError: (entityName: string, error?: string) => 
    appToast.error(error || `Gagal mengupdate ${entityName}`),

  // Delete operations
  deleteSuccess: (entityName: string) => 
    appToast.success(`${entityName} berhasil dihapus!`),
  
  deleteError: (entityName: string, error?: string) => 
    appToast.error(error || `Gagal menghapus ${entityName}`),

  // Load operations
  loadError: (entityName: string, error?: string) => 
    appToast.error(error || `Gagal memuat data ${entityName}`),

  // Save operations
  saveSuccess: () => 
    appToast.success('Perubahan berhasil disimpan!'),
  
  saveError: (error?: string) => 
    appToast.error(error || 'Gagal menyimpan perubahan'),

  // Authentication
  loginSuccess: () => 
    appToast.success('Login berhasil!'),
  
  loginError: (error?: string) => 
    appToast.error(error || 'Login gagal'),
  
  logoutSuccess: () => 
    appToast.success('Logout berhasil!'),

  // Authorization
  unauthorized: () => 
    appToast.error('Anda tidak memiliki akses untuk melakukan aksi ini'),

  // Network errors
  networkError: () => 
    appToast.error('Koneksi bermasalah. Silakan coba lagi.'),

  // Validation errors
  validationError: (message?: string) => 
    appToast.error(message || 'Data yang dimasukkan tidak valid'),
}

export { toast }
export default appToast
