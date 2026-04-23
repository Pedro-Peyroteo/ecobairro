import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Leaf, Recycle, MapPin, BarChart3, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
})

const schema = z.object({
  email: z.string().min(1, 'O email é obrigatório').email('Introduz um email válido'),
})

type FormData = z.infer<typeof schema>

function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async () => {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    // Simulate sending email
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <div className="flex min-h-svh">
      {/* Left panel — illustration */}
      <div className="relative hidden md:flex flex-1 flex-col items-center justify-center bg-primary/5 dark:bg-primary/10 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/10 dark:bg-primary/5" />
        <div className="absolute -bottom-24 -right-20 w-80 h-80 rounded-full bg-primary/10 dark:bg-primary/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5" />

        <div className="relative z-10 flex flex-col items-center gap-8 px-12 max-w-md text-center">
          <div className="relative flex items-center justify-center w-52 h-52">
            <div className="absolute inset-0 rounded-full bg-primary/10 dark:bg-primary/15 animate-pulse" />
            <div className="relative flex items-center justify-center w-36 h-36 rounded-full bg-primary/20 dark:bg-primary/25">
              <Leaf className="w-20 h-20 text-primary" />
            </div>
            <div className="absolute top-2 right-0 flex items-center justify-center w-12 h-12 rounded-xl bg-background shadow-lg border border-border">
              <Recycle className="w-6 h-6 text-primary" />
            </div>
            <div className="absolute bottom-2 left-0 flex items-center justify-center w-12 h-12 rounded-xl bg-background shadow-lg border border-border">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div className="absolute top-1/2 -right-2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-xl bg-background shadow-lg border border-border">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-foreground">Recuperação de Conta</h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              Não perca o acesso à plataforma inovadora de gestão de resíduos da sua cidade.
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      </div>

      {/* Right panel — form */}
      <div className="relative flex flex-col justify-center w-full md:w-[480px] bg-[var(--background)] px-8 py-12 md:px-12">
        {/* Logo */}
        <div className="absolute top-6 left-8 md:left-12 flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <Leaf className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-base tracking-tight">ecoBairro</span>
        </div>

        <div className="flex flex-col gap-6 w-full max-w-sm mx-auto">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Esqueceu-se da password? </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Introduza o seu email e enviar-lhe-emos as instruções para redefinir a sua password.
            </p>
          </div>

          {submitted ? (
            <div className="rounded-lg bg-primary/10 p-4 text-center">
              <p className="text-sm font-medium text-foreground">
                Email enviado com sucesso! Verifique a sua caixa de entrada.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@exemplo.pt"
                  autoComplete="email"
                  autoFocus
                  className={cn(errors.email && 'border-destructive focus-visible:ring-destructive')}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'A enviar...' : 'Enviar link de recuperação'}
              </Button>
            </form>
          )}

          <div className="text-center mt-2">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm text-primary hover:underline underline-offset-4 font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao login
            </Link>
          </div>
        </div>

        <p className="absolute bottom-6 left-0 right-0 text-center text-xs text-muted-foreground">
          ecoBairro &copy; {new Date().getFullYear()} &mdash; Gestão de Resíduos Urbanos
        </p>
      </div>
    </div>
  )
}
