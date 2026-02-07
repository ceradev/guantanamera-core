"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useOrderDraft } from "@/context/OrderDraftContext"
import { getCategories } from "@/services"
import type { Category } from "@/types"
import { Button } from "@/components/ui/buttons/button"
import { Card } from "@/components/ui/data-display/card"
import { Badge } from "@/components/ui/data-display/badge"
import { ShoppingCart, ChevronRight, Plus, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { ErrorState } from "@/components/states/ErrorState"
import { handleApiError } from "@/utils/handleApiError"
import Skeleton from "react-loading-skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/navigation/tabs"
import { useNotifications } from "@/hooks/use-notifications"

interface StepProductsProps {
  onNext: () => void
}

export function StepProducts({ onNext }: StepProductsProps) {
  const { items, addItem, updateQuantity, total } = useOrderDraft()
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [activeTab, setActiveTab] = useState<"menu" | "cart">("menu")
  const errorToastShownRef = useRef(false)

  const fetchCategories = useCallback(async () => {
    try {
      const data = await getCategories()
      setCategories(data)
      if (data.length > 0) {
        // Only set default if none selected or if previous selection no longer exists
        if (!selectedCategory || !data.find(c => c.name === selectedCategory)) {
          setSelectedCategory(data[0].name)
        }
      }
      setHasError(false)
      errorToastShownRef.current = false
    } catch (error) {
      setHasError(true)
      if (!errorToastShownRef.current) {
        handleApiError(error, "los productos")
        errorToastShownRef.current = true
      }
    } finally {
      setIsLoading(false)
    }
  }, [selectedCategory])

  useEffect(() => {
    fetchCategories()
  }, [])

  useNotifications({
    onProductsUpdated: fetchCategories
  })

  if (isLoading && !hasError) {
    return (
      <div className="relative flex h-full overflow-hidden bg-gray-50/50">
        <div className="w-72 bg-white border-r flex flex-col">
          <div className="p-5 border-b">
            <Skeleton width={140} height={20} />
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-full px-5 py-4 rounded-xl">
                <Skeleton width={"70%"} height={20} />
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col min-w-0 bg-gray-50/30">
          <div className="p-6 border-b bg-white/50 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-center">
            <Skeleton width={200} height={28} />
            <Skeleton width={180} height={32} />
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="relative flex flex-col justify-between h-48 p-5 rounded-2xl border-2 bg-white">
                  <div className="space-y-1">
                    <Skeleton width={"60%"} height={20} />
                    <Skeleton width={"40%"} height={16} />
                  </div>
                  <div className="flex justify-between items-end mt-4">
                    <Skeleton width={100} height={24} />
                    <Skeleton width={40} height={40} circle />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="w-[400px] bg-white border-l flex flex-col">
          <div className="p-6 border-b bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2.5 rounded-xl">
                <Skeleton width={24} height={24} />
              </div>
              <div>
                <Skeleton width={120} height={20} />
                <Skeleton width={180} height={14} className="mt-1" />
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3 flex items-center justify-between border rounded-lg bg-white">
                <Skeleton width={"40%"} height={18} />
                <Skeleton width={120} height={28} />
              </div>
            ))}
          </div>
          <div className="p-6 border-t bg-white">
            <Skeleton width={"100%"} height={44} />
          </div>
        </div>
      </div>
    )
  }

  const currentCategoryData = categories.find((c) => c.name === selectedCategory)
  const filteredProducts = currentCategoryData?.products || []

  if (hasError) {
    return (
      <div className="flex h-full items-center justify-center bg-white">
        <ErrorState
          title="No se pueden cargar los productos"
          description="Intenta de nuevo en unos segundos."
          onRetry={() => {
            setIsLoading(true)
            setHasError(false)
            errorToastShownRef.current = false
              // Retry fetch
              ; (async () => {
                try {
                  const data = await getCategories()
                  setCategories(data)
                  if (data.length > 0) {
                    setSelectedCategory(data[0].name)
                  }
                } catch (error) {
                  setHasError(true)
                  if (!errorToastShownRef.current) {
                    handleApiError(error, "los productos")
                    errorToastShownRef.current = true
                  }
                } finally {
                  setIsLoading(false)
                }
              })()
          }}
        />
      </div>
    )
  }

  return (
    <div className="relative flex h-full overflow-hidden bg-gray-50/50">
      {/* Mobile Layout */}
      <div className="lg:hidden flex flex-col h-full w-full">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "menu" | "cart")} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 bg-white border-b shrink-0 shadow-sm z-20 mb-2">
            <TabsList className="grid w-full grid-cols-2 h-20">
              <TabsTrigger value="menu" className="text-xl font-bold">
                Menú
              </TabsTrigger>
              <TabsTrigger value="cart" className="text-xl font-bold relative">
                Carrito
                {items.length > 0 && (
                  <span className="ml-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="menu" className="flex-1 flex flex-col overflow-hidden mt-0">
            <div className="bg-white border-b shrink-0 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 p-4 min-w-max">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.name)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                      selectedCategory === category.name
                        ? "bg-gray-900 text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-20">
                {filteredProducts.map((product) => {
                  const inCart = items.find((i) => i.id === product.id)
                  return (
                    <button
                      key={product.id}
                      onClick={() => addItem(product)}
                      className={cn(
                        "relative flex flex-col justify-between h-auto min-h-[160px] p-5 rounded-2xl border-2 text-left transition-all duration-200 group active:scale-[0.98]",
                        inCart
                          ? "border-red-500 bg-red-50/50 shadow-md"
                          : "border-transparent bg-white shadow-sm hover:border-red-200 hover:shadow-md"
                      )}
                    >
                      <div className="space-y-2">
                        <div className={cn(
                          "font-bold text-lg leading-tight transition-colors",
                          inCart ? "text-red-900" : "text-gray-900 group-hover:text-red-700"
                        )}>
                          {product.name}
                        </div>
                      </div>

                      <div className="flex justify-between items-end mt-4">
                        <span className="text-xl font-bold text-gray-900">€{product.price.toFixed(2)}</span>
                        {inCart ? (
                          <Badge className="text-base px-3 py-1 bg-red-600 text-white shadow-sm animate-in zoom-in">
                            x{inCart.quantity}
                          </Badge>
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
                            <Plus className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cart" className="flex-1 flex flex-col overflow-hidden mt-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center opacity-60">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <ShoppingCart className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-lg font-medium">El carrito está vacío</p>
                  <p className="text-sm">Selecciona productos del menú</p>
                  <Button
                    variant="link"
                    className="mt-4 text-red-600"
                    onClick={() => setActiveTab("menu")}
                  >
                    Ir al Menú
                  </Button>
                </div>
              ) : (
                items.map((item) => (
                  <Card key={item.id} className="p-4 flex items-center justify-between shadow-sm border-0 ring-1 ring-gray-100">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="font-bold text-gray-900 truncate text-lg">{item.name}</div>
                      <div className="text-sm font-medium text-gray-500">€{(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="h-11 w-11 hover:bg-white hover:shadow-sm rounded-lg"
                      >
                        <Minus className="w-5 h-5" />
                      </Button>
                      <span className="w-8 text-center font-bold text-xl tabular-nums">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="h-11 w-11 hover:bg-white hover:shadow-sm rounded-lg"
                      >
                        <Plus className="w-5 h-5" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>

            <div className="p-4 border-t bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.05)] space-y-4 z-20">
              {items.length > 0 && (
                <div className="flex justify-between items-center text-sm text-muted-foreground px-1">
                  <span>Cargo por bolsa</span>
                  <span>€0.10</span>
                </div>
              )}
              <div className="flex justify-between items-end">
                <span className="text-muted-foreground font-medium text-lg">Total</span>
                <span className="text-4xl font-black text-gray-900">€{total.toFixed(2)}</span>
              </div>
              <Button
                className="w-full h-14 text-xl font-bold shadow-lg bg-red-600 hover:bg-red-700 rounded-xl"
                disabled={items.length === 0}
                onClick={onNext}
              >
                Continuar
                <ChevronRight className="ml-2 w-6 h-6" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop Layout (Preserved) */}
      <div className="hidden lg:flex w-full h-full overflow-hidden">
        {/* 1. Left Sidebar: Categories */}
        <div className="w-72 bg-white border-r flex flex-col z-10 shadow-sm">
          <div className="p-5 border-b">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Categorías</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.name)}
                className={cn(
                  "w-full text-left px-5 py-4 rounded-xl text-lg font-medium transition-all duration-200 flex items-center justify-between group",
                  selectedCategory === category.name
                    ? "bg-red-50 text-red-900 ring-1 ring-red-200 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <span>{category.name}</span>
                {category.products && category.products.length > 0 && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "transition-colors",
                      selectedCategory === category.name
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-400 group-hover:bg-white"
                    )}
                  >
                    {category.products.length}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Center: Products Grid */}
        <div className="flex-1 flex flex-col min-w-0 bg-gray-50/30">
          <div className="p-6 border-b bg-white/50 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-center">
            <h2 className="text-3xl font-bold text-gray-900">{selectedCategory}</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
              {filteredProducts.map((product) => {
                const inCart = items.find((i) => i.id === product.id)
                return (
                  <button
                    key={product.id}
                    onClick={() => addItem(product)}
                    className={cn(
                      "relative flex flex-col justify-between h-48 p-5 rounded-2xl border-2 text-left transition-all duration-200 group active:scale-[0.98]",
                      inCart
                        ? "border-red-500 bg-red-50/50 shadow-md"
                        : "border-transparent bg-white shadow-sm hover:border-red-200 hover:shadow-md"
                    )}
                  >
                    <div className="space-y-1">
                      <div className={cn(
                        "font-bold text-xl leading-tight transition-colors",
                        inCart ? "text-red-900" : "text-gray-900 group-hover:text-red-700"
                      )}>
                        {product.name}
                      </div>
                    </div>

                    <div className="flex justify-between items-end mt-4">
                      <span className="text-2xl font-bold text-gray-900">€{product.price.toFixed(2)}</span>
                      {inCart ? (
                        <Badge className="text-lg px-3 py-1 bg-red-600 text-white shadow-sm animate-in zoom-in">
                          x{inCart.quantity}
                        </Badge>
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
                          <Plus className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* 3. Right Sidebar: Order Summary */}
        <div className="w-[400px] bg-white border-l flex flex-col shadow-xl z-20">
          <div className="p-6 border-b bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2.5 rounded-xl">
                <ShoppingCart className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Resumen</h2>
                <p className="text-xs text-muted-foreground">{items.length} productos seleccionados</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center opacity-60">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <ShoppingCart className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-lg font-medium">El carrito está vacío</p>
                <p className="text-sm">Selecciona productos del menú</p>
              </div>
            ) : (
              items.map((item) => (
                <Card key={item.id} className="p-3 flex items-center justify-between shadow-sm border-0 ring-1 ring-gray-100">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="font-bold text-gray-900 truncate text-base">{item.name}</div>
                    <div className="text-sm font-medium text-gray-500">€{(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => updateQuantity(item.id, -1)}
                      className="h-11 w-11 hover:bg-white hover:shadow-sm rounded-md"
                    >
                      <Minus className="w-5 h-5" />
                    </Button>
                    <span className="w-8 text-center font-bold text-lg tabular-nums">{item.quantity}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => updateQuantity(item.id, 1)}
                      className="h-11 w-11 hover:bg-white hover:shadow-sm rounded-md"
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>

          <div className="p-6 border-t bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.05)] space-y-4">
            {items.length > 0 && (
              <div className="flex justify-between items-center text-sm text-muted-foreground px-1">
                <span>Cargo por bolsa</span>
                <span>€0.10</span>
              </div>
            )}
            <div className="flex justify-between items-end">
              <span className="text-muted-foreground font-medium text-lg">Total</span>
              <span className="text-4xl font-black text-gray-900">€{total.toFixed(2)}</span>
            </div>
            <Button
              className="w-full h-16 text-xl font-bold shadow-lg bg-red-600 hover:bg-red-700 hover:scale-[1.02] transition-all rounded-xl"
              disabled={items.length === 0}
              onClick={onNext}
            >
              Continuar
              <ChevronRight className="ml-2 w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
