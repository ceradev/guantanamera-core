import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function DroppableColumn({
  id,
  children,
  isOver,
}: {
  id: string
  children: React.ReactNode
  isOver: boolean
}) {
  const { setNodeRef } = useDroppable({ id })

  const getBgColor = () => {
    switch (id) {
      case 'received':
        return isOver ? 'bg-gray-100/80 border-gray-400' : 'bg-gray-50/50 border-gray-200'
      case 'preparing':
        return isOver ? 'bg-red-50/80 border-red-400' : 'bg-gray-50/50 border-gray-200'
      case 'ready':
        return isOver ? 'bg-green-50/80 border-green-400' : 'bg-gray-50/50 border-gray-200'
      default:
        return 'bg-gray-50/50'
    }
  }

  return (
    <motion.div
      ref={setNodeRef}
      animate={{
        backgroundColor: isOver ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0)',
        borderColor: isOver ? 'currentColor' : 'transparent',
      }}
      className={cn('flex-1 rounded-xl border-2 border-transparent p-2 transition-colors', getBgColor())}
    >
      <div className="space-y-4 h-full">
        {children}
        {React.Children.count(children) === 0 && (
          <div className="h-40 flex items-center justify-center text-muted-foreground italic border-2 border-dashed border-gray-200 rounded-lg">
            No hay pedidos
          </div>
        )}
      </div>
    </motion.div>
  )
}

