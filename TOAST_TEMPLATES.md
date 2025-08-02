# 🔥 Quick Implementation Guide untuk Halaman Lain

## 🎯 **Template untuk Expenses Page**

```typescript
// 1. Import dependencies
import { useCrudOperations } from '@/hooks/useConfirmation'
import ConfirmDialog from '@/components/ConfirmDialog'
import { appToast, crudToast } from '@/lib/toast'

export default function ExpensesPage() {
  // 2. Setup hook
  const { confirmationProps, createWithToast, updateWithToast, deleteWithToast } = useCrudOperations()

  // 3. Replace existing CRUD functions
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormErrors({})

    const result = await createWithToast(
      async () => {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/expenses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        })

        const data = await response.json()
        if (!data.success) {
          if (data.errors) {
            setFormErrors(data.errors)
            throw new Error('Validasi gagal')
          }
          throw new Error(data.message || 'Gagal membuat pengeluaran')
        }
        return data
      },
      'pengeluaran',
      { skipConfirmation: true }
    )

    if (result) {
      setShowCreateModal(false)
      resetForm()
      loadData()
    }
    setFormLoading(false)
  }

  const handleDeleteExpense = async (expenseId: string) => {
    const result = await deleteWithToast(
      async () => {
        const token = localStorage.getItem('token')
        const response = await fetch(`/api/expenses/${expenseId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })

        const data = await response.json()
        if (!data.success) {
          throw new Error(data.message || 'Gagal menghapus pengeluaran')
        }
        return data
      },
      'pengeluaran'
    )

    if (result) {
      loadData()
    }
  }

  // 4. Add in render
  return (
    <DashboardLayout>
      {/* Your existing content */}
      
      {/* Add this at the end */}
      <ConfirmDialog {...confirmationProps} />
    </DashboardLayout>
  )
}
```

## 🎯 **Template untuk Workspace Page** 

```typescript
// Replace existing delete function
const handleDeleteWorkspace = async () => {
  const result = await deleteWithToast(
    async () => {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.message || 'Gagal menghapus workspace')
      }
      return data
    },
    'workspace'
  )

  if (result) {
    router.push('/workspaces')
  }
}

// Replace invite member function
const handleInviteMember = async (e: React.FormEvent) => {
  e.preventDefault()
  
  const result = await createWithToast(
    async () => {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/workspaces/${workspaceId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: inviteEmail })
      })

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.message || 'Gagal mengundang member')
      }
      return data
    },
    'undangan member',
    { 
      skipConfirmation: true,
      successMessage: 'Undangan berhasil dikirim!'
    }
  )

  if (result) {
    setShowInviteModal(false)
    setInviteEmail('')
    loadWorkspaceData()
  }
}
```

## 🎯 **Template untuk Auth Pages**

```typescript
// Login page
import { crudToast } from '@/lib/toast'

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const data = await response.json()

    if (data.success) {
      localStorage.setItem('token', data.data.token)
      crudToast.loginSuccess()
      router.push('/dashboard')
    } else {
      crudToast.loginError(data.message)
    }
  } catch (error) {
    crudToast.networkError()
  } finally {
    setLoading(false)
  }
}

// Register page
const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  setErrors({})

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    })

    const data = await response.json()

    if (data.success) {
      appToast.success('Akun berhasil dibuat! Silakan login.')
      router.push('/auth/login')
    } else {
      if (data.errors) {
        setErrors(data.errors)
        crudToast.validationError()
      } else {
        crudToast.createError('akun', data.message)
      }
    }
  } catch (error) {
    crudToast.networkError()
  } finally {
    setLoading(false)
  }
}
```

## 🚀 **Migration Checklist**

### **Per Halaman:**
- [ ] Import `useCrudOperations`, `ConfirmDialog`, dan toast utilities
- [ ] Replace `confirm()` calls dengan `deleteWithToast()`
- [ ] Replace `alert()` calls dengan appropriate toast
- [ ] Add `<ConfirmDialog {...confirmationProps} />` di render
- [ ] Update error handling menggunakan `crudToast`
- [ ] Test create, update, delete operations

### **Common Patterns:**
```typescript
// ❌ Before
if (!confirm('Sure?')) return
try {
  await api()
  alert('Success!')
} catch {
  alert('Error!')
}

// ✅ After
const result = await deleteWithToast(() => api(), 'item')
if (result) { /* success handling */ }
```

---

**Status Implementation:**
- ✅ **Core System**: Toast utilities, hooks, components
- ✅ **Plans Page**: Fully implemented with toast & confirmation
- 🔄 **Expenses Page**: Ready for implementation  
- 🔄 **Workspace Page**: Ready for implementation
- 🔄 **Auth Pages**: Ready for implementation

**Sistem siap digunakan di semua halaman! Copy template di atas dan sesuaikan dengan kebutuhan masing-masing halaman.** 🎉
