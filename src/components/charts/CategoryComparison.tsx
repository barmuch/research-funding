'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface CategoryComparisonProps {
  data: Array<{
    category: string
    planned: number
    spent: number
    percentage: number
    status: 'over' | 'unused' | 'normal'
  }>
  className?: string
}

export default function CategoryComparison({ data, className = '' }: CategoryComparisonProps) {
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const planned = payload[0]?.value || 0
      const spent = payload[1]?.value || 0
      const percentage = planned > 0 ? (spent / planned) * 100 : 0

      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <div className="space-y-1 mt-2">
            <p className="text-sm">
              <span className="text-blue-600">Rencana: </span>
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
                notation: 'compact'
              }).format(planned)}
            </p>
            <p className="text-sm">
              <span className="text-red-600">Pengeluaran: </span>
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
                notation: 'compact'
              }).format(spent)}
            </p>
            <p className="text-sm">
              <span className="text-gray-600">Penggunaan: </span>
              <span className={percentage > 100 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                {percentage.toFixed(1)}%
              </span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Perbandingan per Kategori</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
            <span>Rencana</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
            <span>Pengeluaran</span>
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-lg mb-2">📊</div>
          <p>Belum ada data untuk ditampilkan</p>
        </div>
      ) : (
        <>
          {/* Chart */}
          <div className="h-80 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="category" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={12}
                />
                <YAxis 
                  tickFormatter={(value) => 
                    new Intl.NumberFormat('id-ID', {
                      notation: 'compact',
                      compactDisplay: 'short'
                    }).format(value)
                  }
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="planned" fill="#3b82f6" name="Rencana" radius={[4, 4, 0, 0]} />
                <Bar dataKey="spent" fill="#ef4444" name="Pengeluaran" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Over budget categories */}
            {data.filter(item => item.status === 'over').length > 0 && (
              <div className="bg-red-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-800 mb-2">
                  ⚠️ Melebihi Budget ({data.filter(item => item.status === 'over').length})
                </h4>
                <div className="space-y-1">
                  {data.filter(item => item.status === 'over').map(item => (
                    <div key={item.category} className="text-xs text-red-700">
                      {item.category}: {item.percentage.toFixed(1)}%
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unused categories */}
            {data.filter(item => item.status === 'unused').length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-800 mb-2">
                  💤 Belum Digunakan ({data.filter(item => item.status === 'unused').length})
                </h4>
                <div className="space-y-1">
                  {data.filter(item => item.status === 'unused').map(item => (
                    <div key={item.category} className="text-xs text-gray-700">
                      {item.category}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Normal categories */}
            {data.filter(item => item.status === 'normal').length > 0 && (
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-800 mb-2">
                  ✅ Normal ({data.filter(item => item.status === 'normal').length})
                </h4>
                <div className="space-y-1">
                  {data.filter(item => item.status === 'normal').slice(0, 3).map(item => (
                    <div key={item.category} className="text-xs text-green-700">
                      {item.category}: {item.percentage.toFixed(1)}%
                    </div>
                  ))}
                  {data.filter(item => item.status === 'normal').length > 3 && (
                    <div className="text-xs text-green-600">
                      +{data.filter(item => item.status === 'normal').length - 3} lainnya
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
