'use client'

import { useRef, useState, useTransition } from 'react'
import { updateJobTitleAction } from '@/app/actions/jobs'
import { toast } from 'sonner'
import { Pencil, Check, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface JobTitleEditProps {
  jobId: string
  initialTitle: string
  className?: string
}

export function JobTitleEdit({ jobId, initialTitle, className }: JobTitleEditProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(initialTitle)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setIsEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  function cancel() {
    setValue(initialTitle)
    setIsEditing(false)
  }

  function save() {
    if (!value.trim()) {
      toast.error('Título não pode ser vazio')
      return
    }
    startTransition(async () => {
      const result = await updateJobTitleAction(jobId, value)
      if (result.error) {
        toast.error(result.error)
        setValue(initialTitle)
      } else {
        toast.success('Título atualizado')
      }
      setIsEditing(false)
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') cancel()
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={save}
          disabled={isPending}
          className={cn(
            'text-xl font-bold bg-transparent border-b-2 border-primary outline-none flex-1',
            'focus:border-primary disabled:opacity-60',
            className
          )}
          aria-label="Editar título"
          autoFocus
        />
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <>
            <button
              type="button"
              onClick={save}
              className="text-green-600 hover:text-green-700"
              aria-label="Salvar"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={cancel}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Cancelar"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="group flex items-center gap-2">
      <h1 className={cn('text-xl font-bold leading-tight', className)}>{value}</h1>
      <button
        type="button"
        onClick={startEdit}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
        aria-label="Editar título"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
