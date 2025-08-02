# 🎯 Toast Notification System Implementation Guide

## 📦 **Library yang Digunakan**
- **react-hot-toast**: Lightweight (4KB), mudah digunakan, animasi smooth, API sederhana
- **Alternatif yang dipertimbangkan**: `sonner` (bagus tapi lebih berat), `react-toastify` (banyak config)

## 🏗️ **Struktur Implementasi**

### **1. Core Toast Utilities (`/lib/toast.ts`)**
```typescript
import { appToast, crudToast } from '@/lib/toast'

// Basic toast functions
appToast.success("Berhasil!")
appToast.error("Gagal!")
appToast.loading("Memproses...")
appToast.info("Informasi")
appToast.warning("Peringatan")

// CRUD specific toasts
crudToast.createSuccess("workspace")     // "Workspace berhasil ditambahkan!"
crudToast.updateSuccess("plan")          // "Plan berhasil diupdate!"
crudToast.deleteError("expense", "message") // Custom error
crudToast.networkError()                 // "Koneksi bermasalah"
crudToast.unauthorized()                 // "Tidak memiliki akses"
```

### **2. Toast Provider (`/components/ToastProvider.tsx`)**
```typescript
// Sudah diintegrasikan di layout.tsx - siap pakai global
// Position: top-center, Duration: 4s, Custom styling
```

### **3. Confirmation System (`/hooks/useConfirmation.ts`)**
```typescript
import { useCrudOperations } from '@/hooks/useConfirmation'

const { showConfirmation, confirmationProps, createWithToast, updateWithToast, deleteWithToast } = useCrudOperations()

// Usage examples:
const result = await deleteWithToast(
  () => deleteAPI(id),
  'workspace'  // Entity name for toast message
)

const confirmed = await showConfirmation({
  title: 'Hapus Data',
  message: 'Yakin ingin menghapus?',
  confirmText: 'Ya, Hapus',
  confirmButtonStyle: 'danger'
})
```

### **4. Confirmation Dialog (`/components/ConfirmDialog.tsx`)**
```typescript
// Integrated with useCrudOperations hook
// Automatically handles loading states, styling, and UX
```

## 🎮 **Cara Penggunaan**

### **Basic Toast Usage**
```typescript
import { appToast } from '@/lib/toast'

// Simple notifications
appToast.success("Data berhasil disimpan!")
appToast.error("Gagal menghapus data")

// Promise-based toast (auto loading->success/error)
appToast.promise(
  fetch('/api/data'),
  {
    loading: 'Menyimpan...',
    success: 'Berhasil disimpan!',
    error: 'Gagal menyimpan'
  }
)
```

### **CRUD Operations with Toast & Confirmation**
```typescript
import { useCrudOperations } from '@/hooks/useConfirmation'

function MyComponent() {
  const { confirmationProps, createWithToast, updateWithToast, deleteWithToast } = useCrudOperations()

  const handleCreate = async () => {
    const result = await createWithToast(
      async () => {
        const response = await fetch('/api/plans', { /* ... */ })
        const data = await response.json()
        if (!data.success) throw new Error(data.message)
        return data
      },
      'rencana anggaran',
      { skipConfirmation: true } // Create biasanya skip confirmation
    )
    
    if (result) {
      // Success handling (toast sudah muncul otomatis)
      closeModal()
      refreshData()
    }
  }

  const handleDelete = async (id: string) => {
    const result = await deleteWithToast(
      () => fetch(`/api/plans/${id}`, { method: 'DELETE' }),
      'rencana anggaran'
    )
    
    if (result) {
      refreshData()
    }
  }

  return (
    <div>
      {/* Your component */}
      
      {/* Don't forget the confirmation dialog */}
      <ConfirmDialog {...confirmationProps} />
    </div>
  )
}
```

### **Manual Confirmation Dialog**
```typescript
const { showConfirmation } = useCrudOperations()

const handleCustomAction = async () => {
  const confirmed = await showConfirmation({
    title: 'Konfirmasi Custom',
    message: 'Apakah Anda yakin ingin melakukan aksi ini?',
    confirmText: 'Ya, Lanjutkan',
    cancelText: 'Batal',
    confirmButtonStyle: 'warning'
  })
  
  if (confirmed) {
    // User clicked confirm
    doSomething()
    appToast.success("Aksi berhasil!")
  }
}
```

