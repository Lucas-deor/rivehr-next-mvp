import { headers } from 'next/headers'

/**
 * Get tenant context from middleware-injected headers
 * 
 * This function should only be used in Server Components and Server Actions.
 * The middleware injects tenant information into request headers after validating
 * that the user has access to the tenant.
 * 
 * @throws {Error} If tenant context is not found (middleware not configured properly)
 * @returns {Promise<TenantContext>} Tenant context with ID, slug, user ID, and role
 * 
 * @example
 * ```tsx
 * // In a Server Component
 * export default async function TenantPage() {
 *   const { tenantId, tenantSlug } = await getTenantContext()
 *   return <div>Welcome to {tenantSlug}</div>
 * }
 * ```
 */
export async function getTenantContext() {
  const headersList = await headers()
  
  const tenantId = headersList.get('x-tenant-id')
  const tenantSlug = headersList.get('x-tenant-slug')
  const userId = headersList.get('x-user-id')
  const userRole = headersList.get('x-user-role') as 'owner' | 'admin' | 'member' | 'viewer' | null
  
  if (!tenantId || !tenantSlug || !userId) {
    throw new Error('Tenant context not found. Make sure middleware is configured and user has access to this tenant.')
  }
  
  return {
    tenantId,
    tenantSlug,
    userId,
    userRole,
  }
}

/**
 * Build a tenant-aware path
 * 
 * @param tenantSlug - The tenant slug
 * @param path - The path within the tenant (should start with /)
 * @returns {string} Full tenant path
 * 
 * @example
 * ```tsx
 * buildTenantPath('acme-corp', '/vagas') // => '/acme-corp/vagas'
 * buildTenantPath('acme-corp', '/candidatos/123') // => '/acme-corp/candidatos/123'
 * ```
 */
export function buildTenantPath(tenantSlug: string, path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `/${tenantSlug}${normalizedPath}`
}

/**
 * Check if user has one of the allowed roles
 * 
 * Note: This is a basic helper for FASE3. More granular permission
 * checking will be implemented in FASE4.
 * 
 * @param userRole - The user's role in the organization
 * @param allowedRoles - Array of roles that are allowed
 * @returns {boolean} True if user has one of the allowed roles
 * 
 * @example
 * ```tsx
 * const { userRole } = await getTenantContext()
 * if (!hasRole(userRole, ['owner', 'admin'])) {
 *   return <div>Access denied</div>
 * }
 * ```
 */
export function hasRole(
  userRole: string | null,
  allowedRoles: ('owner' | 'admin' | 'member' | 'viewer')[]
): boolean {
  if (!userRole) return false
  return allowedRoles.includes(userRole as any)
}

export type TenantContext = {
  tenantId: string
  tenantSlug: string
  userId: string
  userRole: 'owner' | 'admin' | 'member' | 'viewer' | null
}
