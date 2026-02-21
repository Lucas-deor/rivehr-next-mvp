import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  
  const path = request.nextUrl.pathname
  
  // Rotas públicas (sem proteção de autenticação)
  const publicPaths = [
    '/auth',
    '/empresas',
    '/s/',
    '/public',
  ]
  
  const isPublicPath = publicPaths.some(p => path.startsWith(p))
  
  // Rotas públicas não precisam de autenticação
  if (isPublicPath) {
    return supabaseResponse
  }
  
  // Extrair tenant slug da URL: /:tenantSlug/*
  const tenantSlugMatch = path.match(/^\/([^/]+)/)
  const tenantSlug = tenantSlugMatch?.[1]
  
  // Paths especiais que não são tenants
  const specialPaths = ['unauthorized', 'api', '_next', 'favicon.ico']
  const isSpecialPath = specialPaths.includes(tenantSlug || '')
  
  // Se é rota protegida (não pública e não especial), exigir autenticação
  if (!isPublicPath && !isSpecialPath) {
    if (!user) {
      const redirectUrl = new URL('/auth', request.url)
      redirectUrl.searchParams.set('redirect', path)
      return NextResponse.redirect(redirectUrl)
    }
    
    // Validar tenant (se temos um tenantSlug válido)
    if (tenantSlug) {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll() {},
          },
        }
      )
      
      // Verificar se usuário pertence ao tenant
      const { data: orgUser, error } = await supabase
        .from('organization_users')
        .select('organization_id, role, organizations!inner(slug)')
        .eq('user_id', user.id)
        .eq('organizations.slug', tenantSlug)
        .single()
      
      if (error || !orgUser) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
      
      // Injetar tenant info nos headers para uso em Server Components
      const response = NextResponse.next({
        request: {
          headers: new Headers(request.headers),
        },
      })
      
      response.headers.set('x-tenant-id', orgUser.organization_id)
      response.headers.set('x-tenant-slug', tenantSlug)
      response.headers.set('x-user-id', user.id)
      response.headers.set('x-user-role', orgUser.role)
      
      return response
    }
  }
  
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
