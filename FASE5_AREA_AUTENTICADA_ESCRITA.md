# Fase 5: Área Autenticada - Escrita

**Duração Estimada**: 3-4 semanas  
**Prioridade**: 🔥 CRÍTICA  
**Status**: ⏳ Pendente

---

## 🎯 Objetivo

Migrar formulários complexos (CriarVaga.tsx com 2800+ linhas), file uploads, rich text editor e configurações usando **Server Actions** e **Next.js Forms**.

---

## 📋 Tarefas

### 1. Refatorar CriarVaga.tsx em Componentes Menores [ ]

**Referência**: `src/pages/CriarVaga.tsx` (2800+ linhas)  
**Estratégia**: Dividir wizard em **steps separados** como Client Components

**Arquivo**: `src/app/(authenticated)/[tenantSlug]/vagas/criar-vaga/page.tsx`

```tsx
import { CreateJobWizard } from '@/components/jobs/CreateJobWizard'

export default function CriarVagaPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Criar Nova Vaga</h1>
        <p className="text-muted-foreground">
          Preencha os dados da vaga e publique
        </p>
      </div>
      
      <CreateJobWizard />
    </div>
  )
}
```

**Checklist**:
- [ ] Criar pasta `src/components/jobs/wizard/`
- [ ] Dividir em 6 steps (BasicInfo, Description, Requirements, Benefits, Pipeline, Review)

---

### 2. Criar Wizard Container [ ]

**Arquivo**: `src/components/jobs/CreateJobWizard.tsx`

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { BasicInfoStep } from './wizard/BasicInfoStep'
import { DescriptionStep } from './wizard/DescriptionStep'
import { RequirementsStep } from './wizard/RequirementsStep'
import { BenefitsStep } from './wizard/BenefitsStep'
import { PipelineStep } from './wizard/PipelineStep'
import { ReviewStep } from './wizard/ReviewStep'
import { createJobAction } from '@/app/actions/jobs'
import { toast } from 'sonner'

const STEPS = [
  { id: 1, name: 'Informações Básicas', Component: BasicInfoStep },
  { id: 2, name: 'Descrição', Component: DescriptionStep },
  { id: 3, name: 'Requisitos', Component: RequirementsStep },
  { id: 4, name: 'Benefícios', Component: BenefitsStep },
  { id: 5, name: 'Pipeline', Component: PipelineStep },
  { id: 6, name: 'Revisar', Component: ReviewStep },
]

export function CreateJobWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<any>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  
  const progress = (currentStep / STEPS.length) * 100
  
  const handleNext = (data: any) => {
    setFormData((prev: any) => ({ ...prev, ...data }))
    if (currentStep < STEPS.length) {
      setCurrentStep((prev) => prev + 1)
    }
  }
  
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }
  
  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const result = await createJobAction(formData)
      if (result.success) {
        toast.success('Vaga criada com sucesso!')
        router.push(`/vagas/detalhes/${result.jobId}`)
      } else {
        toast.error(result.error || 'Erro ao criar vaga')
      }
    } catch (error) {
      console.error(error)
      toast.error('Erro ao criar vaga')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const CurrentStepComponent = STEPS[currentStep - 1].Component
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Progress value={progress} className="mb-2" />
        <p className="text-sm text-muted-foreground">
          Passo {currentStep} de {STEPS.length}: {STEPS[currentStep - 1].name}
        </p>
      </div>
      
      <Card className="p-6">
        <CurrentStepComponent
          data={formData}
          onNext={handleNext}
          onBack={handleBack}
          onSubmit={handleSubmit}
          isLastStep={currentStep === STEPS.length}
          isSubmitting={isSubmitting}
        />
      </Card>
    </div>
  )
}
```

**Checklist**:
- [ ] Criar wizard container
- [ ] Gerenciar estado entre steps
- [ ] Progress bar
- [ ] Navegação entre steps

---

### 3. Criar Step 1: Informações Básicas [ ]

**Arquivo**: `src/components/jobs/wizard/BasicInfoStep.tsx`

```tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

const schema = z.object({
  title: z.string().min(5, 'Título deve ter pelo menos 5 caracteres'),
  company_id: z.string().min(1, 'Selecione um cliente'),
  contract_type_id: z.string().min(1, 'Selecione o tipo de contrato'),
  seniority_level_id: z.string().min(1, 'Selecione a senioridade'),
  work_model_id: z.string().min(1, 'Selecione o modelo de trabalho'),
  location: z.string().optional(),
  salary_range: z.string().optional(),
})

