import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/buttons/button'
import { Clock, AlertTriangle, Check, User, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getStatusConfig } from '@/utils/orders'
import type { Order } from '@/types/orders-view'

export function SortableOrderCard({
  order,
  onUpdateStatus,
  onMarkDelivered,
  onCancel,
}: {
  order: Order
  onUpdateStatus: (orderId: string, status: 'preparing' | 'ready') => void
  onMarkDelivered: (orderId: string) => void
  onCancel: (orderId: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: order.id })

  const style = { transform: CSS.Transform.toString(transform), transition }
  const statusConfig = getStatusConfig(order.status)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative bg-white rounded-2xl border shadow-sm transition-all duration-200 overflow-hidden',
        isDragging ? 'shadow-2xl scale-105 z-50 ring-2 ring-primary rotate-1 opacity-90' : 'hover:shadow-lg hover:border-gray-300',
        statusConfig?.accent ?? '',
        order.isDelayed && 'border-red-500 ring-2 ring-red-500/20 shadow-red-100',
        order.isNew && !order.isDelayed && order.status === 'received' && 'ring-2 ring-yellow-400'
      )}
      {...attributes}
      {...listeners}
    >
      {order.isDelayed && (
        <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-[11px] font-black uppercase tracking-widest text-center py-1 z-10">
          RETRASADO
        </div>
      )}

      {order.isNew && !order.isDelayed && order.status === 'received' && (
        <div className="absolute top-2 right-2">
          <span className="bg-yellow-400 text-yellow-950 text-xs font-bold px-2 py-1 rounded-full shadow-sm">NUEVO</span>
        </div>
      )}

      <div className={cn('p-4 border-b', order.isDelayed ? 'pt-8 bg-red-50/40' : 'bg-gray-50/40')}>
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-3xl font-black text-gray-900 tracking-tight">{order.number}</h3>
          <div
            className={cn(
              'flex items-center gap-2 border px-3 py-1.5 rounded-lg shadow-sm transition-colors text-base font-bold',
              order.isDelayed ? 'bg-red-100 border-red-200 text-red-800 animate-pulse' : 'bg-white text-gray-800'
            )}
          >
            {order.isDelayed ? <AlertTriangle className="w-5 h-5" /> : <Clock className="w-5 h-5 text-gray-500" />}
            <span>{order.pickupTime}</span>
          </div>
        </div>
        {(order.customerName || order.customerPhone) && (
          <div className="space-y-1.5">
            {order.customerName && (
              <div className="flex items-center gap-2 text-base font-semibold text-gray-700">
                <User className="w-4 h-4 text-gray-500" />
                <span className="truncate">{order.customerName}</span>
              </div>
            )}
            {order.customerPhone && (
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{order.customerPhone}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 space-y-2.5 max-h-64 overflow-y-auto custom-scrollbar">
        {order.products.map((product, idx) => (
          <div key={idx} className="flex justify-between items-start gap-3 text-base group-hover:bg-gray-50/50 p-1.5 rounded-md transition-colors">
            <div className="flex gap-3 items-start min-w-0">
              <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md min-w-8 text-center shrink-0">{product.quantity}x</span>
              <span className="text-gray-800 font-medium leading-tight truncate">{product.name}</span>
            </div>
            <span className="text-gray-700 font-semibold shrink-0">€{(product.price * product.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="p-3 bg-gray-50/80 border-t flex flex-wrap items-center gap-3">
        <div className="font-black text-xl text-gray-900 min-w-20 text-center">€{order.total.toFixed(2)}</div>
        <div className="flex-1 flex justify-end items-center gap-2">
          {order.status === 'received' && (
            <Button
              size="lg"
              className="bg-white border-2 border-gray-200 text-gray-800 hover:border-primary hover:text-primary hover:bg-primary/10 font-bold shadow-sm text-sm px-6 h-10"
              onClick={(e) => {
                e.stopPropagation()
                onUpdateStatus(order.id, 'preparing')
              }}
            >
              Empezar
            </Button>
          )}
          {order.status === 'preparing' && (
            <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white font-bold shadow-md text-sm px-8 h-10" onClick={(e) => {
              e.stopPropagation()
              onUpdateStatus(order.id, 'ready')
            }}>
              Listo
            </Button>
          )}
          {order.status === 'ready' && (
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white font-bold shadow-md text-sm px-6 h-10" onClick={(e) => {
              e.stopPropagation()
              onMarkDelivered(order.id)
            }}>
              <Check className="w-5 h-5 mr-1" />
              Entregar
            </Button>
          )}

          {(order.status === 'received' || order.status === 'preparing') && (
            <Button
              size="lg"
              variant="outline"
              className="bg-white text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 px-3 text-sm h-10"
              onClick={(e) => {
                e.stopPropagation()
                onCancel(order.id)
              }}
            >
              Cancelar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
