"use client"

import { useState, useCallback, useRef } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/overlays/dialog"
import { Button } from "@/components/ui/buttons/button"
import { Upload, FileImage, Loader2, AlertCircle, CheckCircle2, X } from "lucide-react"
import { scanInvoice } from "@/services"
import type { ScannedInvoiceData } from "@/types"

interface ScanInvoiceModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onScanComplete: (data: ScannedInvoiceData) => void
}

type ScanStep = "upload" | "processing" | "error"

export function ScanInvoiceModal({ open, onOpenChange, onScanComplete }: ScanInvoiceModalProps) {
    const [step, setStep] = useState<ScanStep>("upload")
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = useCallback((selectedFile: File) => {
        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
        if (!allowedTypes.includes(selectedFile.type)) {
            setError("Tipo de archivo no soportado. Usa JPG, PNG, WebP o PDF.")
            return
        }

        // Validate file size (10MB)
        if (selectedFile.size > 10 * 1024 * 1024) {
            setError("El archivo es demasiado grande. Máximo 10MB.")
            return
        }

        setFile(selectedFile)
        setError(null)

        // Create preview for images
        if (selectedFile.type.startsWith("image/")) {
            const reader = new FileReader()
            reader.onload = (e) => setPreview(e.target?.result as string)
            reader.readAsDataURL(selectedFile)
        } else {
            setPreview(null) // No preview for PDFs
        }
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        const droppedFile = e.dataTransfer.files[0]
        if (droppedFile) {
            handleFileSelect(droppedFile)
        }
    }, [handleFileSelect])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            handleFileSelect(selectedFile)
        }
    }, [handleFileSelect])

    const resetState = useCallback(() => {
        setStep("upload")
        setFile(null)
        setPreview(null)
        setError(null)
        setIsDragging(false)
    }, [])

    const handleScan = useCallback(async () => {
        if (!file) return

        setStep("processing")
        setError(null)

        try {
            const result = await scanInvoice(file)

            // Backend returns extractedData, map to ScannedInvoiceData format
            if (result.success && result.extractedData) {
                const scannedData: ScannedInvoiceData = {
                    supplier: result.extractedData.supplier,
                    date: result.extractedData.date,
                    totalAmount: result.extractedData.totalAmount,
                    reference: result.extractedData.reference,
                    category: result.extractedData.category,
                    items: (result.extractedData.items || []).map((item: any) => ({
                        description: item.description || "",
                        quantity: item.quantity || 1,
                        unitPrice: item.unitPrice || 0,
                        totalPrice: item.total || 0,
                    })),
                    confidence: result.ocrConfidence || 0,
                    rawText: result.rawText,
                }
                onScanComplete(scannedData)
                onOpenChange(false)
                resetState()
            } else {
                setError(result.error || "No se pudieron extraer datos de la factura")
                setStep("error")
            }
        } catch (err: any) {
            setError(err.message || "Error al procesar la factura")
            setStep("error")
        }
    }, [file, onScanComplete, onOpenChange, resetState])

    const handleClose = useCallback(() => {
        onOpenChange(false)
        // Reset after animation
        setTimeout(resetState, 200)
    }, [onOpenChange, resetState])

    const handleRetry = useCallback(() => {
        setStep("upload")
        setError(null)
    }, [])

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg bg-white p-6 rounded-2xl">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <FileImage className="w-5 h-5 text-red-600" />
                        Escanear Factura
                    </DialogTitle>
                </DialogHeader>

                {step === "upload" && (
                    <div className="space-y-4">
                        {/* Drop zone */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            className={`
                                relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                                ${isDragging
                                    ? "border-red-500 bg-red-50"
                                    : file
                                        ? "border-green-500 bg-green-50"
                                        : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                                }
                            `}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,application/pdf"
                                onChange={handleInputChange}
                                className="hidden"
                            />

                            {preview ? (
                                <div className="space-y-3">
                                    <img
                                        src={preview}
                                        alt="Vista previa"
                                        className="max-h-48 mx-auto rounded-lg shadow-sm"
                                    />
                                    <div className="flex items-center justify-center gap-2 text-green-700">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span className="font-medium text-sm">{file?.name}</span>
                                    </div>
                                </div>
                            ) : file ? (
                                <div className="space-y-3">
                                    <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                                        <FileImage className="w-8 h-8 text-green-600" />
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-green-700">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span className="font-medium text-sm">{file.name}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                                        <Upload className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-700">
                                            Arrastra una imagen o haz clic para seleccionar
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            JPG, PNG, WebP o PDF (máx. 10MB)
                                        </p>
                                    </div>
                                </div>
                            )}

                            {file && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setFile(null)
                                        setPreview(null)
                                    }}
                                    className="absolute top-2 right-2 p-1 bg-gray-100 hover:bg-gray-200 rounded-full"
                                >
                                    <X className="w-4 h-4 text-gray-600" />
                                </button>
                            )}
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="ghost"
                                onClick={handleClose}
                                className="flex-1 rounded-xl font-bold h-11"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleScan}
                                disabled={!file}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl h-11"
                            >
                                Escanear Factura
                            </Button>
                        </div>
                    </div>
                )}

                {step === "processing" && (
                    <div className="py-12 text-center space-y-4">
                        <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900">Analizando factura...</p>
                            <p className="text-sm text-gray-500 mt-1">
                                Extrayendo texto y procesando con IA
                            </p>
                        </div>
                        <div className="h-2 w-48 mx-auto bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 rounded-full animate-pulse" style={{ width: "60%" }} />
                        </div>
                    </div>
                )}

                {step === "error" && (
                    <div className="py-8 text-center space-y-4">
                        <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900">Error al escanear</p>
                            <p className="text-sm text-gray-500 mt-1">{error}</p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="ghost"
                                onClick={handleClose}
                                className="flex-1 rounded-xl font-bold h-11"
                            >
                                Cerrar
                            </Button>
                            <Button
                                onClick={handleRetry}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl h-11"
                            >
                                Reintentar
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
