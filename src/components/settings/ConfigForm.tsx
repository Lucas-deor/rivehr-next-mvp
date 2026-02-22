'use client'

import { useState, useTransition, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileUpload } from '@/components/upload/FileUpload'
import { updateOrganizationAction } from '@/app/actions/organizations'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'

interface ConfigFormProps {
  tenantId: string
  initialName: string
  initialLogoUrl?: string | null
  tenantSlug: string
}

export function ConfigForm({
  tenantId,
  initialName,
  initialLogoUrl,
  tenantSlug,
}: ConfigFormProps) {
  const [name, setName] = useState(initialName)
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl ?? null)
  const [isPending, startTransition] = useTransition()

  const handleLogoUpload = useCallback(
    async (file: File) => {
      const supabase = createClient()
      const path = `logos/${tenantId}/${file.name}`
      const { error } = await supabase.storage.from('org-assets').upload(path, file, {
        upsert: true,
        contentType: file.type,
      })
      if (error) throw new Error(error.message)

      const { data } = supabase.storage.from('org-assets').getPublicUrl(path)
      setLogoUrl(data.publicUrl)
      toast.success('Logo enviado')
    },
    [tenantId]
  )

  function handleSave() {
    startTransition(async () => {
      const result = await updateOrganizationAction({
        name: name.trim() || undefined,
        logo_url: logoUrl ?? undefined,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Configurações salvas')
      }
    })
  }

  return (
    <div className="max-w-lg space-y-6">
      {/* Org name */}
      <div className="space-y-1.5">
        <Label htmlFor="org-name">Nome da organização</Label>
        <Input
          id="org-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome da empresa"
        />
      </div>

      {/* Logo */}
      <div className="space-y-1.5">
        <Label>Logo</Label>
        <p className="text-xs text-muted-foreground">
          Formatos: PNG, JPG, SVG. Máx 2MB. Aparece no sidebar e portais públicos.
        </p>
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt="Logo atual"
            className="h-16 w-auto rounded-md border object-contain bg-muted p-1"
          />
        )}
        <FileUpload
          accept="image"
          maxSizeMB={2}
          onUpload={handleLogoUpload}
          label="Arraste o logo ou clique para selecionar"
        />
      </div>

      <Button onClick={handleSave} disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Salvar configurações
          </>
        )}
      </Button>
    </div>
  )
}
