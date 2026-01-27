import { Badge } from '@/components/ui/data-display/badge'
import { cn } from '@/lib/utils'
import type { Category } from '@/types'

export function CategoriesSidebar({ categories, selectedCategory, onSelect, isLoading }: { categories: Category[]; selectedCategory: Category | null; onSelect: (category: Category) => void; isLoading: boolean }) {
  return (
    <div className="w-full lg:w-80 h-full flex flex-col bg-white rounded-2xl border shadow-sm overflow-hidden lg:border lg:shadow-sm border-none shadow-none lg:rounded-2xl rounded-none">
      <div className="p-4 border-b bg-gray-50/50 lg:flex hidden">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">Categorías</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar min-h-0">
        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground">Cargando...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-10 px-4 text-muted-foreground">
            <p>No hay categorías.</p>
            <p className="text-sm mt-1">Crea una para empezar.</p>
          </div>
        ) : (
          categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelect(category)}
              className={cn(
                'w-full flex items-center justify-between px-4 py-5 rounded-xl text-left transition-all duration-200 group',
                selectedCategory?.id === category.id ? 'bg-red-50 text-red-900 font-bold ring-1 ring-red-200 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )}
           >
              <span className="text-lg truncate">{category.name}</span>
              <Badge
                variant="secondary"
                className={cn(selectedCategory?.id === category.id ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500 group-hover:bg-white')}
              >
                {category.products?.length || 0}
              </Badge>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

