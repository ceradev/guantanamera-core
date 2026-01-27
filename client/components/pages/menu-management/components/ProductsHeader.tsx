import { Badge } from '@/components/ui/data-display/badge'
import type { Category } from '@/types'

export function ProductsHeader({ category, count }: { category: Category; count: number }) {
  return (
    <div className="p-4 md:p-6 border-b bg-gray-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-3">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">{category.name}</h2>
          <Badge variant="outline" className="text-xs md:text-sm px-3 py-1 border-gray-300">
            {count} productos
          </Badge>
        </div>
      </div>
    </div>
  )
}
