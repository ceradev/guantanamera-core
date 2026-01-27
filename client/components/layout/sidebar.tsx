"use client"

import {
  Receipt,
  Package,
  UtensilsCrossed,
  ChefHat,
  TrendingUp,
  Settings,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react"
import { useRouter } from "next/navigation"
import type { Page } from "@/app/page"
import { Badge } from "@/components/ui/data-display/badge"
import { cn } from "@/lib/utils"

interface SidebarProps {
  currentPage: Page
  onPageChange: (page: Page) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  newOrderCount?: number
}

export default function Sidebar({
  currentPage,
  onPageChange,
  isCollapsed,
  onToggleCollapse,
  newOrderCount = 0,
}: SidebarProps) {
  const router = useRouter()

  const navItems = [
    {
      id: "create-order" as Page,
      icon: Receipt,
      label: "Crear Pedido",
      description: "Nuevo ticket"
    },
    {
      id: "orders" as Page,
      icon: Package,
      label: "Pedidos",
      badge: newOrderCount,
      description: "En curso"
    },
    {
      id: "sales" as Page,
      icon: TrendingUp,
      label: "Ventas",
      description: "Análisis de ventas"
    },
    {
      id: "menu-management" as Page,
      icon: ChefHat,
      label: "Menú",
      description: "Editar carta"
    },
  ]

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity",
          isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
        onClick={onToggleCollapse}
      />

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out h-full shadow-xl lg:shadow-none",
          isCollapsed ? "-translate-x-full lg:translate-x-0 lg:w-[80px]" : "translate-x-0 w-[280px]"
        )}
      >
        {/* Header */}
        <div className={cn("p-6 border-b border-gray-100 shrink-0 flex items-center justify-between relative", isCollapsed && "px-4")}>
          <div className={cn("flex items-center gap-3 overflow-hidden transition-all", isCollapsed ? "lg:justify-center lg:w-full" : "lg:w-auto lg:opacity-100")}>
            {isCollapsed ? (
              <button
                onClick={onToggleCollapse}
                className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center shrink-0 shadow-sm hover:bg-gray-100"
                title="Expandir"
              >
                <PanelLeftOpen className="w-5 h-5 text-gray-600" />
              </button>
            ) : (
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-white font-medium text-xl">G</span>
              </div>
            )}
            {!isCollapsed && (
              <div className="flex flex-col animate-in fade-in duration-300">
                <h1 className="font-medium text-lg text-gray-900 leading-none">Guantanamera</h1>
                <span className="text-xs text-gray-500 font-medium mt-1">Dashboard</span>
              </div>
            )}
          </div>

          {/* Desktop Toggle Button */}
          {!isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors ml-auto"
              title="Colapsar"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          )}

          {/* Mobile Close Button */}
          <button
            onClick={onToggleCollapse}
            className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            const isDisabled = (item as any).disabled

            return (
              <button
                key={item.id}
                onClick={() => !isDisabled && onPageChange(item.id)}
                disabled={isDisabled}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 group relative select-none",
                  isActive
                    ? "bg-red-50 text-red-600 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  isDisabled && "opacity-50 cursor-not-allowed hover:bg-transparent",
                  isCollapsed && "lg:justify-center lg:px-2"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                {/* Active Indicator Bar (Desktop) */}
                {isActive && !isCollapsed && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-red-600 rounded-r-full" />
                )}

                <div className="relative">
                  <Icon
                    className={cn(
                      "w-6 h-6 shrink-0 transition-colors",
                      isActive ? "text-red-600" : "text-gray-500 group-hover:text-gray-700"
                    )}
                  />
                  
                  {/* Collapsed Badge Bubble - Superpuesto al icono */}
                  {isCollapsed && item.badge !== undefined && (
                    <div className="absolute -top-1.5 -right-1.5 z-50 pointer-events-none">
                      <span className={cn(
                        "flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1 text-[9px] font-medium text-white shadow-sm ring-1 ring-white transition-all",
                        item.badge > 0 ? "bg-red-600" : "bg-gray-400"
                      )}>
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    </div>
                  )}
                </div>

                {!isCollapsed && (
                  <div className="flex-1 text-left flex items-center justify-between overflow-hidden">
                    <div className="flex flex-col">
                      <span className={cn("text-base font-medium", isActive ? "text-red-700" : "text-gray-700")}>
                        {item.label}
                      </span>
                      {item.description && (
                        <span className="text-xs text-gray-400 font-medium truncate max-w-[140px]">
                          {item.description}
                        </span>
                      )}
                    </div>

                    {/* Badges & Tags */}
                    {item.badge !== undefined && item.badge > 0 && (
                      <Badge className="bg-red-600 hover:bg-red-700 text-white border-0 h-6 min-w-[24px] px-1.5 flex items-center justify-center ml-2 font-medium">
                        {item.badge > 99 ? '99+' : item.badge}
                      </Badge>
                    )}
                    {(item as any).tag && (
                      <span className="text-[10px] font-medium uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full ml-2">
                        {(item as any).tag}
                      </span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 shrink-0 space-y-1 bg-gray-50/50">
          <button
            onClick={() => onPageChange("settings")}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-3 rounded-lg text-gray-600 hover:bg-white hover:shadow-sm transition-all",
              currentPage === "settings" && "bg-white text-gray-900 shadow-sm font-medium",
              isCollapsed && "lg:justify-center lg:px-2"
            )}
            title="Configuración"
          >
            <Settings className={cn("w-5 h-5 shrink-0", isCollapsed && "w-6 h-6")} />
            {!isCollapsed && <span className="font-medium">Configuración</span>}
          </button>

          <button
            onClick={() => router.push("/kitchen")}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all",
              isCollapsed && "lg:justify-center lg:px-2"
            )}
            title="Activar Modo Cocina"
          >
            <UtensilsCrossed className={cn("w-5 h-5 shrink-0", isCollapsed && "w-6 h-6")} />
            {!isCollapsed && <span className="font-medium">Activar Modo Cocina</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Toggle Button (Visible when sidebar is hidden on mobile) */}
      <button
        onClick={onToggleCollapse}
        className={cn(
          "fixed top-4 right-4 lg:hidden z-30 bg-red-600 text-white p-3 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95",
          !isCollapsed && "hidden"
        )}
      >
        <Menu className="w-6 h-6" />
      </button>
    </>
  )
}
