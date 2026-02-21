'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

const emailSchema = z.object({
  email: z.string().email('Email inválido'),
})

const otpSchema = z.object({
  otp: z.string().length(6, 'Código deve ter 6 dígitos').regex(/^\d+$/, 'Apenas números'),
})

type EmailFormData = z.infer<typeof emailSchema>
type OTPFormData = z.infer<typeof otpSchema>

interface AuthFormProps {
  redirectTo?: string
}

export function AuthForm({ redirectTo }: AuthFormProps) {
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  })
  
  const otpForm = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
  })
  
  const onSendOTP = async (data: EmailFormData) => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar código')
      }
      
      setEmail(data.email)
      setStep('otp')
      toast.success('Código enviado para seu email!')
    } catch (error) {
      console.error(error)
      const message = error instanceof Error ? error.message : 'Erro ao enviar código. Tente novamente.'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const onVerifyOTP = async (data: OTPFormData) => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: data.otp }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Código inválido')
      }
      
      toast.success('Login realizado com sucesso!')
      
      // Redirecionar
      const destination = redirectTo || '/dashboard'
      router.push(destination)
      router.refresh()
    } catch (error) {
      console.error(error)
      const message = error instanceof Error ? error.message : 'Código inválido. Tente novamente.'
      toast.error(message)
      otpForm.reset()
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (step === 'otp') {
    return (
      <div className="border rounded-lg p-8 bg-card shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Digite o código</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Enviamos um código de 6 dígitos para <strong>{email}</strong>
        </p>
        
        <form onSubmit={otpForm.handleSubmit(onVerifyOTP)} className="space-y-4">
          <div>
            <Label htmlFor="otp">Código</Label>
            <Input
              id="otp"
              {...otpForm.register('otp')}
              placeholder="000000"
              maxLength={6}
              autoFocus
              className="text-center text-2xl tracking-widest"
            />
            {otpForm.formState.errors.otp && (
              <p className="text-sm text-destructive mt-1">
                {otpForm.formState.errors.otp.message}
              </p>
            )}
          </div>
          
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Verificando...' : 'Verificar Código'}
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => {
              setStep('email')
              otpForm.reset()
            }}
            disabled={isSubmitting}
          >
            Usar outro email
          </Button>
        </form>
      </div>
    )
  }
  
  return (
    <div className="border rounded-lg p-8 bg-card shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Digite seu email</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Enviaremos um código de verificação para seu email
      </p>
      
      <form onSubmit={emailForm.handleSubmit(onSendOTP)} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...emailForm.register('email')}
            placeholder="voce@empresa.com"
            autoFocus
          />
          {emailForm.formState.errors.email && (
            <p className="text-sm text-destructive mt-1">
              {emailForm.formState.errors.email.message}
            </p>
          )}
        </div>
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando...' : 'Enviar Código'}
        </Button>
      </form>
    </div>
  )
}
