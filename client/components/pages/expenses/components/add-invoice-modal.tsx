"use client"

import { useState, useCallback, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/overlays/dialog"
import { Button } from "@/components/ui/buttons/button"
import { Input } from "@/components/ui/inputs/input"
import { Plus, Trash2, Euro, Loader2 } from "lucide-react"
import { createInvoice } from "@/services"
import { format } from "date-fns"
import type { ExpenseCategory, CreateInvoiceInput } from "@/types"
import { EXPENSE_CATEGORY_LABELS } from "@/types"
import { useToast } from "@/hooks/use-toast"

interface InvoiceItemInput {
    description: string
    quantity: number
    unitPrice: number
}

interface AddInvoiceModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function AddInvoiceModal({ open, onOpenChange, onSuccess }: AddInvoiceModalProps) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [date, setDate] = useState("")
    const [supplier, setSupplier] = useState("")
    const [reference, setReference] = useState("")
    const [category, setCategory] = useState<ExpenseCategory>("FOOD")
    const [notes, setNotes] = useState("")
    const [items, setItems] = useState<InvoiceItemInput[]>([
        { description: "", quantity: 1, unitPrice: 0 },
    ])

    // Initialize date on client to avoid hydration mismatch
    useEffect(() => {
        if (!date) {
            setDate(format(new Date(), "yyyy-MM-dd"))
        }
    }, [date])

    // Calculate totals
    const calculateItemTotal = (item: InvoiceItemInput) => item.quantity * item.unitPrice
    const totalAmount = items.reduce((sum, item) => sum + calculateItemTotal(item), 0)

    // Add new item
    const addItem = useCallback(() => {
        setItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0 }])
    }, [])

    // Remove item
    const removeItem = useCallback((index: number) => {
        setItems((prev) => prev.filter((_, i) => i !== index))
    }, [])

    // Update item
    const updateItem = useCallback((index: number, field: keyof InvoiceItemInput, value: string | number) => {
        setItems((prev) =>
            prev.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        )
    }, [])

    // Reset form
    const resetForm = useCallback(() => {
        setDate(format(new Date(), "yyyy-MM-dd"))
        setSupplier("")
        setReference("")
        setCategory("FOOD")
        setNotes("")
        setItems([{ description: "", quantity: 1, unitPrice: 0 }])
    }, [])

    // Handle submit
    const handleSubmit = useCallback(async () => {
        // Validate
        if (!supplier.trim()) {
            toast({ title: "Error", description: "El proveedor es requerido", variant: "destructive" })
            return
        }

        const validItems = items.filter((item) => item.description.trim() && item.quantity > 0 && item.unitPrice > 0)
        if (validItems.length === 0) {
            toast({ title: "Error", description: "Se requiere al menos un item válido", variant: "destructive" })
            return
        }

        const data: CreateInvoiceInput = {
            date,
            supplier: supplier.trim(),
            reference: reference.trim() || undefined,
            category,
            notes: notes.trim() || undefined,
            items: validItems,
        }

        try {
            setLoading(true)
            await createInvoice(data)
            toast({ title: "Éxito", description: "Factura registrada correctamente" })
            resetForm()
            onSuccess()
        } catch (error) {
            console.error(error)
            toast({ title: "Error", description: "Error al guardar la factura", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [date, supplier, reference, category, notes, items, resetForm, onSuccess, toast])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="overflow-y-auto max-h-[90vh] w-full max-w-4xl bg-white p-6 md:p-8 rounded-2xl">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-2xl font-bold text-gray-900">Añadir Factura</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Form Details */}
                    <div className="space-y-6">
                        <div className="grid gap-2">
                            <label htmlFor="date" className="text-sm font-bold text-gray-700">Fecha *</label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="rounded-xl border-gray-200 focus:ring-red-500/20 focus:border-red-500 h-11"
                            />
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="supplier" className="text-sm font-bold text-gray-700">Proveedor *</label>
                            <Input
                                id="supplier"
                                type="text"
                                value={supplier}
                                onChange={(e) => setSupplier(e.target.value)}
                                placeholder="Nombre del proveedor"
                                className="rounded-xl border-gray-200 focus:ring-red-500/20 focus:border-red-500 h-11"
                            />
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="category" className="text-sm font-bold text-gray-700">Categoría *</label>
                            <select
                                id="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                                className="w-full rounded-xl border-gray-200 text-sm focus:ring-red-500/20 focus:border-red-500 bg-white py-2 px-3 h-11"
                            >
                                {(Object.entries(EXPENSE_CATEGORY_LABELS) as [ExpenseCategory, string][]).map(([key, label]) => (
                                    <option key={key} value={key}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="reference" className="text-sm font-bold text-gray-700">Referencia</label>
                            <Input
                                id="reference"
                                type="text"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                placeholder="Nº factura (opcional)"
                                className="rounded-xl border-gray-200 focus:ring-red-500/20 focus:border-red-500 h-11"
                            />
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="notes" className="text-sm font-bold text-gray-700">Notas</label>
                            <textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Notas adicionales (opcional)"
                                className="w-full rounded-xl border-gray-200 focus:ring-red-500/20 focus:border-red-500 min-h-[80px] p-3 text-sm"
                            />
                        </div>

                        <div className="flex justify-between items-center bg-red-50 p-5 rounded-2xl border border-red-100 mt-4">
                            <span className="font-bold text-red-900 text-lg">Total</span>
                            <div className="flex items-center gap-2">
                                <Euro className="w-5 h-5 text-red-600" />
                                <span className="font-black text-3xl text-red-600">
                                    {totalAmount.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Items List */}
                    <div className="space-y-4 md:border-l md:pl-8 border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-lg font-bold text-gray-900">Conceptos *</label>
                            <Button size="sm" variant="ghost" onClick={addItem} className="text-red-600 hover:text-red-700 hover:bg-red-50 font-bold text-sm h-9 px-4 rounded-lg">
                                + Añadir Concepto
                            </Button>
                        </div>

                        <div className="space-y-3 max-h-[300px] md:max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {items.map((item, index) => (
                                <div key={index} className="flex items-end gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        <div className="sm:col-span-1 space-y-1">
                                            <p className="text-xs font-bold text-gray-500 ml-1">Descripción</p>
                                            <Input
                                                type="text"
                                                placeholder="Descripción"
                                                value={item.description}
                                                onChange={(e) => updateItem(index, "description", e.target.value)}
                                                className="h-10 rounded-lg"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-gray-500 ml-1">Cantidad</p>
                                            <Input
                                                type="number"
                                                placeholder="Cant."
                                                min={1}
                                                value={item.quantity || ""}
                                                onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 0)}
                                                className="h-10 rounded-lg text-center font-bold"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-gray-500 ml-1">Precio €</p>
                                            <Input
                                                type="number"
                                                placeholder="€"
                                                min={0}
                                                step={0.01}
                                                value={item.unitPrice || ""}
                                                onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                                                className="h-10 rounded-lg text-center font-bold"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-gray-700 min-w-[60px] text-right">
                                            €{calculateItemTotal(item).toFixed(2)}
                                        </span>
                                        {items.length > 1 && (
                                            <Button variant="ghost" size="icon" onClick={() => removeItem(index)} className="h-10 w-10 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg shrink-0">
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {items.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                    <div className="p-3 bg-gray-100 rounded-full mb-3">
                                        <Plus className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-500">No has añadido conceptos</p>
                                    <Button variant="link" onClick={addItem} className="text-red-600 font-bold mt-1">
                                        Añadir el primero
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-8 sm:mt-0">
                    <div className="flex w-full justify-end gap-3">
                        <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold h-11 px-6">Cancelar</Button>
                        <Button onClick={handleSubmit} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl h-11 px-8 shadow-lg shadow-red-200">
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Guardar Factura
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