export function BasicInfoStep({ data, onNext }: any) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: data,
  })
  
  const onSubmit = (values: any) => {
    onNext(values)
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título da Vaga *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Desenvolvedor Full Stack" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="company_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {/* Buscar companies do servidor via Server Action */}
                  <SelectItem value="1">Empresa A</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Outros campos: contract_type, seniority, work_model, location, salary */}
        
        <div className="flex justify-end">
          <Button type="submit">Próximo</Button>
        </div>
      </form>
    </Form>
  )
}
```

**Checklist**:
- [ ] Criar todos os 6 steps
- [ ] Validação com Zod
- [ ] React Hook Form
- [ ] Server Actions para buscar select options

---

### 4. Criar Step 2: Rich Text Editor (Descrição) [ ]

**Arquivo**: `src/components/jobs/wizard/DescriptionStep.tsx`

```tsx
'use client'

import { useForm } from 'react-hook-form'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { Button } from '@/components/ui/button'

export function DescriptionStep({ data, onNext, onBack }: any) {
  const form = useForm({
    defaultValues: {
      description: data.description || '',
    },
  })
  
  const onSubmit = (values: any) => {
    onNext(values)
  }
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">
          Descrição da Vaga *
        </label>
        <RichTextEditor
          content={form.watch('description')}
          onChange={(html) => form.setValue('description', html)}
        />
      </div>
      
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Voltar
        </Button>
        <Button type="submit">Próximo</Button>
      </div>
    </form>
  )
}
```

**Checklist**:
- [ ] Criar `RichTextEditor` com TipTap
- [ ] Sanitizar HTML no backend (XSS protection)

---

### 5. Criar Rich Text Editor [ ]

**Arquivo**: `src/components/editor/RichTextEditor.tsx`

```tsx
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { Button } from '@/components/ui/button'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
} from 'lucide-react'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })
  
  if (!editor) {
    return null
  }
  
  return (
    <div className="border rounded-lg">
      <div className="border-b p-2 flex gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-accent' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-accent' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-accent' : ''}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-accent' : ''}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
      </div>
      
      <EditorContent
        editor={editor}
        className="prose max-w-none p-4 min-h-[300px]"
      />
    </div>
  )
}
```

**Checklist**:
- [ ] Instalar `@tiptap/react` e `@tiptap/starter-kit`
- [ ] Toolbar com formatação
- [ ] Preservar estilos

---

### 6. Criar Server Action para Criar Vaga [ ]

**Arquivo**: `src/app/actions/jobs.ts`

```tsx
'use server'

import { createClient } from '@/lib/supabase/server'
import { getTenantContext } from '@/lib/tenant'
import { revalidatePath } from 'next/cache'
import DOMPurify from 'isomorphic-dompurify'

export async function createJobAction(data: any) {
  const supabase = await createClient()
  const { tenantId } = await getTenantContext()
  
  // Sanitizar HTML (XSS protection)
  const cleanDescription = DOMPurify.sanitize(data.description)
  
  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      ...data,
      description: cleanDescription,
      organization_id: tenantId,
    })
    .select()
    .single()
  
  if (error) {
    console.error(error)
    return { success: false, error: error.message }
  }
  
  // Criar pipeline stages padrão
  const stages = [
    { name: 'Novos', order: 0 },
    { name: 'Triagem', order: 1 },
    { name: 'Entrevista', order: 2 },
    { name: 'Aprovado', order: 3 },
    { name: 'Contratado', order: 4 },
  ]
  
  await supabase.from('pipeline_stages').insert(
    stages.map((stage) => ({
      ...stage,
      job_id: job.id,
      organization_id: tenantId,
    }))
  )
  
  revalidatePath('/vagas/ver-vagas')
  
  return { success: true, jobId: job.id }
}
```

**Checklist**:
- [ ] Criar `actions/jobs.ts`
- [ ] Sanitizar HTML com DOMPurify
- [ ] Criar pipeline stages padrão
- [ ] Revalidar cache

---

### 7. File Upload com Validação [ ]

**Arquivo**: `src/components/upload/FileUpload.tsx`

```tsx
'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { Upload, X } from 'lucide-react'

interface FileUploadProps {
  bucket: string
  path: string
  accept?: string
  maxSize?: number // MB
  onUploadComplete: (url: string) => void
}

