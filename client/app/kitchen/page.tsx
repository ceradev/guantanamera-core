"use client"

import { useRouter } from "next/navigation"
import KitchenPageContent from "@/components/pages/kitchen/kitchen-page"

export default function KitchenRoute() {
  const router = useRouter()

  return <KitchenPageContent onExit={() => router.push("/")} />
}
