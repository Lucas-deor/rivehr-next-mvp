'use client'

import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileUpload } from '@/components/upload/FileUpload'
import { useAutosave } from '@/hooks/use-autosave'
import { updateMemberAction, appendMemberNoteAction, uploadResumeAction } from '@/app/actions/members'
import type { JobCandidate } from '@/types/pipeline'
import { toast } from 'sonner'
import {
  MapPin,
  Mail,
  Linkedin,
  Clock,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Send,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LanguageEntry, MemberUpdateInput } from '@/app/actions/members'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MemberFields {
  name: string
  role: string
  seniority: string
  city: string
  country: string
  email: string
  linkedin_url: string
  availability: string
  job_type: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

function SaveIndicator({ status }: { status: ReturnType<typeof useAutosave>['status'] }) {
  if (status === 'idle') return null
  if (status === 'saving') {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Salvando...
      </span>
    )
  }
  if (status === 'saved') {
    return (
      <span className="flex items-center gap-1 text-xs text-green-600">
        <CheckCircle className="h-3 w-3" />
        Salvo
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-xs text-destructive">
      <AlertCircle className="h-3 w-3" />
      Erro ao salvar
    </span>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface CandidateProfileModalProps {
  candidate: JobCandidate | null
  open: boolean
  onClose: () => void
  currentUserName?: string
}

export function CandidateProfileModal({
  candidate,
  open,
  onClose,
  currentUserName = 'Recrutador',
}: CandidateProfileModalProps) {
  const member = candidate?.member
  const memberId = member?.id ?? ''

  const [fields, setFields] = useState<MemberFields>({
    name: member?.name ?? '',
    role: member?.role ?? '',
    seniority: member?.seniority ?? '',
    city: member?.city ?? '',
    country: member?.country ?? '',
    email: '',
    linkedin_url: '',
    availability: member?.availability ?? '',
    job_type: '',
  })

  const [noteInput, setNoteInput] = useState('')
  const [isSubmittingNote, setIsSubmittingNote] = useState(false)
  const [resumeUrl, setResumeUrl] = useState<string | null>(null)

  // Reset fields when candidate changes
  const resetFields = useCallback(() => {
    setFields({
      name: member?.name ?? '',
      role: member?.role ?? '',
      seniority: member?.seniority ?? '',
      city: member?.city ?? '',
      country: member?.country ?? '',
      email: '',
      linkedin_url: '',
      availability: member?.availability ?? '',
      job_type: '',
    })
    setNoteInput('')
    setResumeUrl(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidate?.id])

  // Auto-save member fields
  const saveFn = useCallback(
    async (currentFields: MemberFields) => {
      if (!memberId) return
      const input: MemberUpdateInput = {}
      if (currentFields.name) input.name = currentFields.name
      if (currentFields.role !== undefined) input.role = currentFields.role
      if (currentFields.seniority !== undefined) input.seniority = currentFields.seniority
      if (currentFields.city !== undefined) input.city = currentFields.city
      if (currentFields.country !== undefined) input.country = currentFields.country
      if (currentFields.email !== undefined) input.email = currentFields.email
      if (currentFields.linkedin_url !== undefined) input.linkedin_url = currentFields.linkedin_url
      if (currentFields.availability !== undefined) input.availability = currentFields.availability
      if (currentFields.job_type !== undefined) input.job_type = currentFields.job_type

      const result = await updateMemberAction(memberId, input)
      if (result.error) throw new Error(result.error)
    },
    [memberId]
  )

  const { status: saveStatus } = useAutosave({ value: fields, saveFn, delay: 1500 })

  function handleFieldChange(key: keyof MemberFields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  async function handleAddNote() {
    if (!noteInput.trim() || !memberId) return
    setIsSubmittingNote(true)
    try {
      const result = await appendMemberNoteAction(memberId, noteInput, currentUserName)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Nota adicionada')
        setNoteInput('')
      }
    } finally {
      setIsSubmittingNote(false)
    }
  }

  async function handleResumeUpload(file: File) {
    if (!memberId) return
    const reader = new FileReader()
    const base64 = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    const result = await uploadResumeAction(memberId, file.name, base64, file.type)
    if (result.error) {
      throw new Error(result.error)
    } else {
      setResumeUrl(result.data?.resumeUrl ?? null)
      toast.success('Currículo enviado')
    }
  }

  if (!candidate || !member) return null

  const initials = member.name ? getInitials(member.name) : '?'

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col gap-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={member.avatar_url ?? undefined} alt={member.name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-lg font-semibold leading-tight">
                  {member.name}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {member.role && (
                    <span className="text-sm text-muted-foreground">{member.role}</span>
                  )}
                  {member.seniority && (
                    <Badge variant="secondary" className="text-xs">
                      {member.seniority}
                    </Badge>
                  )}
                  {member.city && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {member.city}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <SaveIndicator status={saveStatus} />
          </div>
        </DialogHeader>

        {/* Two-column body */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left column */}
          <ScrollArea className="flex-1 border-r">
            <div className="p-6 space-y-6">
              <Section title="Informações pessoais">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <Label>Nome completo</Label>
                    <Input
                      value={fields.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      placeholder="Nome"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        className="pl-8"
                        value={fields.email}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        placeholder="email@exemplo.com"
                        type="email"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>LinkedIn</Label>
                    <div className="relative">
                      <Linkedin className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        className="pl-8"
                        value={fields.linkedin_url}
                        onChange={(e) => handleFieldChange('linkedin_url', e.target.value)}
                        placeholder="linkedin.com/in/..."
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Cidade</Label>
                    <Input
                      value={fields.city}
                      onChange={(e) => handleFieldChange('city', e.target.value)}
                      placeholder="São Paulo"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>País</Label>
                    <Input
                      value={fields.country}
                      onChange={(e) => handleFieldChange('country', e.target.value)}
                      placeholder="Brasil"
                    />
                  </div>
                </div>
              </Section>

              <Separator />

              <Section title="Currículo">
                <FileUpload
                  accept="pdf"
                  maxSizeMB={10}
                  onUpload={handleResumeUpload}
                  currentUrl={resumeUrl}
                  label="Arraste o currículo (PDF) ou clique para selecionar"
                />
              </Section>

              <Separator />

              <Section title="Notas">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Textarea
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="Adicione uma observação sobre este candidato..."
                      className="min-h-[80px] resize-none text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault()
                          handleAddNote()
                        }
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddNote}
                    disabled={!noteInput.trim() || isSubmittingNote}
                  >
                    {isSubmittingNote ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Adicionar nota
                  </Button>
                </div>
              </Section>
            </div>
          </ScrollArea>

          {/* Right column */}
          <ScrollArea className="w-72 shrink-0">
            <div className="p-6 space-y-6">
              <Section title="Perfil profissional">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Cargo / Especialidade</Label>
                    <Input
                      value={fields.role}
                      onChange={(e) => handleFieldChange('role', e.target.value)}
                      placeholder="Ex: UX Designer"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Senioridade</Label>
                    <Select
                      value={fields.seniority}
                      onValueChange={(v) => handleFieldChange('seniority', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {['Júnior', 'Pleno', 'Sênior', 'Especialista', 'Gerência'].map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tipo de vaga</Label>
                    <Select
                      value={fields.job_type}
                      onValueChange={(v) => handleFieldChange('job_type', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ux">UX / Design</SelectItem>
                        <SelectItem value="generic">Genérico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Disponibilidade</Label>
                    <div className="relative">
                      <Clock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Select
                        value={fields.availability}
                        onValueChange={(v) => handleFieldChange('availability', v)}
                      >
                        <SelectTrigger className="pl-8">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            'Imediata',
                            'Em 1 mês',
                            'Em 2 meses',
                            'Em 3+ meses',
                            'Apenas oportunidades certas',
                          ].map((a) => (
                            <SelectItem key={a} value={a}>
                              {a}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </Section>

              <Separator />

              {/* Skills */}
              {member.skills && member.skills.length > 0 && (
                <Section title="Habilidades">
                  <div className="flex flex-wrap gap-1.5">
                    {member.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Section helper
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  )
}
