"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/buttons/button"
import { Input } from "@/components/ui/inputs/input"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/overlays/dialog"
import { Plus, Trash2, Loader2, AlertTriangle, Sparkles } from "lucide-react"
import { createManualSale } from "@/services/sales.service"
import { getProducts } from "@/services/products.service"
import { useToast } from "@/hooks/use-toast"
import { Product, ScannedSaleData } from "@/types"

interface ManualSaleModalProps {
    onSuccess: () => void
    open?: boolean
    onOpenChange?: (open: boolean) => void
    initialData?: ScannedSaleData | null
}

export function ManualSaleModal({ onSuccess, open: controlledOpen, onOpenChange, initialData }: ManualSaleModalProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen
    const setOpen = onOpenChange || setInternalOpen

    const [loading, setLoading] = useState(false)
    const [products, setProducts] = useState<Product[]>([])
    const [date, setDate] = useState(new Date().toISOString().split("T")[0])
    const [items, setItems] = useState<{ productId: number; quantity: number }[]>([])
    const [notes, setNotes] = useState("")
    const [isFromAI, setIsFromAI] = useState(false)
    const [aiConfidence, setAiConfidence] = useState(0)
    const { toast } = useToast()

    useEffect(() => {
        if (open) {
            loadProducts()
        }
    }, [open])

    // Pre-fill with scanned data
    useEffect(() => {
        if (initialData && open) {
            setIsFromAI(true)
            setAiConfidence(initialData.confidence)

            // Set date if detected
            if (initialData.dateDetected) {
                setDate(initialData.dateDetected)
            }

            // Set items from suggestions
            if (initialData.suggestedItems && initialData.suggestedItems.length > 0) {
                setItems(initialData.suggestedItems.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity
                })))
            }

            // Set notes with AI info
            const aiNote = initialData.notes || "Productos sugeridos por IA"
            setNotes(aiNote)
        } else if (!open) {
            // Reset when closed
            setIsFromAI(false)
            setAiConfidence(0)
            setItems([])
            setNotes("")
            setDate(new Date().toISOString().split("T")[0])
        }
    }, [initialData, open])

    const loadProducts = async () => {
        try {
            const res = await getProducts()
            setProducts(res)
        } catch (error) {
            console.error("Failed to load products", error)
            toast({ title: "Error", description: "No se pudieron cargar los productos", variant: "destructive" })
        }
    }

    const handleAddItem = () => {
        setItems([...items, { productId: 0, quantity: 1 }])
    }

    const handleRemoveItem = (index: number) => {
        const newItems = [...items]
        newItems.splice(index, 1)
        setItems(newItems)
    }

    const handleItemChange = (index: number, field: "productId" | "quantity", value: any) => {
        const newItems = [...items]
        if (field === "productId") newItems[index].productId = Number(value)
        if (field === "quantity") newItems[index].quantity = Number(value)
        setItems(newItems)
    }

    const handleSubmit = async () => {
        if (items.length === 0 || items.some(i => i.productId === 0 || i.quantity <= 0)) {
            toast({ title: "Error", description: "Añade productos válidos", variant: "destructive" })
            return
        }

        try {
            setLoading(true)
            await createManualSale({
                date: new Date(date).toISOString(),
                items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
                notes: notes || undefined
            })
            toast({ title: "Éxito", description: "Venta registrada correcta" })
            setOpen(false)
            setItems([])
            setNotes("")
            setIsFromAI(false)
            onSuccess()
        } catch (error) {
            console.error(error)
            toast({ title: "Error", description: "Error al guardar la venta", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const calculateTotal = () => {
        return items.reduce((acc, item) => {
            const product = products.find(p => p.id === item.productId)
            return acc + (product?.price || 0) * item.quantity
        }, 0)
    }

    // Determine if this is a standalone modal or controlled
    const isControlled = controlledOpen !== undefined

    const triggerButton = !isControlled ? (
        <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl px-4 py-2 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Añade venta
            </Button>
        </DialogTrigger>
    ) : null

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {triggerButton}
            <DialogContent className="overflow-y-auto max-h-[90vh] w-full max-w-4xl bg-white p-6 md:p-8 rounded-2xl">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        {isFromAI && <Sparkles className="w-5 h-5 text-amber-500" />}
                        {isFromAI ? "Revisar Venta Escaneada" : "Añadir Venta Manual"}
                    </DialogTitle>
                </DialogHeader>

                {/* AI Warning Banner */}
                {isFromAI && (
                    <div className={`mb-6 p-4 rounded-xl border ${aiConfidence < 0.5 ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
                        <div className="flex gap-3">
                            <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${aiConfidence < 0.5 ? 'text-amber-600' : 'text-blue-600'}`} />
                            <div className="text-sm">
                                <p className={`font-semibold mb-1 ${aiConfidence < 0.5 ? 'text-amber-800' : 'text-blue-800'}`}>
                                    Productos sugeridos por IA {aiConfidence < 0.5 && "• Confianza Baja"}
                                </p>
                                <p className={`${aiConfidence < 0.5 ? 'text-amber-700' : 'text-blue-700'} opacity-80`}>
                                    Confianza: {Math.round(aiConfidence * 100)}%.
                                    <strong> Revisa los productos antes de guardar.</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Form Details */}
                    <div className="space-y-6">
                        <div className="grid gap-2">
                            <label htmlFor="date" className="text-sm font-bold text-gray-700">Fecha</label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="rounded-xl border-gray-200 focus:ring-red-500/20 focus:border-red-500 h-11"
                            />
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="notes" className="text-sm font-bold text-gray-700">Notas</label>
                            <textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Opcional..."
                                className="w-full rounded-xl border-gray-200 focus:ring-red-500/20 focus:border-red-500 min-h-[100px] p-3 text-sm"
                            />
                        </div>

                        <div className="flex justify-between items-center bg-red-50 p-5 rounded-2xl border border-red-100 mt-4">
                            <span className="font-bold text-red-900 text-lg">Total estimado</span>
                            <span className="font-black text-3xl text-red-600">€{calculateTotal().toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Right Column: Items List */}
                    <div className="space-y-4 md:border-l md:pl-8 border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-lg font-bold text-gray-900">Productos</label>
                            <Button size="sm" variant="ghost" onClick={handleAddItem} className="text-red-600 hover:text-red-700 hover:bg-red-50 font-bold text-sm h-9 px-4 rounded-lg">
                                + Añadir Producto
                            </Button>
                        </div>

                        <div className="space-y-3 max-h-[300px] md:max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {items.map((item, index) => (
                                <div key={index} className="flex items-end gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <div className="flex-1 space-y-1">
                                        <p className="text-xs font-bold text-gray-500 ml-1">Producto</p>
                                        <select
                                            className="w-full rounded-lg border-gray-200 text-sm focus:ring-red-500/20 focus:border-red-500 bg-white py-2 px-3 h-10"
                                            value={item.productId}
                                            onChange={(e) => handleItemChange(index, "productId", e.target.value)}
                                        >
                                            <option value={0}>Seleccionar...</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} - €{p.price}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-20 space-y-1">
                                        <p className="text-xs font-bold text-gray-500 ml-1">Cant.</p>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                            className="h-10 rounded-lg text-center font-bold"
                                        />
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} className="h-10 w-10 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg shrink-0">
                                        <Trash2 className="w-5 h-5" />
                                    </Button>
                                </div>
                            ))}

                            {items.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                    <div className="p-3 bg-gray-100 rounded-full mb-3">
                                        <Plus className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-500">No has añadido productos</p>
                                    <Button variant="link" onClick={handleAddItem} className="text-red-600 font-bold mt-1">
                                        Añadir el primero
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <DialogFooter className="mt-8 sm:mt-0">
                    <div className="flex w-full justify-end gap-3">
                        <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl font-bold h-11 px-6">Cancelar</Button>
                        <Button onClick={handleSubmit} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl h-11 px-8 shadow-lg shadow-red-200">
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Registrar Venta
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
