"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/data-display/card"
import { Button } from "@/components/ui/buttons/button"
import { Input } from "@/components/ui/inputs/input"
import {
    Plus,
    Trash2,
    Building2,
    Mail,
    Phone,
    MapPin,
    Search,
    Loader2,
    Pencil,
    X,
    Check
} from "lucide-react"
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from "@/services"
import type { Supplier } from "@/types"
import { useToast } from "@/hooks/use-toast"
import Skeleton from "react-loading-skeleton"

export default function SuppliersPage() {
    const { toast } = useToast()
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    
    // Form state
    const [isAdding, setIsAdding] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState<Partial<Supplier>>({
        name: "",
        fiscalId: "",
        address: "",
        email: "",
        phone: ""
    })

    const fetchSuppliers = useCallback(async () => {
        setIsLoading(true)
        try {
            const data = await getSuppliers()
            setSuppliers(data)
        } catch (error) {
            console.error(error)
            toast({ title: "Error", description: "No se pudieron cargar los proveedores", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }, [toast])

    useEffect(() => {
        fetchSuppliers()
    }, [fetchSuppliers])

    const handleAdd = async () => {
        if (!formData.name?.trim()) {
            toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" })
            return
        }

        try {
            await createSupplier(formData)
            toast({ title: "Éxito", description: "Proveedor creado correctamente" })
            setIsAdding(false)
            setFormData({ name: "", fiscalId: "", address: "", email: "", phone: "" })
            fetchSuppliers()
        } catch (error) {
            console.error(error)
            toast({ title: "Error", description: "No se pudo crear el proveedor", variant: "destructive" })
        }
    }

    const handleUpdate = async (id: string) => {
        if (!formData.name?.trim()) {
            toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" })
            return
        }

        try {
            await updateSupplier(id, formData)
            toast({ title: "Éxito", description: "Proveedor actualizado correctamente" })
            setEditingId(null)
            fetchSuppliers()
        } catch (error) {
            console.error(error)
            toast({ title: "Error", description: "No se pudo actualizar el proveedor", variant: "destructive" })
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este proveedor?")) return

        try {
            await deleteSupplier(id)
            toast({ title: "Éxito", description: "Proveedor eliminado" })
            fetchSuppliers()
        } catch (error) {
            console.error(error)
            toast({ title: "Error", description: "No se pudo eliminar el proveedor", variant: "destructive" })
        }
    }

    const startEditing = (s: Supplier) => {
        setEditingId(s.id)
        setFormData({
            name: s.name,
            fiscalId: s.fiscalId || "",
            address: s.address || "",
            email: s.email || "",
            phone: s.phone || ""
        })
    }

    const cancelAction = () => {
        setIsAdding(false)
        setEditingId(null)
        setFormData({ name: "", fiscalId: "", address: "", email: "", phone: "" })
    }

    const filteredSuppliers = suppliers.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.fiscalId?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="flex-1 flex flex-col bg-gray-50/30 h-full overflow-hidden">
            <header className="bg-white border-b px-4 md:px-8 py-6 shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-3">
                            <Building2 className="w-8 h-8 text-red-600" />
                            Proveedores
                        </h1>
                        <p className="text-muted-foreground mt-1 text-xs md:text-sm font-medium">Gestiona tu red de proveedores y datos fiscales</p>
                    </div>

                    <Button 
                        onClick={() => setIsAdding(true)} 
                        disabled={isAdding}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl h-11 px-6 shadow-lg shadow-red-200 flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Añadir Proveedor
                    </Button>
                </div>
            </header>

            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Search bar */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            placeholder="Buscar por nombre o CIF/NIF..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 h-12 rounded-2xl border-2 border-gray-100 focus:border-red-500/20 bg-white"
                        />
                    </div>

                    {/* Add form */}
                    {isAdding && (
                        <Card className="p-6 border-2 border-red-100 bg-red-50/30 rounded-2xl animate-in fade-in slide-in-from-top-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nombre Comercial *</label>
                                    <Input 
                                        value={formData.name} 
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        placeholder="Ej: Distribuciones SL"
                                        className="rounded-xl border-gray-200 bg-white h-11"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">CIF / NIF</label>
                                    <Input 
                                        value={formData.fiscalId} 
                                        onChange={e => setFormData({...formData, fiscalId: e.target.value})}
                                        placeholder="Ej: B12345678"
                                        className="rounded-xl border-gray-200 bg-white h-11"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Email</label>
                                    <Input 
                                        value={formData.email} 
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                        placeholder="contacto@proveedor.com"
                                        className="rounded-xl border-gray-200 bg-white h-11"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Teléfono</label>
                                    <Input 
                                        value={formData.phone} 
                                        onChange={e => setFormData({...formData, phone: e.target.value})}
                                        placeholder="912 345 678"
                                        className="rounded-xl border-gray-200 bg-white h-11"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Dirección Fiscal</label>
                                    <Input 
                                        value={formData.address} 
                                        onChange={e => setFormData({...formData, address: e.target.value})}
                                        placeholder="Calle Falsa 123, Madrid"
                                        className="rounded-xl border-gray-200 bg-white h-11"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <Button variant="ghost" onClick={cancelAction} className="rounded-xl font-bold h-11 px-6">Cancelar</Button>
                                <Button onClick={handleAdd} className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl h-11 px-8">Guardar Proveedor</Button>
                            </div>
                        </Card>
                    )}

                    {/* Suppliers list */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {isLoading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} height={180} className="rounded-2xl" />
                            ))
                        ) : filteredSuppliers.length > 0 ? (
                            filteredSuppliers.map(s => (
                                <Card key={s.id} className={`p-6 border-2 transition-all rounded-2xl relative group ${editingId === s.id ? 'border-red-200 bg-red-50/10' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                                    {editingId === s.id ? (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 gap-3">
                                                <Input 
                                                    value={formData.name} 
                                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                                    className="font-bold rounded-lg"
                                                />
                                                <Input 
                                                    value={formData.fiscalId} 
                                                    onChange={e => setFormData({...formData, fiscalId: e.target.value})}
                                                    placeholder="CIF / NIF"
                                                    className="rounded-lg text-sm"
                                                />
                                                <Input 
                                                    value={formData.email} 
                                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                                    placeholder="Email"
                                                    className="rounded-lg text-sm"
                                                />
                                                <div className="flex justify-end gap-2 mt-2">
                                                    <Button size="sm" variant="ghost" onClick={cancelAction} className="rounded-lg"><X className="w-4 h-4" /></Button>
                                                    <Button size="sm" onClick={() => handleUpdate(s.id)} className="bg-green-600 hover:bg-green-700 text-white rounded-lg"><Check className="w-4 h-4" /></Button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-lg font-black text-gray-900">{s.name}</h3>
                                                    {s.fiscalId && <p className="text-xs font-bold text-gray-400 mt-0.5">{s.fiscalId}</p>}
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" onClick={() => startEditing(s)} className="h-8 w-8 rounded-lg text-gray-400 hover:text-red-600"><Pencil className="w-4 h-4" /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} className="h-8 w-8 rounded-lg text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-2.5">
                                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                                    <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                                                    <span className="truncate">{s.email || "No especificado"}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                                    <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                                                    <span>{s.phone || "No especificado"}</span>
                                                </div>
                                                <div className="flex items-start gap-3 text-sm text-gray-600">
                                                    <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                                    <span className="line-clamp-2 leading-tight">{s.address || "No especificado"}</span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </Card>
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Building2 className="w-10 h-10 text-gray-300" />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 mb-2">Sin proveedores</h2>
                                <p className="text-gray-500 font-medium">No se han encontrado proveedores que coincidan con la búsqueda.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
