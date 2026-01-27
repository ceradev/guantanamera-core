import { Button } from "@/components/ui/buttons/button"

interface ErrorStateProps {
  title: string
  description?: string
  onRetry?: () => void
}

export function ErrorState({ title, description, onRetry }: ErrorStateProps) {
  return (
    <div className="grid min-h-screen place-items-center p-8">
      <div className="text-center flex flex-col items-center space-y-6">
        <span className="text-5xl">⚠️</span>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {description && <p className="text-base text-gray-500">{description}</p>}
        {onRetry && (
          <Button onClick={onRetry} className="mt-2 bg-red-600 hover:bg-red-700 text-white">
            Reintentar
          </Button>
        )}
      </div>
    </div>
  )
}
