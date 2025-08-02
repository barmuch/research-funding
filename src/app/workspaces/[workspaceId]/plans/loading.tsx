import LoadingState from '@/components/LoadingState'
import DashboardLayout from '@/components/DashboardLayout'

export default function Loading() {
  const breadcrumbs = [
    { label: 'Workspaces', href: '/workspaces' },
    { label: 'Workspace', href: '#' },
    { label: 'Budget Plans', active: true }
  ]

  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      <div className="animate-pulse">
        {/* Header Skeleton */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>

        {/* Tab Navigation Skeleton */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200 px-6">
            <div className="flex space-x-8 py-4">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <div className="h-4 bg-indigo-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-md"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Plans List Skeleton */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <div className="h-4 bg-gray-200 rounded flex-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
