import { useEffect, useRef, useState, useCallback } from 'react'
import { getAdminMenu, createCategory as apiCreateCategory, createProduct as apiCreateProduct, updateProduct as apiUpdateProduct, deleteProduct as apiDeleteProduct, updateProductActive as apiUpdateProductActive } from '@/services'
import type { Category, Product } from '@/types'
import { handleApiError } from '@/utils/handleApiError'
import { useNotifications } from '@/hooks/use-notifications'

export function useMenuManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const errorToastShownRef = useRef(false)

  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showEditProduct, setShowEditProduct] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)

  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productName, setProductName] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await getAdminMenu()
      setCategories(data)
      if (selectedCategory) {
        const updatedCategory = data.find((c) => c.id === selectedCategory.id)
        if (updatedCategory) {
          setSelectedCategory(updatedCategory)
        } else if (data.length > 0) {
          setSelectedCategory(data[0])
        }
      } else if (data.length > 0) {
        setSelectedCategory(data[0])
      }
      setHasError(false)
      errorToastShownRef.current = false
    } catch (error) {
      setHasError(true)
      if (!errorToastShownRef.current) {
        handleApiError(error, 'los productos')
        errorToastShownRef.current = true
      }
    } finally {
      setIsLoading(false)
    }
  }, [selectedCategory])

  useEffect(() => {
    fetchData()
  }, [])

  useNotifications({ onProductsUpdated: fetchData })

  const resetError = () => {
    setHasError(false)
    errorToastShownRef.current = false
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName) return
    try {
      await apiCreateCategory(newCategoryName)
      await fetchData()
      setNewCategoryName('')
      setShowAddCategory(false)
    } catch (error) {
      handleApiError(error, 'la categoría')
    }
  }

  const handleCreateProduct = async () => {
    if (!productName || !productPrice || !selectedCategory) return
    try {
      await apiCreateProduct({ name: productName, price: parseFloat(productPrice), categoryId: selectedCategory.id })
      await fetchData()
      setProductName('')
      setProductPrice('')
      setShowAddProduct(false)
    } catch (error) {
      handleApiError(error, 'el producto')
    }
  }

  const handleUpdateProduct = async () => {
    if (!editingProduct || !productName || !productPrice) return
    try {
      await apiUpdateProduct(editingProduct.id, { name: productName, price: parseFloat(productPrice) })
      await fetchData()
      setEditingProduct(null)
      setProductName('')
      setProductPrice('')
      setShowEditProduct(false)
    } catch (error) {
      handleApiError(error, 'el producto')
    }
  }

  const toggleProductEnabled = async (product: Product) => {
    try {
      await apiUpdateProductActive(product.id, !product.active)
      await fetchData()
    } catch (error) {
      handleApiError(error, 'el producto')
    }
  }

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return
    try {
      await apiDeleteProduct(productId)
      await fetchData()
    } catch (error) {
      handleApiError(error, 'el producto')
    }
  }

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setProductName(product.name)
    setProductPrice(product.price.toString())
    setShowEditProduct(true)
  }

  const products = selectedCategory?.products || []
  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))

  return {
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
    editingProduct,
    setEditingProduct,
    productName,
    setProductName,
    productPrice,
    setProductPrice,
    newCategoryName,
    setNewCategoryName,
    searchQuery,
    setSearchQuery,
    handleCreateCategory,
    handleCreateProduct,
    handleUpdateProduct,
    toggleProductEnabled,
    handleDeleteProduct,
    openEditModal,
    products,
    filteredProducts,
  }
}

