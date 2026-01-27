import { Badge } from '@/components/ui/data-display/badge'
import { Button } from '@/components/ui/buttons/button'
import { cn } from '@/lib/utils'
import { ToggleLeft, ToggleRight, Pencil, Trash2 } from 'lucide-react'
import type { Product } from '@/types'

export function ProductRow({ product, onToggle, onEdit, onDelete }: { product: Product; onToggle: (product: Product) => void; onEdit: (product: Product) => void; onDelete: (id: number) => void }) {
  return (
    <div className={cn('flex items-center justify-between p-4 md:p-5 rounded-2xl border transition-all hover:shadow-md bg-white', !product.active && 'opacity-60 bg-gray-50 border-dashed')}>
      <div className="flex-1 min-w-0 pr-2 md:pr-8">
        <div className="flex items-center gap-2 md:gap-3 mb-0.5 md:mb-1">
          <h3 className="text-lg md:text-xl font-bold text-gray-900 truncate">{product.name}</h3>
          {!product.active && <Badge variant="secondary" className="bg-gray-200 text-gray-600 text-[10px] md:text-xs font-medium px-1.5 py-0">Inactivo</Badge>}
        </div>
        <p className="text-xl md:text-2xl font-medium text-red-600">€{product.price.toFixed(2)}</p>
      </div>
      <div className="flex items-center shrink-0">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <Button variant="ghost" size="icon" onClick={() => onToggle(product)} className={cn('h-10 w-10 md:h-11 md:w-11 rounded-md transition-colors', product.active ? 'text-green-600 hover:bg-white hover:shadow-sm' : 'text-gray-400 hover:text-gray-600')} title={product.active ? 'Desactivar' : 'Activar'}>
            {product.active ? <ToggleRight className="w-5 h-5 md:w-6 md:h-6" /> : <ToggleLeft className="w-5 h-5 md:w-6 md:h-6" />}
          </Button>
          <div className="w-px bg-gray-300 mx-0.5 md:mx-1 my-2" />
          <Button variant="ghost" size="icon" className="h-10 w-10 md:h-11 md:w-11 text-blue-600 hover:bg-white hover:shadow-sm rounded-md" onClick={() => onEdit(product)}>
            <Pencil className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
          <div className="w-px bg-gray-300 mx-0.5 md:mx-1 my-2" />
          <Button variant="ghost" size="icon" className="h-10 w-10 md:h-11 md:w-11 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md" onClick={() => onDelete(product.id)}>
            <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

