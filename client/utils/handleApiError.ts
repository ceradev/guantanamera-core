import { toast } from "@/hooks/use-toast"

export const handleApiError = (error: any, context: string) => {
  const isNetwork =
    !error ||
    error?.type === "network" ||
    (typeof error?.message === "string" &&
      (error.message.includes("Failed to fetch") ||
        error.message.toLowerCase().includes("network")))

  if (isNetwork) {
    toast({
      variant: "destructive",
      title: "Problema de conexión con el servidor.",
      description: "Revisa tu red y prueba de nuevo.",
    })
    return
  }

  const status = typeof error?.status === "number" ? error.status : undefined

  if (status && status >= 500) {
    toast({
      variant: "destructive",
      title: "Problema con el servidor.",
      description: "Inténtalo más tarde.",
    })
    return
  }

  const ctx = context.toLowerCase()

  if (ctx.includes("obtener")) {
    toast({
      variant: "destructive",
      title: `No se han podido obtener ${context}.`,
      description: "Intenta de nuevo.",
    })
    return
  }

  if (ctx.includes("crear")) {
    toast({
      variant: "destructive",
      title: `No se ha podido crear ${context}.`,
      description: "Inténtalo otra vez.",
    })
    return
  }

  if (ctx.includes("actualizar")) {
    toast({
      variant: "destructive",
      title: `No se ha podido actualizar ${context}.`,
    })
    return
  }

  if (ctx.includes("cambiar") || ctx.includes("estado")) {
    toast({
      variant: "destructive",
      title: `No se ha podido cambiar el estado de ${context}.`,
    })
    return
  }

  if (ctx.includes("cancelar")) {
    toast({
      variant: "destructive",
      title: `No se ha podido cancelar ${context}.`,
    })
    return
  }

  toast({
    variant: "destructive",
    title: "Ha ocurrido un error inesperado.",
  })
}

