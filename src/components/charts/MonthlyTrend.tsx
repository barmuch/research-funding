'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface MonthlyTrendProps {
  data: Array<{
    month: string
    expenses: number
  }>
  className?: string
}

export default function MonthlyTrend({ data, className = '' }: MonthlyTrendProps) {
  const maxExpense = Math.max(...data.map(d => d.expenses))
  const avgExpense = data.reduce((sum, d) => sum + d.expenses, 0) / data.length

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Tren Pengeluaran 6 Bulan</h3>
        <div className="text-sm text-gray-600">
          Rata-rata: {new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
            notation: 'compact'
          }).format(avgExpense)}
        </div>
      </div>

      {data.every(d => d.expenses === 0) ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-lg mb-2">📈</div>
          <p>Belum ada pengeluaran dalam 6 bulan terakhir</p>
        </div>
      ) : (
        <>
          <div className="h-64 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
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
                <Tooltip 
                  formatter={(value: number) => [
                    new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    }).format(value),
                    'Pengeluaran'
                  ]}
                  labelStyle={{ color: '#374151' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-blue-800 font-medium">Bulan Tertinggi</div>
              <div className="text-blue-700">
                {data.find(d => d.expenses === maxExpense)?.month || '-'}: {' '}
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                  notation: 'compact'
                }).format(maxExpense)}
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-green-800 font-medium">Total 6 Bulan</div>
              <div className="text-green-700">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                  notation: 'compact'
                }).format(data.reduce((sum, d) => sum + d.expenses, 0))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
