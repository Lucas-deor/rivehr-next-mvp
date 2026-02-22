'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import type { WizardData } from '@/types/wizard'

interface BenefitsStepProps {
  data: WizardData
  onChange: (fields: Partial<WizardData>) => void
}

export function BenefitsStep({ data, onChange }: BenefitsStepProps) {
  return (
    <div className="space-y-6">
      {/* Benefits rich text */}
      <div className="space-y-1.5">
        <Label>Benefícios</Label>
        <p className="text-xs text-muted-foreground">
          Descreva os benefícios e diferenciais oferecidos.
        </p>
        <RichTextEditor
          value={data.benefits ?? ''}
          onChange={(html) => onChange({ benefits: html })}
          placeholder="Ex: Vale refeição, plano de saúde, home office, stock options..."
          minHeight="180px"
        />
      </div>

      {/* Salary section */}
      <div className="rounded-lg border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Faixa salarial</p>
            <p className="text-xs text-muted-foreground">Opcional — não será exibida publicamente por padrão</p>
          </div>
          <Switch
            checked={data.publish_salary ?? false}
            onCheckedChange={(v) => onChange({ publish_salary: v })}
            aria-label="Publicar salário"
          />
        </div>
        {data.publish_salary && (
          <p className="text-xs text-primary">A faixa salarial será exibida na vaga pública.</p>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="salary_min">Mínimo</Label>
            <Input
              id="salary_min"
              type="number"
              placeholder="5000"
              value={data.salary_min?.toString() ?? ''}
              onChange={(e) =>
                onChange({ salary_min: e.target.value ? Number(e.target.value) : undefined })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="salary_max">Máximo</Label>
            <Input
              id="salary_max"
              type="number"
              placeholder="10000"
              value={data.salary_max?.toString() ?? ''}
              onChange={(e) =>
                onChange({ salary_max: e.target.value ? Number(e.target.value) : undefined })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Moeda</Label>
            <Select
              value={data.salary_currency ?? 'BRL'}
              onValueChange={(v) => onChange({ salary_currency: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['BRL', 'USD', 'EUR'].map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Publish company */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="text-sm font-medium">Publicar nome da empresa</p>
          <p className="text-xs text-muted-foreground">
            Se desativado, a vaga será exibida como confidencial.
          </p>
        </div>
        <Switch
          checked={data.publish_company ?? true}
          onCheckedChange={(v) => onChange({ publish_company: v })}
          aria-label="Publicar empresa"
        />
      </div>
    </div>
  )
}
