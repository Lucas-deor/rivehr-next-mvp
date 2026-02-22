'use client'

import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import type { WizardData } from '@/types/wizard'

interface RequirementsStepProps {
  data: WizardData
  onChange: (fields: Partial<WizardData>) => void
}

export function RequirementsStep({ data, onChange }: RequirementsStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label>
          Requisitos <span className="text-destructive">*</span>
        </Label>
        <p className="text-xs text-muted-foreground">
          Liste as habilidades, ferramentas e experiências necessárias.
        </p>
        <RichTextEditor
          value={data.requirements ?? ''}
          onChange={(html) => onChange({ requirements: html })}
          placeholder="Ex: 3+ anos com Figma, experiência com pesquisa de usuário..."
          minHeight="300px"
        />
      </div>
    </div>
  )
}
