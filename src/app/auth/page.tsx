import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth/AuthForm'

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Se já está autenticado, redirecionar
  if (user) {
    const redirectTo = params.redirect || '/dashboard'
    redirect(redirectTo)
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">RIVEHR</h1>
          <p className="text-muted-foreground mt-2">
            Faça login para continuar
          </p>
        </div>
        
        <AuthForm redirectTo={params.redirect} />
      </div>
    </div>
  )
}
