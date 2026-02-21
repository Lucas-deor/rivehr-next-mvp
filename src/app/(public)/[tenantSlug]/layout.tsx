import Link from 'next/link'

interface PublicLayoutProps {
  children: React.ReactNode
  params: Promise<{ tenantSlug: string }>
}

export default async function PublicLayout({
  children,
  params,
}: PublicLayoutProps) {
  const { tenantSlug } = await params

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header público */}
      <header className="border-b bg-background">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href={`/${tenantSlug}/public/home`}
              className="text-xl font-bold text-primary"
            >
              RIVEHR
            </Link>
            
            <div className="flex items-center gap-6">
              <Link 
                href={`/${tenantSlug}/public/home`}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Vagas
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © 2026 RIVEHR - Powered by Deeploy
            </div>
            
            <div className="flex items-center gap-4">
              <Link 
                href={`/${tenantSlug}/public/politica-de-privacidade`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Política de Privacidade
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
