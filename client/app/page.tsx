"use client"

import { useEffect, useState } from "react"
import CreateOrderPage from "@/components/pages/create-order/create-order-page"
import OrdersPage from "@/components/pages/orders/orders-page"
import SalesPage from "@/components/pages/sales/sales-page"
import ExpensesPage from "@/components/pages/expenses/expenses-page"
import MenuManagementPage from "@/components/pages/menu-management/menu-management-page"
import SettingsPage from "@/components/pages/settings/settings-page"
import Sidebar from "@/components/layout/sidebar"
import { getOrders } from "@/lib/api"
import { useNotifications } from "@/hooks/use-notifications"

export type Page = "create-order" | "orders" | "sales" | "expenses" | "menu-management" | "settings"

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState<Page>("orders")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [newOrderCount, setNewOrderCount] = useState(0)

  const updateBadge = async () => {
    try {
      const res = await getOrders(undefined, 1, 50)
      const count = res.data.filter((o: any) => ["RECEIVED", "PREPARING"].includes(o.status)).length
      setNewOrderCount(count)
    } catch { }
  }

  useEffect(() => {
    updateBadge()
  }, [])

  useNotifications({ onOrdersUpdated: updateBadge })

  const renderPage = () => {
    switch (currentPage) {
      case "create-order":
        return <CreateOrderPage onOrderCreated={() => setCurrentPage("orders")} />
      case "orders":
        return <OrdersPage onNewOrderCountChange={setNewOrderCount} />
      case "sales":
        return <SalesPage />
      case "expenses":
        return <ExpensesPage />
      case "menu-management":
        return <MenuManagementPage />
      case "settings":
        return <SettingsPage />
      default:
        return <OrdersPage onNewOrderCountChange={setNewOrderCount} />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        newOrderCount={newOrderCount}
      />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">{renderPage()}</main>
    </div>
  )
}
