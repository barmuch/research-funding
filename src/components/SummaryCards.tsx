'use client'

import { ReactNode } from 'react'

export interface SummaryCard {
  title: string
  value: string | number
  icon: ReactNode
  iconBgColor: string
  loading?: boolean
}

interface SummaryCardsProps {
  cards: SummaryCard[]
  columns?: number
  className?: string
}

export default function SummaryCards({ 
  cards, 
  columns = 3,
  className = "grid gap-6 mb-8"
}: SummaryCardsProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
  }

  return (
    <div className={`${className} ${gridCols[columns as keyof typeof gridCols] || gridCols[3]}`}>
      {cards.map((card, index) => (
        <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 ${card.iconBgColor} rounded-md flex items-center justify-center`}>
                  {card.icon}
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {card.title}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {card.loading ? (
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                      </div>
                    ) : (
                      card.value
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
