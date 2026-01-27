import { Card } from '@/components/ui/data-display/card'
import { Button } from '@/components/ui/buttons/button'

export function AddCategoryModal({ open, newCategoryName, onNewCategoryNameChange, onClose, onSave, disabled }: { open: boolean; newCategoryName: string; onNewCategoryNameChange: (v: string) => void; onClose: () => void; onSave: () => void; disabled: boolean }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <Card className="w-full max-w-md p-8 shadow-2xl border-0">
        <h2 className="text-2xl font-bold mb-6">Nueva Categoría</h2>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Nombre de la Categoría</label>
            <input type="text" value={newCategoryName} onChange={(e) => onNewCategoryNameChange(e.target.value)} placeholder="Ej: Postres" autoFocus className="w-full h-14 px-4 border-2 border-gray-200 rounded-xl text-lg focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all" />
          </div>
          <div className="flex gap-4 pt-6">
            <Button variant="outline" onClick={onClose} className="flex-1 h-14 text-lg font-medium border-2">Cancelar</Button>
            <Button onClick={onSave} className="flex-1 h-14 text-lg font-bold bg-red-600 hover:bg-red-700 shadow-lg" disabled={disabled}>Crear Categoría</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

