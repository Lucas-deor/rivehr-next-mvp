'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Loader2, CheckCircle } from 'lucide-react'
import { buildTenantPath } from '@/lib/tenant-utils'
import { createJobAction } from '@/app/actions/jobs'
import { BasicInfoStep } from '@/components/jobs/wizard/BasicInfoStep'
import { DescriptionStep } from '@/components/jobs/wizard/DescriptionStep'
import { RequirementsStep } from '@/components/jobs/wizard/RequirementsStep'
import { BenefitsStep } from '@/components/jobs/wizard/BenefitsStep'
import { PipelineStep } from '@/components/jobs/wizard/PipelineStep'
import { ReviewStep } from '@/components/jobs/wizard/ReviewStep'
import { cn } from '@/lib/utils'

import type { WizardData, WizardStage, LookupData } from '@/types/wizard'

// Re-export for convenience
export type { WizardData, WizardStage, LookupData }

// ---------------------------------------------------------------------------
// Step config
// ---------------------------------------------------------------------------

const STEPS = [
  { id: 1, label: 'Básico', shortLabel: '1' },
  { id: 2, label: 'Descrição', shortLabel: '2' },
  { id: 3, label: 'Requisitos', shortLabel: '3' },
  { id: 4, label: 'Benefícios', shortLabel: '4' },
  { id: 5, label: 'Pipeline', shortLabel: '5' },
  { id: 6, label: 'Revisão', shortLabel: '6' },
]

const DEFAULT_STAGES: WizardStage[] = [
  { id: 'default-1', name: 'Aplicou', color: '#6366f1', position: 0 },
  { id: 'default-2', name: 'Triagem', color: '#f59e0b', position: 1 },
  { id: 'default-3', name: 'Entrevista', color: '#3b82f6', position: 2 },
  { id: 'default-4', name: 'Proposta', color: '#10b981', position: 3 },
  { id: 'default-5', name: 'Contratado', color: '#14b8a6', position: 4 },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CreateJobWizardProps {
  tenantSlug: string
  lookups: LookupData
}

export function CreateJobWizard({ tenantSlug, lookups }: CreateJobWizardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<WizardData>({
    title: '',
    job_type: 'generic',
    publish_company: true,
    publish_salary: false,
    salary_currency: 'BRL',
    stages: DEFAULT_STAGES,
  })

  function handleChange(fields: Partial<WizardData>) {
    setData((prev) => ({ ...prev, ...fields }))
  }

  function next() {
    if (currentStep < STEPS.length) setCurrentStep((s) => s + 1)
  }

  function prev() {
    if (currentStep > 1) setCurrentStep((s) => s - 1)
  }

  function canGoNext(): boolean {
    if (currentStep === 1) return data.title.trim().length > 0
    return true
  }

  async function handleSubmit() {
    if (!data.title.trim()) {
      toast.error('Título da vaga é obrigatório')
      setCurrentStep(1)
      return
    }

    startTransition(async () => {
      const result = await createJobAction({
        ...data,
        stages: data.stages.map((s) => ({
          name: s.name,
          color: s.color,
          position: s.position,
        })),
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Vaga criada como rascunho!')
      router.push(buildTenantPath(tenantSlug, `/vagas/detalhes/${result.data!.jobId}`))
    })
  }

  const isLastStep = currentStep === STEPS.length

  return (
    <div className="flex flex-col h-full">
      {/* Step indicator */}
      <div className="px-6 py-4 border-b bg-muted/30">
        <ol className="flex items-center gap-1 flex-wrap">
          {STEPS.map((step, idx) => {
            const isDone = currentStep > step.id
            const isActive = currentStep === step.id
            return (
              <li key={step.id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    // Allow going back to any completed step
                    if (step.id < currentStep) setCurrentStep(step.id)
                  }}
                  disabled={step.id > currentStep}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                    isActive && 'bg-primary text-primary-foreground',
                    isDone && 'bg-primary/20 text-primary cursor-pointer hover:bg-primary/30',
                    !isActive && !isDone && 'text-muted-foreground opacity-50 cursor-default'
                  )}
                >
                  {isDone ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <span className="h-4 w-4 rounded-full border flex items-center justify-center text-[10px]">
                      {step.shortLabel}
                    </span>
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                </button>
                {idx < STEPS.length - 1 && (
                  <span className="text-muted-foreground/40 text-xs">›</span>
                )}
              </li>
            )
          })}
        </ol>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto p-6">
        {currentStep === 1 && (
          <BasicInfoStep data={data} onChange={handleChange} lookups={lookups} />
        )}
        {currentStep === 2 && <DescriptionStep data={data} onChange={handleChange} />}
        {currentStep === 3 && <RequirementsStep data={data} onChange={handleChange} />}
        {currentStep === 4 && <BenefitsStep data={data} onChange={handleChange} />}
        {currentStep === 5 && <PipelineStep data={data} onChange={handleChange} />}
        {currentStep === 6 && <ReviewStep data={data} />}
      </div>

      {/* Footer navigation */}
      <div className="px-6 py-4 border-t bg-background flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={prev}
          disabled={currentStep === 1 || isPending}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar
        </Button>

        {isLastStep ? (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !data.title.trim()}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando vaga...
              </>
            ) : (
              'Criar vaga como rascunho'
            )}
          </Button>
        ) : (
          <Button type="button" onClick={next} disabled={!canGoNext()}>
            Próximo
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  )
}
