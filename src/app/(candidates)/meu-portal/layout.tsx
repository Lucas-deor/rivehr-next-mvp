import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { CandidateHeader } from '@/components/candidates/Header'

export default async function CandidatePortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const candidateToken = cookieStore.get('candidate_token')

  if (!candidateToken) {
    redirect('/candidato/login')
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <CandidateHeader />
      <main className="container mx-auto py-8 px-4">
        {children}
      </main>
    </div>
  )
}
