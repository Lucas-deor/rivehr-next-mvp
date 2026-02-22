'use client'

import { useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { UploadCloud, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react'

export type UploadAccept = 'pdf' | 'image' | 'any'

interface FileUploadProps {
  accept?: UploadAccept
  maxSizeMB?: number
  onUpload: (file: File) => Promise<void>
  currentUrl?: string | null
  className?: string
  label?: string
}

const ACCEPT_MAP: Record<UploadAccept, string> = {
  pdf: '.pdf,application/pdf',
  image: 'image/*',
  any: '*',
}

const MIME_LABELS: Record<UploadAccept, string> = {
  pdf: 'PDF',
  image: 'JPG, PNG, SVG',
  any: 'qualquer arquivo',
}

export function FileUpload({
  accept = 'any',
  maxSizeMB = 5,
  onUpload,
  currentUrl,
  className,
  label = 'Arraste um arquivo ou clique para selecionar',
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewName, setPreviewName] = useState<string | null>(null)

  const maxBytes = maxSizeMB * 1024 * 1024

  const handleFile = useCallback(
    async (file: File) => {
      setError(null)
      if (file.size > maxBytes) {
        setError(`Arquivo muito grande. Máximo: ${maxSizeMB}MB`)
        return
      }
      setPreviewName(file.name)
      setIsUploading(true)
      try {
        await onUpload(file)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao fazer upload')
        setPreviewName(null)
      } finally {
        setIsUploading(false)
      }
    },
    [maxBytes, maxSizeMB, onUpload]
  )

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDraggingOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const showPreview = previewName || currentUrl

  return (
    <div className={cn('space-y-2', className)}>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true) }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors',
          isDraggingOver
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-muted-foreground hover:bg-muted/30'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_MAP[accept]}
          className="hidden"
          onChange={handleChange}
        />

        {isUploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : accept === 'image' ? (
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        ) : (
          <UploadCloud className="h-8 w-8 text-muted-foreground" />
        )}

        <div className="text-center">
          <p className="text-sm font-medium">{isUploading ? 'Enviando...' : label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {MIME_LABELS[accept]} · Máx {maxSizeMB}MB
          </p>
        </div>
      </div>

      {/* Current file / preview */}
      {showPreview && !isUploading && (
        <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm bg-muted/30">
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="flex-1 truncate text-xs">{previewName ?? currentUrl}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground"
            onClick={(e) => {
              e.stopPropagation()
              setPreviewName(null)
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
