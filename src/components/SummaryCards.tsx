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
  className = "grid gap-4 sm:gap-6 mb-6 sm:mb-8"
}: SummaryCardsProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
  }

  return (
    <div className={`${className} ${gridCols[columns as keyof typeof gridCols] || gridCols[3]}`}>
      {cards.map((card, index) => (
        <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 ${card.iconBgColor} rounded-md flex items-center justify-center`}>
                  {card.icon}
                </div>
              </div>
              <div className="ml-3 sm:ml-5 w-0 flex-1 min-w-0">
                <dl>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                    {card.title}
                  </dt>
                  <dd className="text-base sm:text-lg font-medium text-gray-900 truncate">
                    {card.loading ? (
                      <div className="animate-pulse">
                        <div className="h-5 sm:h-6 bg-gray-200 rounded w-12 sm:w-16"></div>
                      </div>
                    ) : (
                      <span className="block truncate" title={String(card.value)}>
                        {card.value}
                      </span>
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
