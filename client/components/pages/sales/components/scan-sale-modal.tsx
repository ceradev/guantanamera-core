"use client"

import { useState, useCallback } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/overlays/dialog"
import { Button } from "@/components/ui/buttons/button"
import { Camera, Upload, Loader2, AlertTriangle, CheckCircle } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { scanSalesTicket } from "@/services/sales.service"
import type { ScannedSaleData } from "@/types"

interface ScanSaleModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onScanComplete: (data: ScannedSaleData) => void
}

export function ScanSaleModal({ open, onOpenChange, onScanComplete }: ScanSaleModalProps) {
    const [scanning, setScanning] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [preview, setPreview] = useState<string | null>(null)

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return

        const file = acceptedFiles[0]
        setError(null)

        // Show preview
        const reader = new FileReader()
        reader.onload = () => setPreview(reader.result as string)
        reader.readAsDataURL(file)

        // Process with AI
        try {
            setScanning(true)
            const result = await scanSalesTicket(file)

            if (result.success) {
                onScanComplete(result)
                onOpenChange(false)
                setPreview(null)
            } else {
                setError(result.error || "No se pudo procesar el ticket")
            }
        } catch (err: any) {
            setError(err.message || "Error al escanear el ticket")
        } finally {
            setScanning(false)
        }
    }, [onScanComplete, onOpenChange])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/jpeg": [".jpg", ".jpeg"],
            "image/png": [".png"],
            "image/webp": [".webp"],
        },
        maxFiles: 1,
        disabled: scanning,
    })

    const handleClose = () => {
        if (!scanning) {
            setError(null)
            setPreview(null)
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg bg-white p-6 rounded-2xl">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Camera className="w-5 h-5 text-red-600" />
                        Escanear Ticket de Venta
                    </DialogTitle>
                </DialogHeader>

                {/* Info Banner */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                    <div className="flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800">
                            <p className="font-semibold mb-1">Sugerencia automática</p>
                            <p className="opacity-80">
                                La IA analizará el ticket y sugerirá productos basándose en el total.
                                <strong> Siempre revisa antes de guardar.</strong>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Drop Zone */}
                <div
                    {...getRootProps()}
                    className={`
                        relative border-2 border-dashed rounded-2xl p-8 transition-all duration-200 cursor-pointer
                        ${isDragActive ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-red-300 hover:bg-red-50/50"}
                        ${scanning ? "pointer-events-none opacity-60" : ""}
                    `}
                >
                    <input {...getInputProps()} />

                    {preview ? (
                        <div className="flex flex-col items-center">
                            <img
                                src={preview}
                                alt="Preview"
                                className="max-h-48 rounded-lg shadow-lg mb-4 object-contain"
                            />
                            {scanning ? (
                                <div className="flex items-center gap-2 text-red-600">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span className="font-semibold">Analizando con IA...</span>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">Suelta otra imagen para cambiar</p>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-center">
                            <div className={`p-4 rounded-full mb-4 ${isDragActive ? "bg-red-100" : "bg-gray-100"}`}>
                                <Upload className={`w-8 h-8 ${isDragActive ? "text-red-600" : "text-gray-400"}`} />
                            </div>
                            <p className="font-semibold text-gray-700 mb-1">
                                {isDragActive ? "Suelta la imagen aquí" : "Arrastra una imagen del ticket"}
                            </p>
                            <p className="text-sm text-gray-500 mb-4">
                                o haz clic para seleccionar
                            </p>
                            <p className="text-xs text-gray-400">
                                JPG, PNG o WebP • Máximo 10MB
                            </p>
                        </div>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                            <div className="text-sm text-red-800">
                                <p className="font-semibold">Error al procesar</p>
                                <p className="opacity-80">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success Indicator */}
                {scanning && (
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Extrayendo texto del ticket...</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                            <span>Analizando con inteligencia artificial...</span>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="flex justify-end gap-3 mt-6">
                    <Button
                        variant="ghost"
                        onClick={handleClose}
                        disabled={scanning}
                        className="rounded-xl font-bold px-6"
                    >
                        Cancelar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
