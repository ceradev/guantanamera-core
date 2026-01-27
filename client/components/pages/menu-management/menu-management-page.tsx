"use client"

import { Button } from "@/components/ui/buttons/button"
import { Plus } from "lucide-react"
import { ErrorState } from "@/components/states/ErrorState"
import Skeleton from "react-loading-skeleton"
import { useMenuManagement } from "@/hooks/use-menu-management"
import { CategoriesSidebar } from "@/components/pages/menu-management/components/CategoriesSidebar"
import { ProductsHeader } from "@/components/pages/menu-management/components/ProductsHeader"
import { ProductRow } from "@/components/pages/menu-management/components/ProductRow"
import { AddProductModal } from "@/components/pages/menu-management/components/AddProductModal"
import { EditProductModal } from "@/components/pages/menu-management/components/EditProductModal"
import { AddCategoryModal } from "@/components/pages/menu-management/components/AddCategoryModal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/navigation/tabs"
import React from "react"

export default function MenuManagementPage() {
  const [activeTab, setActiveTab] = React.useState<"categories" | "products">("categories")
  
  const {
    categories,
    selectedCategory,
    setSelectedCategory,
    isLoading,
    hasError,
    fetchData,
    resetError,
    showAddProduct,
    setShowAddProduct,
    showEditProduct,
    setShowEditProduct,
    showAddCategory,
    setShowAddCategory,
    productName,
    setProductName,
    productPrice,
    setProductPrice,
    newCategoryName,
    setNewCategoryName,
    handleCreateCategory,
    handleCreateProduct,
    handleUpdateProduct,
    toggleProductEnabled,
    handleDeleteProduct,
    openEditModal,
    products,
    filteredProducts,
    searchQuery,
    setSearchQuery,
  } = useMenuManagement()

  if (isLoading && !hasError) {
    return (
      <div className="relative h-full flex flex-col bg-gray-50/50">
        <header className="bg-white border-b px-8 py-6 shrink-0 flex items-center justify-between">
          <div>
            <Skeleton width={280} height={36} />
            <Skeleton width={320} height={20} className="mt-2" />
          </div>
          <div className="flex gap-4">
            <Skeleton width={180} height={48} />
            <Skeleton width={200} height={48} />
          </div>
        </header>
        <div className="flex-1 flex overflow-hidden p-6 gap-6">
          <div className="w-80 flex flex-col bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50/50">
              <Skeleton width={140} height={20} />
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-full px-4 py-4 rounded-xl">
                  <Skeleton width={"80%"} height={20} />
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 flex flex-col bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="p-6 border-b bg-gray-50/50 flex justify-between items-center">
              <Skeleton width={200} height={28} />
              <Skeleton width={120} height={24} />
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="p-5 rounded-2xl border shadow-sm">
                    <Skeleton width={"60%"} height={20} />
                    <Skeleton width={"40%"} height={20} className="mt-2" />
                    <Skeleton width={"50%"} height={28} className="mt-4" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <ErrorState
          title="No se pueden cargar los productos"
          description="Intenta de nuevo en unos segundos."
          onRetry={() => {
            resetError()
            fetchData()
          }}
        />
      </div>
    )
  }



  return (
    <div className="relative h-dvh max-h-dvh flex flex-col bg-gray-50/50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b px-4 md:px-8 py-4 md:py-6 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Menú / Carta</h1>
          <p className="text-muted-foreground mt-1 text-base md:text-lg">Gestiona categorías y productos</p>
        </div>
        <div className="hidden md:flex gap-3 md:gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowAddCategory(true)}
            className="h-12 px-4 md:px-6 text-sm md:text-base font-medium border-2"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nueva Categoría
          </Button>
          <Button
            size="lg"
            onClick={() => {
              setProductName("")
              setProductPrice("")
              setShowAddProduct(true)
            }}
            disabled={!selectedCategory}
            className="h-12 px-4 md:px-6 text-sm md:text-base font-bold shadow-md bg-red-600 hover:bg-red-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Producto
          </Button>
        </div>
      </header>

      {/* Mobile Tabs Navigation */}
      <div className="lg:hidden flex-1 overflow-hidden flex flex-col">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "categories" | "products")} className="flex-1 flex flex-col h-full">
          <div className="p-4 md:p-6 pb-0 shrink-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="categories" className="text-sm md:text-base">
                Categorías ({categories.length})
              </TabsTrigger>
              <TabsTrigger value="products" className="text-sm md:text-base" disabled={!selectedCategory}>
                Productos ({filteredProducts.length})
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="categories" className="flex-1 overflow-hidden flex flex-col p-4 md:p-6 pt-2">
            <div className="flex flex-col h-full space-y-4 min-h-0">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowAddCategory(true)}
                className="w-full h-12 shrink-0 text-sm md:text-base font-medium border-2 mt-6"
              >
                <Plus className="w-5 h-5 mr-2" />
                Nueva Categoría
              </Button>
              <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-white rounded-2xl border shadow-sm">
                <CategoriesSidebar categories={categories} selectedCategory={selectedCategory} onSelect={setSelectedCategory} isLoading={isLoading} />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="products" className="flex-1 overflow-hidden flex flex-col p-4 md:p-6 pt-2">
            {selectedCategory ? (
              <div className="flex flex-col h-full space-y-4 min-h-0">
                <div className="flex gap-3 shrink-0">
                  <Button
                    size="lg"
                    onClick={() => {
                      setProductName("")
                      setProductPrice("")
                      setShowAddProduct(true)
                    }}
                    disabled={!selectedCategory}
                    className="flex-1 h-12 text-sm md:text-base font-bold shadow-md bg-red-600 hover:bg-red-700 mt-6"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Nuevo Producto
                  </Button>
                </div>
                
                <div className="shrink-0">
                  <ProductsHeader 
                    category={selectedCategory} 
                    count={filteredProducts.length} 
                  />
                </div>
                
                <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pb-4 custom-scrollbar">
                  {filteredProducts.map((product) => (
                    <ProductRow key={product.id} product={product} onToggle={toggleProductEnabled} onEdit={openEditModal} onDelete={handleDeleteProduct} />
                  ))}
                  
                  {filteredProducts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm md:text-base">No hay productos en esta categoría</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <p className="text-sm md:text-base">Selecciona una categoría para ver productos</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex flex-1 overflow-hidden p-6 gap-6">
        <CategoriesSidebar categories={categories} selectedCategory={selectedCategory} onSelect={setSelectedCategory} isLoading={isLoading} />


        <div className="flex-1 flex flex-col bg-white rounded-2xl border shadow-sm overflow-hidden">
          {selectedCategory ? (
            <>
              <ProductsHeader category={selectedCategory} count={filteredProducts.length} />

              <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                {products.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Plus className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-lg font-medium">Esta categoría está vacía</p>
                    <p className="text-sm mt-1">Añade el primer producto para comenzar</p>
                    <Button
                      variant="link"
                      className="mt-4 text-red-600"
                      onClick={() => {
                        setProductName("")
                        setProductPrice("")
                        setShowAddProduct(true)
                      }}
                    >
                      Añadir Producto a {selectedCategory.name}
                    </Button>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <p className="text-lg font-medium">No hay resultados</p>
                    <p className="text-sm mt-1">Ajusta tu búsqueda para ver productos</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredProducts.map((product) => (
                      <ProductRow key={product.id} product={product} onToggle={toggleProductEnabled} onEdit={openEditModal} onDelete={handleDeleteProduct} />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <p>Selecciona una categoría para ver sus productos</p>
            </div>
          )}
        </div>
      </div>

      <AddProductModal open={showAddProduct} categoryName={selectedCategory?.name} productName={productName} productPrice={productPrice} onProductNameChange={setProductName} onProductPriceChange={setProductPrice} onClose={() => setShowAddProduct(false)} onSave={handleCreateProduct} disabled={!productName || !productPrice} />

      <EditProductModal open={showEditProduct} productName={productName} productPrice={productPrice} onProductNameChange={setProductName} onProductPriceChange={setProductPrice} onClose={() => setShowEditProduct(false)} onSave={handleUpdateProduct} disabled={!productName || !productPrice} />

      <AddCategoryModal open={showAddCategory} newCategoryName={newCategoryName} onNewCategoryNameChange={setNewCategoryName} onClose={() => setShowAddCategory(false)} onSave={handleCreateCategory} disabled={!newCategoryName} />
    </div>
  )
}
