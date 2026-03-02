"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/overlays/dialog"
import { Button } from "@/components/ui/buttons/button"
import { Euro, Calendar, User, Hash, FileText, Building2, Info } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { Invoice } from "@/types"

interface InvoiceDetailModalProps {
    invoice: Invoice | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function InvoiceDetailModal({ invoice, open, onOpenChange }: InvoiceDetailModalProps) {
    if (!invoice) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="overflow-y-auto max-h-[90vh] w-full max-w-4xl bg-white p-6 md:p-8 rounded-2xl border-none shadow-2xl">
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-2xl font-black text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-red-50 rounded-lg">
                            <FileText className="w-6 h-6 text-red-600" />
                        </div>
                        Detalle de Factura
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Invoice Info */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-5 bg-gray-50/50 rounded-2xl border-2 border-gray-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-white rounded-lg shadow-sm">
                                        <Building2 className="w-4 h-4 text-red-600" />
                                    </div>
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Proveedor</h4>
                                </div>
                                <p className="text-xl font-black text-gray-900">{invoice.supplier.name}</p>
                                {invoice.supplier.fiscalId && (
                                    <p className="text-sm font-bold text-gray-500 mt-1">CIF/NIF: {invoice.supplier.fiscalId}</p>
                                )}
                                {invoice.supplier.address && (
                                    <p className="text-xs font-medium text-gray-400 mt-2">{invoice.supplier.address}</p>
                                )}
                            </div>

                            <div className="p-5 bg-gray-50/50 rounded-2xl border-2 border-gray-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-white rounded-lg shadow-sm">
                                        <Calendar className="w-4 h-4 text-red-600" />
                                    </div>
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Emisión</h4>
                                </div>
                                <p className="text-xl font-black text-gray-900">
                                    {format(new Date(invoice.date), "dd 'de' MMMM, yyyy", { locale: es })}
                                </p>
                                <p className="text-sm font-bold text-gray-500 mt-1">Ref: {invoice.reference || "Sin referencia"}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                    Conceptos Facturados
                                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{invoice.items.length}</span>
                                </h3>
                            </div>
                            <div className="border-2 border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-[10px] text-gray-400 uppercase font-black bg-gray-50/50 border-b">
                                        <tr>
                                            <th className="px-6 py-4">Descripción</th>
                                            <th className="px-6 py-4 text-center">Cant.</th>
                                            <th className="px-6 py-4 text-right">Base Un.</th>
                                            <th className="px-6 py-4 text-right">IGIC</th>
                                            <th className="px-6 py-4 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {invoice.items.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                                                <td className="px-6 py-4 font-bold text-gray-900">{item.description}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-lg text-xs">{item.quantity}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-gray-500">€{item.unitPrice.toFixed(2)}</td>
                                                <td className="px-6 py-4 text-right text-xs font-bold text-blue-600">{item.taxRate}%</td>
                                                <td className="px-6 py-4 text-right font-black text-gray-900">€{item.totalPrice.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Summary Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-gray-900 p-6 rounded-3xl border border-gray-800 shadow-2xl relative overflow-hidden group">
                            <div className="absolute right-0 top-0 w-32 h-32 bg-red-600 rounded-bl-full -mr-12 -mt-12 transition-transform group-hover:scale-110 opacity-20" />
                            
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Resumen Económico</h4>
                            
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm font-bold text-gray-400">
                                    <span>Base Imponible</span>
                                    <span className="text-white">€{invoice.baseAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-bold text-gray-400">
                                    <span>Total Impuestos</span>
                                    <span className="text-blue-400">€{invoice.taxAmount.toFixed(2)}</span>
                                </div>
                                <div className="pt-4 border-t border-gray-800 flex justify-between items-end">
                                    <span className="text-xs font-black text-red-500 uppercase">Total Facturado</span>
                                    <span className="text-3xl font-black text-white">€{invoice.totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {invoice.notes && (
                            <div className="p-5 bg-amber-50 rounded-2xl border-2 border-amber-100/50">
                                <div className="flex items-center gap-2 mb-3">
                                    <Info className="w-4 h-4 text-amber-600" />
                                    <h4 className="text-xs font-black text-amber-900 uppercase tracking-widest">Observaciones</h4>
                                </div>
                                <p className="text-sm font-medium text-amber-900/70 leading-relaxed italic">
                                    "{invoice.notes}"
                                </p>
                            </div>
                        )}

                        <div className="p-5 bg-gray-50 rounded-2xl border-2 border-gray-100">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Auditoría</h4>
                            <p className="text-[10px] font-bold text-gray-500">
                                Creado el: {format(new Date(invoice.createdAt), "dd/MM/yyyy HH:mm")}
                            </p>
                            <p className="text-[10px] font-bold text-gray-500 mt-1">
                                ID: {invoice.id}
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-8 border-t pt-6">
                    <Button onClick={() => onOpenChange(false)} className="bg-gray-900 hover:bg-black text-white font-black rounded-xl h-12 px-10 transition-transform active:scale-95">
                        CERRAR DETALLE
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
