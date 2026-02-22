'use client'

import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import type { WizardData } from '@/types/wizard'

interface DescriptionStepProps {
  data: WizardData
  onChange: (fields: Partial<WizardData>) => void
}

export function DescriptionStep({ data, onChange }: DescriptionStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label>
          Descrição da vaga <span className="text-destructive">*</span>
        </Label>
        <p className="text-xs text-muted-foreground">
          Descreva o contexto da vaga, o time e o momento da empresa.
        </p>
        <RichTextEditor
          value={data.description ?? ''}
          onChange={(html) => onChange({ description: html })}
          placeholder="Escreva sobre o contexto da vaga e da empresa..."
          minHeight="200px"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Atividades e responsabilidades</Label>
        <p className="text-xs text-muted-foreground">
          Descreva o que a pessoa fará no dia a dia.
        </p>
        <RichTextEditor
          value={data.activities ?? ''}
          onChange={(html) => onChange({ activities: html })}
          placeholder="Liste as principais responsabilidades e atividades..."
          minHeight="160px"
        />
      </div>
    </div>
  )
}
