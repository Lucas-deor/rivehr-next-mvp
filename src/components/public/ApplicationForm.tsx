'use client'

import { useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Loader2, CheckCircle } from 'lucide-react'

interface ApplicationFormProps {
  jobId: string
  jobTitle: string
  tenantSlug: string
}

interface FormData {
  fullName: string
  email: string
  phone: string
  linkedinUrl: string
  resumeUrl: string
  message: string
  consent: boolean
}

interface FormErrors {
  fullName?: string
  email?: string
  phone?: string
  linkedinUrl?: string
  resumeUrl?: string
  consent?: string
}

export function ApplicationForm({ jobId, jobTitle, tenantSlug }: ApplicationFormProps) {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    linkedinUrl: '',
    resumeUrl: '',
    message: '',
    consent: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  
  // Honeypot field ref (anti-bot)
  const honeypotRef = useRef<HTMLInputElement>(null)
  
  // Client-side throttling
  const lastSubmitRef = useRef<number>(0)

  const validateUrl = (url: string): boolean => {
    if (!url) return true
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Nome completo é obrigatório'
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Nome deve ter pelo menos 3 caracteres'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }
    
    if (formData.phone && !/^[\d\s\-\+\(\)]{8,20}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Telefone inválido'
    }
    
    if (formData.linkedinUrl && !formData.linkedinUrl.includes('linkedin.com')) {
      newErrors.linkedinUrl = 'URL do LinkedIn inválida'
    }

    if (formData.resumeUrl && !validateUrl(formData.resumeUrl)) {
      newErrors.resumeUrl = 'URL do currículo inválida'
    }

    if (!formData.consent) {
      newErrors.consent = 'É necessário aceitar os termos para se candidatar'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Client-side throttling - minimum 3 seconds between submissions
    const now = Date.now()
    if (now - lastSubmitRef.current < 3000) {
      toast.error('Por favor, aguarde alguns segundos antes de tentar novamente.')
      return
    }
    
    if (!validateForm()) return
    
    // Check honeypot
    if (honeypotRef.current?.value) {
      // Bot detected - silently fail
      setIsSuccess(true)
      return
    }
    
    setIsSubmitting(true)
    lastSubmitRef.current = now
    
    try {
      const response = await fetch('/api/submit-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          full_name: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim() || undefined,
          linkedin_url: formData.linkedinUrl.trim() || undefined,
          resume_url: formData.resumeUrl.trim() || undefined,
          message: formData.message.trim() || undefined,
          consent: formData.consent,
          consent_version: 'v1',
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar candidatura')
      }
      
      setIsSuccess(true)
      toast.success('Candidatura enviada com sucesso!')
      
    } catch (error) {
      console.error('Error submitting application:', error)
      toast.error('Erro ao enviar candidatura. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  if (isSuccess) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-semibold">Candidatura enviada! ✅</h3>
          <p className="text-muted-foreground">
            Sua candidatura para <strong>{jobTitle}</strong> foi recebida com sucesso.
            Entraremos em contato em breve.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-8">
      <h2 className="text-2xl font-semibold mb-6">Candidate-se</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Honeypot field - hidden from users */}
        <input
          ref={honeypotRef}
          type="text"
          name="website"
          autoComplete="off"
          tabIndex={-1}
          style={{ position: 'absolute', left: '-9999px' }}
        />
        
        <div>
          <Label htmlFor="fullName">Nome Completo *</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => updateField('fullName', e.target.value)}
            placeholder="João Silva"
            disabled={isSubmitting}
          />
          {errors.fullName && (
            <p className="text-sm text-destructive mt-1">{errors.fullName}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="joao@email.com"
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="text-sm text-destructive mt-1">{errors.email}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            placeholder="(11) 99999-9999"
            disabled={isSubmitting}
          />
          {errors.phone && (
            <p className="text-sm text-destructive mt-1">{errors.phone}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="linkedinUrl">LinkedIn</Label>
          <Input
            id="linkedinUrl"
            value={formData.linkedinUrl}
            onChange={(e) => updateField('linkedinUrl', e.target.value)}
            placeholder="https://linkedin.com/in/..."
            disabled={isSubmitting}
          />
          {errors.linkedinUrl && (
            <p className="text-sm text-destructive mt-1">{errors.linkedinUrl}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="resumeUrl">Link do Currículo</Label>
          <Input
            id="resumeUrl"
            value={formData.resumeUrl}
            onChange={(e) => updateField('resumeUrl', e.target.value)}
            placeholder="https://..."
            disabled={isSubmitting}
          />
          {errors.resumeUrl && (
            <p className="text-sm text-destructive mt-1">{errors.resumeUrl}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="message">Mensagem (opcional)</Label>
          <Textarea
            id="message"
            value={formData.message}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateField('message', e.target.value)}
            placeholder="Conte-nos por que você é o candidato ideal..."
            rows={4}
            disabled={isSubmitting}
          />
        </div>
        
        <div className="flex items-start gap-2">
          <Checkbox
            id="consent"
            checked={formData.consent}
            onCheckedChange={(checked) => updateField('consent', checked as boolean)}
            disabled={isSubmitting}
          />
          <Label htmlFor="consent" className="text-sm cursor-pointer">
            Aceito os termos de uso e autorizo o tratamento dos meus dados pessoais 
            de acordo com a{' '}
            <a 
              href={`/${tenantSlug}/public/politica-de-privacidade`}
              target="_blank"
              className="text-primary hover:underline"
            >
              Política de Privacidade
            </a>
            . *
          </Label>
        </div>
        {errors.consent && (
          <p className="text-sm text-destructive">{errors.consent}</p>
        )}
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            'Enviar Candidatura'
          )}
        </Button>
      </form>
    </Card>
  )
}
