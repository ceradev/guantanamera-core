import { Card } from '@/components/ui/data-display/card'
import { Button } from '@/components/ui/buttons/button'

export function AddProductModal({ open, categoryName, productName, productPrice, onProductNameChange, onProductPriceChange, onClose, onSave, disabled }: { open: boolean; categoryName?: string; productName: string; productPrice: string; onProductNameChange: (v: string) => void; onProductPriceChange: (v: string) => void; onClose: () => void; onSave: () => void; disabled: boolean }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <Card className="w-full max-w-lg p-8 shadow-2xl border-0">
        <h2 className="text-2xl font-bold mb-1">Nuevo Producto</h2>
        <p className="text-muted-foreground mb-6">Añadiendo a: <span className="font-semibold text-gray-900">{categoryName}</span></p>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Nombre del Producto</label>
            <input type="text" value={productName} onChange={(e) => onProductNameChange(e.target.value)} placeholder="Ej: Pollo Asado" autoFocus className="w-full h-14 px-4 border-2 border-gray-200 rounded-xl text-lg focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Precio (€)</label>
            <input type="number" step="0.01" value={productPrice} onChange={(e) => onProductPriceChange(e.target.value)} placeholder="0.00" className="w-full h-14 px-4 border-2 border-gray-200 rounded-xl text-lg focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all" />
          </div>
          <div className="flex gap-4 pt-6">
            <Button variant="outline" onClick={onClose} className="flex-1 h-14 text-lg font-medium border-2">Cancelar</Button>
            <Button onClick={onSave} className="flex-1 h-14 text-lg font-bold bg-red-600 hover:bg-red-700 shadow-lg" disabled={disabled}>Guardar Producto</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

