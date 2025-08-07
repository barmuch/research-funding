'use client'

interface Alert {
  type: 'warning' | 'info' | 'danger'
  category?: string
  message: string
  amount?: number
}

interface AlertsPanelProps {
  alerts: Alert[]
  className?: string
}

export default function AlertsPanel({ alerts, className = '' }: AlertsPanelProps) {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return '⚠️'
      case 'danger': return '🚨'
      case 'info': return 'ℹ️'
      default: return '📢'
    }
  }

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'danger': return 'bg-red-50 border-red-200 text-red-800'
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  if (alerts.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifikasi</h3>
        <div className="text-center py-8 text-gray-500">
          <div className="text-lg mb-2">✅</div>
          <p>Semua dalam kondisi baik!</p>
          <p className="text-sm mt-1">Tidak ada peringatan atau notifikasi</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Notifikasi 
        <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {alerts.length}
        </span>
      </h3>

      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <div 
            key={index}
            className={`p-4 rounded-lg border ${getAlertStyle(alert.type)}`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-3 text-lg">
                {getAlertIcon(alert.type)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {alert.message}
                </p>
                {alert.category && (
                  <p className="text-xs mt-1 opacity-75">
                    Kategori: {alert.category}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">
            {alerts.filter(a => a.type === 'danger').length} kritis, {' '}
            {alerts.filter(a => a.type === 'warning').length} peringatan, {' '}
            {alerts.filter(a => a.type === 'info').length} info
          </span>
          <button className="text-blue-600 hover:text-blue-800 font-medium">
            Lihat Detail →
          </button>
        </div>
      </div>
    </div>
  )
}