export function FileUpload({
  bucket,
  path,
  accept = '.pdf,.doc,.docx',
  maxSize = 5,
  onUploadComplete,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    
    // Validar tamanho
    if (selectedFile.size > maxSize * 1024 * 1024) {
      toast.error(`Arquivo deve ter no máximo ${maxSize}MB`)
      return
    }
    
    setFile(selectedFile)
  }
  
  const handleUpload = async () => {
    if (!file) return
    
    setUploading(true)
    setProgress(0)
    
    const fileName = `${Date.now()}-${file.name}`
    const filePath = `${path}/${fileName}`
    
    const { error, data } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })
    
    if (error) {
      console.error(error)
      toast.error('Erro ao fazer upload')
      setUploading(false)
      return
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)
    
    setProgress(100)
    setUploading(false)
    onUploadComplete(publicUrl)
    toast.success('Upload concluído!')
  }
  
  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="font-medium mb-2">
          Clique para selecionar arquivo
        </p>
        <p className="text-sm text-muted-foreground">
          {accept} até {maxSize}MB
        </p>
      </div>
      
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      
      {file && (
        <div className="flex items-center gap-4 p-4 border rounded-lg">
          <div className="flex-1">
            <p className="font-medium">{file.name}</p>
            <p className="text-sm text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFile(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {uploading && <Progress value={progress} />}
      
      {file && !uploading && (
        <Button onClick={handleUpload} className="w-full">
          Fazer Upload
        </Button>
      )}
    </div>
  )
}
```

**Checklist**:
- [ ] Validação de tipo e tamanho
- [ ] Progress bar
- [ ] Upload para Supabase Storage
- [ ] Retornar URL pública

---

### 8. Autosave para Rascunhos [ ]

**Arquivo**: `src/hooks/use-autosave.ts`

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { useDebounce } from './use-debounce'
import { toast } from 'sonner'

interface UseAutosaveOptions {
  data: any
  onSave: (data: any) => Promise<void>
  interval?: number
}

export function useAutosave({ data, onSave, interval = 3000 }: UseAutosaveOptions) {
  const debouncedData = useDebounce(data, interval)
  const isFirstRun = useRef(true)
  
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    
    const save = async () => {
      try {
        await onSave(debouncedData)
        console.log('Rascunho salvo')
      } catch (error) {
        console.error('Erro ao salvar rascunho', error)
      }
    }
    
    save()
  }, [debouncedData, onSave])
}
```

**Arquivo**: `src/hooks/use-debounce.ts`

```tsx
'use client'

import { useEffect, useState } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])
  
  return debouncedValue
}
```

**Checklist**:
- [ ] Implementar autosave com debounce
- [ ] Salvar rascunho a cada 3 segundos
- [ ] Indicador visual de salvamento

---

### 9. Migrar Página de Configurações [ ]

**Arquivo**: `src/app/(authenticated)/[tenantSlug]/configuracoes/page.tsx`

```tsx
import { createClient } from '@/lib/supabase/server'
import { getTenantContext } from '@/lib/tenant'
import { ConfigForm } from '@/components/settings/ConfigForm'

export default async function ConfiguracoesPage() {
  const { tenantId } = await getTenantContext()
  const supabase = await createClient()
  
  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', tenantId)
    .single()
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Configurações</h1>
      <ConfigForm initialData={organization} />
    </div>
  )
}
```

**Checklist**:
- [ ] Criar página de configurações
- [ ] Formulário com Server Actions
- [ ] Upload de logo

---

### 10. Adicionar Optimistic Updates [ ]

**Exemplo**: Atualizar job title inline

**Arquivo**: `src/components/jobs/JobTitleEdit.tsx`

```tsx
'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { updateJobTitleAction } from '@/app/actions/jobs'

export function JobTitleEdit({ jobId, initialTitle }: any) {
  const [title, setTitle] = useState(initialTitle)
  const [isEditing, setIsEditing] = useState(false)
  const router = useRouter()
  
  const handleSave = async () => {
    // Optimistic update
    setIsEditing(false)
    
    const result = await updateJobTitleAction(jobId, title)
    
    if (!result.success) {
      // Revert
      setTitle(initialTitle)
    } else {
      router.refresh()
    }
  }
  
  return isEditing ? (
    <Input
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onBlur={handleSave}
      onKeyDown={(e) => e.key === 'Enter' && handleSave()}
      autoFocus
    />
  ) : (
    <h1 onClick={() => setIsEditing(true)} className="cursor-pointer">
      {title}
    </h1>
  )
}
```

**Checklist**:
- [ ] Implementar edição inline
- [ ] Optimistic updates
- [ ] Revert on error

---

## ✅ Critérios de Verificação

- [ ] Wizard de criação de vaga funciona
- [ ] Rich text editor permite formatação
- [ ] File upload funciona (PDF, DOCX)
- [ ] Autosave funciona
- [ ] Validação de formulários funciona
- [ ] Server Actions retornam erros corretos
- [ ] HTML é sanitizado (XSS protection)

---

## 🎯 Próxima Fase

**Fase 6: Admin Panel** (2 semanas)
