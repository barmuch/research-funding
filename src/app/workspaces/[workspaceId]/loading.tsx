import DashboardLayout from '@/components/DashboardLayout'

export default function Loading() {
  // Render instant skeleton without loading spinner
  const breadcrumbs = [
    { label: 'Workspaces', href: '/workspaces' },
    { label: 'Loading...', active: true }
  ]

  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      {/* Minimal skeleton that appears instantly */}
      <div className="space-y-6">
        {/* Header skeleton - instant */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="h-8 bg-gray-100 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-100 rounded w-1/2"></div>
        </div>

        {/* Tab skeleton - instant */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200 px-6">
            <div className="flex space-x-8 py-4">
              <div className="h-4 bg-gray-100 rounded w-16"></div>
              <div className="h-4 bg-indigo-100 rounded w-20"></div>
              <div className="h-4 bg-gray-100 rounded w-16"></div>
            </div>
          </div>
        </div>

        {/* Content skeleton - loads immediately */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-100 rounded-md"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-100 rounded w-20 mb-2"></div>
                  <div className="h-6 bg-gray-100 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
