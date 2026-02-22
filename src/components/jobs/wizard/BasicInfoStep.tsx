'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { WizardData, LookupData } from '@/types/wizard'

interface BasicInfoStepProps {
  data: WizardData
  onChange: (fields: Partial<WizardData>) => void
  lookups: LookupData
}

export function BasicInfoStep({ data, onChange, lookups }: BasicInfoStepProps) {
  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title">
          Título da vaga <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="Ex: UX Designer Sênior"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          autoFocus
        />
      </div>

      {/* Job type */}
      <div className="space-y-1.5">
        <Label>
          Tipo de vaga <span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-3">
          {(['ux', 'generic'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onChange({ job_type: t })}
              className={`flex-1 rounded-lg border px-4 py-3 text-sm transition-colors ${
                data.job_type === t
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border hover:border-muted-foreground'
              }`}
            >
              {t === 'ux' ? '🎨 UX / Design' : '⚙️ Genérica'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Sector */}
        <div className="space-y-1.5">
          <Label htmlFor="sector">Setor</Label>
          <Input
            id="sector"
            placeholder="Ex: Tecnologia, Saúde..."
            value={data.sector ?? ''}
            onChange={(e) => onChange({ sector: e.target.value })}
          />
        </div>

        {/* Company */}
        <div className="space-y-1.5">
          <Label>Empresa</Label>
          <Select
            value={data.company_id ?? ''}
            onValueChange={(v) => onChange({ company_id: v || undefined })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {lookups.companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Seniority */}
        <div className="space-y-1.5">
          <Label>Senioridade</Label>
          <Select
            value={data.seniority ?? ''}
            onValueChange={(v) => onChange({ seniority: v || undefined })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {lookups.seniorities.length > 0
                ? lookups.seniorities.map((s) => (
                    <SelectItem key={s.id} value={s.name}>
                      {s.name}
                    </SelectItem>
                  ))
                : ['Júnior', 'Pleno', 'Sênior', 'Especialista', 'Gerência'].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>
        </div>

        {/* Work model */}
        <div className="space-y-1.5">
          <Label>Modelo de trabalho</Label>
          <Select
            value={data.work_model ?? ''}
            onValueChange={(v) => onChange({ work_model: v || undefined })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {['Remoto', 'Presencial', 'Híbrido'].map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* City */}
        <div className="space-y-1.5">
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            placeholder="Ex: São Paulo"
            value={data.city ?? ''}
            onChange={(e) => onChange({ city: e.target.value })}
          />
        </div>

        {/* Country */}
        <div className="space-y-1.5">
          <Label htmlFor="country">País</Label>
          <Input
            id="country"
            placeholder="Brasil"
            value={data.country ?? 'Brasil'}
            onChange={(e) => onChange({ country: e.target.value })}
          />
        </div>

        {/* Contract type */}
        <div className="space-y-1.5">
          <Label>Tipo de contrato</Label>
          <Select
            value={data.contract_type ?? ''}
            onValueChange={(v) => onChange({ contract_type: v || undefined })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {['CLT', 'PJ', 'Freelance', 'Estágio', 'Temporário'].map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Hiring deadline */}
        <div className="space-y-1.5">
          <Label htmlFor="hiring_deadline">Prazo de contratação</Label>
          <Input
            id="hiring_deadline"
            type="date"
            value={data.hiring_deadline ?? ''}
            onChange={(e) => onChange({ hiring_deadline: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}
