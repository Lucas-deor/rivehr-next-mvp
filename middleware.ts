import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import { jwtVerify } from 'jose'

// -----------------------------------------------
// Helper: verificar JWT (candidato ou cliente)
// -----------------------------------------------
async function verifyPortalJWT(token: string): Promise<boolean> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    await jwtVerify(token, secret)
    return true
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // -----------------------------------------------
  // 1. Portal do Candidato — JWT isolado
  // -----------------------------------------------
  if (path.startsWith('/meu-portal')) {
    const token = request.cookies.get('candidate_token')?.value
    if (!token || !(await verifyPortalJWT(token))) {
      return NextResponse.redirect(new URL('/candidato/login', request.url))
    }
    return NextResponse.next()
  }

  // -----------------------------------------------
  // 2. Portal do Cliente — JWT isolado
  // -----------------------------------------------
  if (path.startsWith('/portal-cliente')) {
    const token = request.cookies.get('client_token')?.value
    if (!token || !(await verifyPortalJWT(token))) {
      return NextResponse.redirect(new URL('/cliente/login', request.url))
    }
    return NextResponse.next()
  }

  // -----------------------------------------------
  // 3. Sistema principal — Supabase Auth
  // -----------------------------------------------
  const { supabaseResponse, user } = await updateSession(request)

  // Rotas públicas (sem proteção de autenticação)
  const publicPaths = [
    '/auth',
    '/empresas',
    '/s/',
    '/public',
    '/candidato',
    '/cliente',
  ]

  const isPublicPath = publicPaths.some(p => path.startsWith(p))

  // Rotas públicas não precisam de autenticação
  if (isPublicPath) {
    return supabaseResponse
  }

  // Extrair tenant slug da URL: /:tenantSlug/*
  const tenantSlugMatch = path.match(/^\/([^/]+)/)
  const tenantSlug = tenantSlugMatch?.[1]

  // Paths especiais que não são tenants (incluindo platform-admin)
  const specialPaths = ['unauthorized', 'api', '_next', 'favicon.ico', 'platform-admin']
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
