'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { clientLoginAction, verifyClientOTPAction } from '@/app/actions/clients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, ArrowLeft } from 'lucide-react'

type Step = 'email' | 'otp'

export default function ClientLoginPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSendOTP() {
    startTransition(async () => {
      const result = await clientLoginAction(email.trim())
      if (result.success) {
        toast.success('Código enviado! Verifique seu email.')
        setStep('otp')
      } else {
        toast.error(result.error ?? 'Erro ao enviar código')
      }
    })
  }

  function handleVerifyOTP() {
    startTransition(async () => {
      const result = await verifyClientOTPAction(email.trim(), otp.trim())
      if (result.success) {
        toast.success('Login realizado com sucesso!')
        router.push('/portal-cliente')
      } else {
        toast.error(result.error ?? 'Código inválido')
      }
    })
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">RiveHR</h1>
          <p className="text-muted-foreground text-sm mt-1">Portal do Cliente</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 'email' ? 'Acessar Portal' : 'Verificar Código'}
            </CardTitle>
            <CardDescription>
              {step === 'email'
                ? 'Digite o email corporativo para receber o código de acesso.'
                : `Enviamos um código de 6 dígitos para ${email}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 'email' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email corporativo</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isPending && email && handleSendOTP()}
                    autoFocus
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleSendOTP}
                  disabled={isPending || !email.trim()}
                >
                  {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Enviar Código
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp">Código de verificação</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyDown={(e) => e.key === 'Enter' && !isPending && otp.length === 6 && handleVerifyOTP()}
                    maxLength={6}
                    className="text-center text-xl tracking-widest font-mono"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    O código expira em 10 minutos
                  </p>
                </div>
                <Button
                  className="w-full"
                  onClick={handleVerifyOTP}
                  disabled={isPending || otp.length !== 6}
                >
                  {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Verificar e Entrar
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => { setStep('email'); setOtp('') }}
                  disabled={isPending}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Usar outro email
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
