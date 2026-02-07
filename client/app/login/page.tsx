'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { login } from '@/services/auth.service'
import { Button } from '@/components/ui/buttons/button'
import { Input } from '@/components/ui/inputs/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/data-display/card'
import { Label } from '@/components/ui/tipography/label'
import { Loader2, AlertCircle } from 'lucide-react'

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Contraseña requerida'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirect = searchParams.get('redirect') || '/'

    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    })

    const onSubmit = async (data: LoginFormData) => {
        setError(null)
        setIsLoading(true)

        try {
            await login(data.email, data.password)
            router.push(redirect)
            router.refresh()
        } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-red-50 to-orange-50 dark:from-neutral-950 dark:to-neutral-900 p-4">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center">
                            <span className="text-white text-2xl font-bold">G</span>
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        Guantanamera
                    </CardTitle>
                    <CardDescription>
                        Panel de gestión interno
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {error && (
                            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-lg">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="tu@email.com"
                                autoComplete="email"
                                disabled={isLoading}
                                {...register('email')}
                            />
                            {errors.email && (
                                <p className="text-sm text-red-500">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                autoComplete="current-password"
                                disabled={isLoading}
                                {...register('password')}
                            />
                            {errors.password && (
                                <p className="text-sm text-red-500">{errors.password.message}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-red-600 hover:bg-red-700"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Iniciando sesión...
                                </>
                            ) : (
                                'Iniciar sesión'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
