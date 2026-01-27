import { cn } from '@/lib/utils'
import { Clock, AlertTriangle } from 'lucide-react'
import type { KitchenOrder } from '@/types/kitchen'

export function KitchenCard({ order, onAdvance }: { order: KitchenOrder; onAdvance: (orderId: number, currentStatus: string) => void }) {
  return (
    <div
      className={cn(
        'flex flex-col bg-white rounded-none border-l-12 shadow-sm p-5 h-full relative overflow-hidden transition-all',
        order.status === 'RECEIVED' ? 'border-l-gray-400' : 'border-l-red-500',
        order.isDelayed && 'border-l-red-600 ring-4 ring-inset ring-red-600',
        order.isNew && order.status === 'RECEIVED' && 'ring-2 ring-red-400 animate-pulse',
      )}
    >
      {order.isDelayed && (
        <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-center font-black uppercase tracking-[0.2em] py-2 text-sm animate-pulse">
          ⚠️ Retrasado ⚠️
        </div>
      )}

      <div className={cn('flex justify-between items-start mb-6 pb-4 border-b-2 border-dashed border-gray-100', order.isDelayed && 'pt-8')}>
        <div className="w-full">
          <div className="flex justify-between items-start">
            <span className={cn('text-5xl font-black tracking-tighter block mb-1', order.status === 'RECEIVED' ? 'text-gray-900' : 'text-red-600')}>
              {order.number}
            </span>
            <div className={cn('flex items-center gap-2 mt-1 px-3 py-1 rounded-lg', order.isDelayed ? 'bg-red-100 text-red-700 font-black' : 'text-gray-700 bg-gray-100')}>
              {order.isDelayed ? <AlertTriangle className="w-6 h-6" /> : <Clock className="w-6 h-6 text-gray-500" />}
              <span className={cn('text-2xl font-bold', order.isDelayed && 'text-3xl')}>{order.pickupTime}</span>
            </div>
          </div>
          {(order.customerName || order.customerPhone) && (
            <div className="mt-2 border-t-2 border-dotted pt-2 border-gray-100">
              {order.customerName && (
                <div className="text-xl font-bold text-gray-500 uppercase tracking-wide truncate">
                  {order.customerName}
                </div>
              )}
              {order.customerPhone && (
                <div className="text-base font-semibold text-gray-600 tracking-wide">
                  {order.customerPhone}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-4 mb-6 overflow-y-auto">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-4 text-xl">
            <span className="font-bold bg-gray-100 px-3 py-1 rounded-lg min-w-14 text-center text-gray-900">{item.quantity}</span>
            <span className="font-semibold text-gray-800 leading-snug pt-1">{item.name}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => onAdvance(order.id, order.status)}
        className={cn(
          'w-full py-6 text-2xl font-black uppercase tracking-wider text-white transition-all active:scale-[0.98]',
          order.status === 'RECEIVED' ? 'bg-gray-800 hover:bg-gray-900' : 'bg-red-600 hover:bg-red-700',
          order.isDelayed && 'bg-red-700 hover:bg-red-800 animate-pulse',
        )}
      >
        {order.status === 'RECEIVED' ? 'EMPEZAR' : 'LISTO'}
      </button>
    </div>
  )
}
