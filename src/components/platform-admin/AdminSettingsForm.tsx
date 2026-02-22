'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { promoteToMasterAdminAction } from '@/app/actions/platform-admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { UserMinus, UserPlus, Loader2, ShieldCheck } from 'lucide-react'

interface AdminUser {
  user_id: string
  email: string | null
}

interface AdminSettingsFormProps {
  admins: AdminUser[]
}

export function AdminSettingsForm({ admins }: AdminSettingsFormProps) {
  const [isPending, startTransition] = useTransition()
  const [searchEmail, setSearchEmail] = useState('')
  const [searchUserId, setSearchUserId] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)

  async function handleSearchUser() {
    if (!searchEmail.trim()) return
    setSearching(true)
    // TODO: integrar com RPC master_admin_search_user_by_email quando disponível
    // Por ora exibe instrução para usar o user_id diretamente
    setSearching(false)
    toast.info('Use o user_id diretamente no campo abaixo para promover um usuário.')
  }

  function handlePromote(userId: string) {
    startTransition(async () => {
      const result = await promoteToMasterAdminAction(userId, true) as { success?: boolean; error?: string }
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Usuário promovido a ultra_master_admin')
      }
    })
  }

  function handleRevoke(userId: string) {
    startTransition(async () => {
      const result = await promoteToMasterAdminAction(userId, false) as { success?: boolean; error?: string }
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Permissão de admin revogada')
      }
    })
  }

  function handlePromoteById() {
    if (!searchUserId?.trim()) {
      toast.error('Informe o user_id')
      return
    }
    handlePromote(searchUserId.trim())
    setSearchUserId(null)
    setSearchEmail('')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Admins atuais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Administradores Ativos
          </CardTitle>
          <CardDescription>
            Usuários com permissão de ultra_master_admin
          </CardDescription>
        </CardHeader>
        <CardContent>
          {admins.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum administrador encontrado.</p>
          ) : (
            <div className="space-y-3">
              {admins.map((admin) => (
                <div key={admin.user_id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{admin.email ?? 'Email não disponível'}</p>
                    <p className="text-xs text-muted-foreground font-mono">{admin.user_id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">ultra_master_admin</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      title="Revogar permissão"
                      onClick={() => handleRevoke(admin.user_id)}
                      disabled={isPending}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Promover novo admin */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Promover Novo Admin
          </CardTitle>
          <CardDescription>
            Insira o user_id do Supabase Auth para promover a ultra_master_admin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search-email">Buscar por email (auxiliar)</Label>
            <div className="flex gap-2">
              <Input
                id="search-email"
                type="email"
                placeholder="usuario@exemplo.com"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={handleSearchUser}
                disabled={searching || !searchEmail.trim()}
              >
                {searching && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Buscar
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-id">User ID (Supabase)</Label>
            <div className="flex gap-2">
              <Input
                id="user-id"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={searchUserId ?? ''}
                onChange={(e) => setSearchUserId(e.target.value)}
                className="font-mono text-sm"
              />
              <Button
                onClick={handlePromoteById}
                disabled={isPending || !searchUserId?.trim()}
              >
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Promover
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
