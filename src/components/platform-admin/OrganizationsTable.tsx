'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  toggleOrgActiveAction,
  deleteOrgAction,
  createOrgAction,
} from '@/app/actions/platform-admin'
import { toSlug } from '@/lib/slug-utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Power, Trash2, Loader2 } from 'lucide-react'

interface OrgRow {
  id: string
  name: string
  slug: string
  is_active: boolean
  disabled_at: string | null
  created_at: string
  users_count: number
}

interface OrganizationsTableProps {
  organizations: OrgRow[]
}

export function OrganizationsTable({ organizations }: OrganizationsTableProps) {
  const [isPending, startTransition] = useTransition()
  const [deleteTarget, setDeleteTarget] = useState<OrgRow | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')

  function handleNameChange(value: string) {
    setNewName(value)
    setNewSlug(toSlug(value))
  }

  function handleToggleActive(org: OrgRow) {
    startTransition(async () => {
      const result = await toggleOrgActiveAction(org.id, !org.is_active)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(org.is_active ? 'Organização desativada' : 'Organização ativada')
      }
    })
  }

  function handleDelete(org: OrgRow) {
    setDeleteTarget(org)
  }

  function confirmDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteOrgAction(deleteTarget.id)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Organização removida')
      }
      setDeleteTarget(null)
    })
  }

  function handleCreate() {
    if (!newName.trim() || !newSlug.trim()) {
      toast.error('Nome e slug são obrigatórios')
      return
    }
    startTransition(async () => {
      const result = await createOrgAction(newName.trim(), newSlug.trim())
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Organização criada com sucesso!')
        setCreateOpen(false)
        setNewName('')
        setNewSlug('')
      }
    })
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Organização
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Organização</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar um novo tenant na plataforma.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="org-name">Nome</Label>
                <Input
                  id="org-name"
                  placeholder="Nome da organização"
                  value={newName}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-slug">Slug (URL)</Label>
                <Input
                  id="org-slug"
                  placeholder="slug-da-org"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  URL de acesso: /{newSlug || 'slug'}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Usuários</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                  Nenhuma organização encontrada.
                </TableCell>
              </TableRow>
            ) : (
              organizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{org.slug}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant={org.is_active ? 'default' : 'secondary'}>
                      {org.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{org.users_count}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(org.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={isPending}
                        onClick={() => handleToggleActive(org)}
                        title={org.is_active ? 'Desativar' : 'Ativar'}
                      >
                        <Power className={`h-4 w-4 ${org.is_active ? 'text-green-500' : 'text-muted-foreground'}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        disabled={isPending}
                        onClick={() => handleDelete(org)}
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* AlertDialog de confirmação de exclusão */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover organização</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desativar <strong>{deleteTarget?.name}</strong>? Esta
              ação irá bloquear o acesso de todos os usuários do tenant.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={isPending}
            >
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
