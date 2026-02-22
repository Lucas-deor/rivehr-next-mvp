'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { WizardData } from '@/types/wizard'

interface ReviewStepProps {
  data: WizardData
}

function Field({ label, value }: { label: string; value?: string | null | boolean | number }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{String(value)}</p>
    </div>
  )
}

function HtmlPreview({ label, html }: { label: string; html?: string | null }) {
  if (!html) return null
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div
        className="prose prose-sm dark:prose-invert border rounded-md px-3 py-2 text-sm bg-muted/30 max-h-40 overflow-y-auto"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}

export function ReviewStep({ data }: ReviewStepProps) {
  const hasDescription = !!data.description
  const hasRequirements = !!data.requirements

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4 space-y-3">
        <p className="text-sm font-semibold">Informações básicas</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Título" value={data.title} />
          <Field label="Tipo" value={data.job_type === 'ux' ? 'UX / Design' : 'Genérica'} />
          <Field label="Setor" value={data.sector} />
          <Field label="Senioridade" value={data.seniority} />
          <Field label="Modelo de trabalho" value={data.work_model} />
          <Field label="Tipo de contrato" value={data.contract_type} />
          <Field label="Cidade" value={data.city} />
          <Field label="País" value={data.country} />
          <Field label="Prazo de contratação" value={data.hiring_deadline} />
        </div>
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <p className="text-sm font-semibold">Conteúdo</p>
        {!hasDescription && (
          <p className="text-xs text-muted-foreground italic">Nenhuma descrição adicionada.</p>
        )}
        <HtmlPreview label="Descrição" html={data.description} />
        <HtmlPreview label="Atividades" html={data.activities} />
        {!hasRequirements && (
          <p className="text-xs text-amber-600 dark:text-amber-400 text-sm">
            ⚠️ Nenhum requisito adicionado.
          </p>
        )}
        <HtmlPreview label="Requisitos" html={data.requirements} />
        <HtmlPreview label="Benefícios" html={data.benefits} />
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <p className="text-sm font-semibold">Salário</p>
        {data.salary_min || data.salary_max ? (
          <div className="flex items-center gap-2">
            <span className="text-sm">
              {data.salary_currency ?? 'BRL'}{' '}
              {data.salary_min?.toLocaleString('pt-BR')} –{' '}
              {data.salary_max?.toLocaleString('pt-BR')}
            </span>
            {data.publish_salary && <Badge variant="secondary">Público</Badge>}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">Não informado</p>
        )}
        <Field
          label="Exibir empresa"
          value={data.publish_company ? 'Sim' : 'Confidencial'}
        />
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <p className="text-sm font-semibold">Pipeline ({data.stages.length} etapas)</p>
        <div className="flex flex-wrap gap-2">
          {data.stages.map((s) => (
            <div key={s.id} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-sm">{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={cn(
        'rounded-lg border p-3 text-sm',
        !data.title
          ? 'border-destructive/50 bg-destructive/5 text-destructive'
          : 'border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-400'
      )}>
        {!data.title
          ? '❌ Título da vaga é obrigatório antes de criar.'
          : '✅ Tudo certo! A vaga será criada como rascunho.'}
      </div>
    </div>
  )
}
