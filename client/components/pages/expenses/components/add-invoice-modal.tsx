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
import { Card } from "@/components/ui/data-display/card"
import { Plus, Trash2, Euro, Loader2, Building2 } from "lucide-react"
import { createInvoice, getSuppliers } from "@/services"
import { format } from "date-fns"
import type { CreateInvoiceInput, Supplier } from "@/types"
import { useToast } from "@/hooks/use-toast"

interface InvoiceItemInput {
    description: string
    quantity: number
    unitPrice: number
    taxRate: number
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
    const [supplierId, setSupplierId] = useState("")
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [reference, setReference] = useState("")
    const [notes, setNotes] = useState("")
    const [items, setItems] = useState<InvoiceItemInput[]>([
        { description: "", quantity: 1, unitPrice: 0, taxRate: 7 },
    ])

    // Initialize date and fetch suppliers on client
    useEffect(() => {
        if (!date) {
            setDate(format(new Date(), "yyyy-MM-dd"))
        }
        
        const fetchSuppliersList = async () => {
            try {
                const list = await getSuppliers()
                setSuppliers(list)
            } catch (e) {
                console.error("Error fetching suppliers:", e)
            }
        }
        
        if (open) {
            fetchSuppliersList()
        }
    }, [date, open])

    // Calculate totals
    const calculateItemTotal = (item: InvoiceItemInput) => {
        const base = item.quantity * item.unitPrice
        const tax = base * (item.taxRate / 100)
        return base + tax
    }
    
    const totalAmount = items.reduce((sum, item) => sum + calculateItemTotal(item), 0)

    // Add new item
    const addItem = useCallback(() => {
        setItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0, taxRate: 7 }])
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
        setSupplierId("")
        setReference("")
        setNotes("")
        setItems([{ description: "", quantity: 1, unitPrice: 0, taxRate: 7 }])
    }, [])

    // Handle submit
    const handleSubmit = useCallback(async () => {
        // Validate
        if (!supplierId) {
            toast({ title: "Error", description: "El proveedor es requerido", variant: "destructive" })
            return
        }

        const validItems = items.filter((item) => item.description.trim() && item.quantity > 0 && item.unitPrice !== 0)
        if (validItems.length === 0) {
            toast({ title: "Error", description: "Se requiere al menos un item válido", variant: "destructive" })
            return
        }

        const data: CreateInvoiceInput = {
            date,
            supplierId,
            reference: reference.trim() || undefined,
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
    }, [date, supplierId, reference, notes, items, resetForm, onSuccess, toast])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="overflow-y-auto max-h-[90vh] w-full max-w-5xl bg-white p-6 md:p-8 rounded-2xl">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-2xl font-black text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-red-50 rounded-lg">
                            <Plus className="w-6 h-6 text-red-600" />
                        </div>
                        Añadir Nueva Factura
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Left Column: Form Details */}
                    <div className="xl:col-span-1 space-y-6">
                        <div className="grid gap-2">
                            <label htmlFor="date" className="text-sm font-bold text-gray-700">Fecha de Factura *</label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="rounded-xl border-2 border-gray-100 focus:ring-red-500/20 focus:border-red-500 h-12 font-medium"
                            />
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="supplier" className="text-sm font-bold text-gray-700">Proveedor *</label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                <select
                                    id="supplier"
                                    value={supplierId}
                                    onChange={(e) => setSupplierId(e.target.value)}
                                    className="w-full pl-10 pr-4 rounded-xl border-2 border-gray-100 focus:ring-red-500/20 focus:border-red-500 h-12 font-medium bg-white appearance-none cursor-pointer"
                                >
                                    <option value="">Selecciona un proveedor</option>
                                    {suppliers.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} {s.fiscalId ? `(${s.fiscalId})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="reference" className="text-sm font-bold text-gray-700">Referencia / Nº Factura</label>
                            <Input
                                id="reference"
                                type="text"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                placeholder="Ej: INV-2024-001"
                                className="rounded-xl border-2 border-gray-100 focus:ring-red-500/20 focus:border-red-500 h-12 font-medium"
                            />
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="notes" className="text-sm font-bold text-gray-700">Notas Adicionales</label>
                            <textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Detalles internos..."
                                className="w-full rounded-xl border-2 border-gray-100 focus:ring-red-500/20 focus:border-red-500 min-h-[100px] p-3 text-sm font-medium"
                            />
                        </div>

                        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Facturado</span>
                                <Euro className="w-4 h-4 text-red-500" />
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-white">€{totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Items List */}
                    <div className="xl:col-span-2 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-black text-gray-900">Desglose de Conceptos</h3>
                            <Button size="sm" variant="outline" onClick={addItem} className="text-red-600 border-red-100 hover:bg-red-50 font-black text-xs h-9 px-4 rounded-lg">
                                + AÑADIR CONCEPTO
                            </Button>
                        </div>

                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {items.map((item, index) => (
                                <Card key={index} className="p-4 border-2 border-gray-100 shadow-sm rounded-xl bg-gray-50/50">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                        <div className="md:col-span-5 space-y-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Descripción</p>
                                            <Input
                                                placeholder="Concepto..."
                                                value={item.description}
                                                onChange={(e) => updateItem(index, "description", e.target.value)}
                                                className="h-10 border-gray-200 font-medium"
                                            />
                                        </div>
                                        <div className="md:col-span-2 space-y-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Cant.</p>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={item.quantity || ""}
                                                onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 0)}
                                                className="h-10 border-gray-200 font-bold text-center"
                                            />
                                        </div>
                                        <div className="md:col-span-2 space-y-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">P. Base €</p>
                                            <Input
                                                type="number"
                                                step={0.01}
                                                value={item.unitPrice || ""}
                                                onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                                                className="h-10 border-gray-200 font-bold text-center"
                                            />
                                        </div>
                                        <div className="md:col-span-2 space-y-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">IGIC %</p>
                                            <select
                                                value={item.taxRate}
                                                onChange={(e) => updateItem(index, "taxRate", parseFloat(e.target.value))}
                                                className="w-full h-10 border-gray-200 rounded-md text-sm font-bold text-center bg-white border"
                                            >
                                                <option value={0}>0%</option>
                                                <option value={3}>3%</option>
                                                <option value={7}>7%</option>
                                                <option value={9.5}>9.5%</option>
                                                <option value={15}>15%</option>
                                                <option value={20}>20%</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-1 flex justify-center">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => removeItem(index)}
                                                disabled={items.length === 1}
                                                className="h-10 w-10 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex justify-end items-center gap-4 text-xs font-bold border-t border-gray-100 pt-3">
                                        <span className="text-gray-400">Subtotal: €{(item.quantity * item.unitPrice).toFixed(2)}</span>
                                        <span className="text-gray-400">IGIC: €{(item.quantity * item.unitPrice * (item.taxRate / 100)).toFixed(2)}</span>
                                        <span className="text-red-600 bg-red-50 px-2 py-1 rounded">Total: €{calculateItemTotal(item).toFixed(2)}</span>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-8 border-t pt-6">
                    <div className="flex w-full justify-between items-center">
                        <p className="text-xs font-bold text-gray-400">* Campos obligatorios</p>
                        <div className="flex gap-3">
                            <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold h-12 px-6">Cancelar</Button>
                            <Button onClick={handleSubmit} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white font-black rounded-xl h-12 px-10 shadow-lg shadow-red-200">
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                REGISTRAR FACTURA
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
