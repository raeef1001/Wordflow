interface AnalyticsCardProps {
  title: string
  value: number
  icon: string
}

export function AnalyticsCard({ title, value, icon }: AnalyticsCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-transform hover:scale-105">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
        {value.toLocaleString()}
      </p>
    </div>
  )
}
