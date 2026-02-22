import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ClientHeader } from '@/components/clients/Header'

export default async function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const clientToken = cookieStore.get('client_token')

  if (!clientToken) {
    redirect('/cliente/login')
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <ClientHeader />
      <main className="container mx-auto py-8 px-4">
        {children}
      </main>
    </div>
  )
}