## 🎨 **Styling & Configuration**

### **Toast Styling**
```typescript
// Di /lib/toast.ts - TOAST_CONFIG
{
  duration: 4000,           // 4 detik
  position: 'top-center',   // Posisi di tengah atas
  style: {
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '500',
    minWidth: '300px',
  }
}
```

### **Confirmation Dialog Styles**
- **Danger**: Red background (untuk delete)
- **Warning**: Yellow background (untuk archive/risky actions)
- **Primary**: Blue background (untuk save/normal actions)

## 🔧 **Integration Steps untuk Halaman Baru**

### **1. Import Dependencies**
```typescript
import { useCrudOperations } from '@/hooks/useConfirmation'
import ConfirmDialog from '@/components/ConfirmDialog'
import { appToast, crudToast } from '@/lib/toast'
```

### **2. Setup Hook**
```typescript
const { confirmationProps, createWithToast, updateWithToast, deleteWithToast } = useCrudOperations()
```

### **3. Replace Manual Confirm & Alert**
```typescript
// ❌ Before
const handleDelete = async (id) => {
  if (!confirm('Sure?')) return
  try {
    await deleteAPI(id)
    alert('Success!')
  } catch (error) {
    alert('Error!')
  }
}

// ✅ After
const handleDelete = async (id) => {
  const result = await deleteWithToast(
    () => deleteAPI(id),
    'item'
  )
  
  if (result) {
    refreshData()
  }
}
```

### **4. Add Confirmation Dialog**
```typescript
return (
  <div>
    {/* Your component content */}
    
    {/* Add this at the end */}
    <ConfirmDialog {...confirmationProps} />
  </div>
)
```

## 🚀 **Advanced Features**

### **Custom Error Handling**
```typescript
const result = await createWithToast(
  async () => {
    const response = await fetch('/api/data', { /* ... */ })
    const data = await response.json()
    
    if (!data.success) {
      if (data.errors) {
        setFormErrors(data.errors) // Handle validation errors
        throw new Error('Validasi gagal')
      }
      throw new Error(data.message || 'Custom error')
    }
    
    return data
  },
  'data',
  { 
    successMessage: 'Custom success message',
    errorMessage: 'Custom error message'
  }
)
```

### **Loading Toast Management**
```typescript
// Manual loading toast
const loadingToast = appToast.loading('Menyimpan...')

try {
  await saveData()
  appToast.dismiss(loadingToast)
  appToast.success('Berhasil!')
} catch (error) {
  appToast.dismiss(loadingToast)
  appToast.error('Gagal!')
}

// Or use promise-based (recommended)
appToast.promise(
  saveData(),
  {
    loading: 'Menyimpan...',
    success: 'Berhasil!',
    error: 'Gagal!'
  }
)
```

## 📱 **Toast Types & Use Cases**

| Type | Use Case | Example |
|------|----------|---------|
| `success` | CRUD success, login success | "Data berhasil disimpan!" |
| `error` | CRUD errors, validation errors | "Gagal menghapus data" |
| `warning` | Risky actions, confirmations | "Data akan diarsipkan" |
| `info` | General information | "Data sedang disinkronisasi" |
| `loading` | Async operations in progress | "Menyimpan..." |

## ✅ **Benefits**

1. **Konsistensi**: Toast style & messaging seragam di seluruh app
2. **UX**: Confirmation dialog mencegah accidental delete
3. **DX**: Hook-based API mudah digunakan dan reusable
4. **Performance**: Library ringan (4KB), tidak mempengaruhi bundle size
5. **Accessibility**: Built-in keyboard navigation dan screen reader support
6. **Customizable**: Mudah disesuaikan style dan behavior

## 🎯 **Implementasi di Plans Page**

```typescript
// ✅ Sudah diimplementasikan:
- Toast untuk create/update/delete operations
- Confirmation dialog untuk delete action  
- Error handling dengan toast notifications
- Loading states dengan toast
- Network error handling
- Validation error handling
```

---

**Next Steps**: 
1. ✅ Implement di Plans page (DONE)
2. 🔄 Implement di Expenses page 
3. 🔄 Implement di Workspace page
4. 🔄 Implement di Auth pages

**Sistem Toast telah siap dan terintegrasi! Semua fitur CRUD sekarang memiliki notification yang konsisten dan user-friendly.** 🎉
