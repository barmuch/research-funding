'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface BudgetGaugeProps {
  totalPlanned: number
  totalSpent: number
  className?: string
}

export default function BudgetGauge({ totalPlanned, totalSpent, className = '' }: BudgetGaugeProps) {
  const usagePercentage = totalPlanned > 0 ? Math.min((totalSpent / totalPlanned) * 100, 100) : 0
  const remaining = Math.max(totalPlanned - totalSpent, 0)
  
  const data = [
    { name: 'Terpakai', value: totalSpent, color: '#ef4444' },
    { name: 'Tersisa', value: remaining, color: '#e5e7eb' }
  ]

  const getStatusColor = () => {
    if (usagePercentage >= 100) return 'text-red-600'
    if (usagePercentage >= 80) return 'text-yellow-600' 
    return 'text-green-600'
  }

  const getStatusText = () => {
    if (usagePercentage >= 100) return 'Melebihi Budget'
    if (usagePercentage >= 80) return 'Hampir Habis'
    return 'Dalam Batas Normal'
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Penggunaan Dana</h3>
      
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* Gauge Chart */}
          <div className="relative w-32 h-32 mx-auto mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  startAngle={90}
                  endAngle={450}
                  innerRadius={45}
                  outerRadius={60}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [
                    new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    }).format(value)
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getStatusColor()}`}>
                  {usagePercentage.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">Terpakai</div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="text-center">
            <div className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </div>
          </div>
        </div>

        <div className="flex-1 ml-6">
          {/* Details */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Rencana:</span>
              <span className="font-semibold text-gray-900">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                  notation: 'compact'
                }).format(totalPlanned)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Pengeluaran:</span>
              <span className={`font-semibold ${totalSpent > totalPlanned ? 'text-red-600' : 'text-gray-900'}`}>
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                  notation: 'compact'
                }).format(totalSpent)}
              </span>
            </div>

            <div className="border-t pt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {totalSpent > totalPlanned ? 'Kelebihan:' : 'Sisa Dana:'}
                </span>
                <span className={`font-semibold ${totalSpent > totalPlanned ? 'text-red-600' : 'text-green-600'}`}>
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                    notation: 'compact'
                  }).format(Math.abs(totalPlanned - totalSpent))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
