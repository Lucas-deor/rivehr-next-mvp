/**
 * Build a tenant-aware path (safe for both Server and Client Components)
 */
export function buildTenantPath(tenantSlug: string, path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `/${tenantSlug}${normalizedPath}`
}

/**
 * Check if user has one of the allowed roles
 */
export function hasRole(
  userRole: string | null,
  allowedRoles: string[]
): boolean {
  if (!userRole) return false
  return allowedRoles.includes(userRole)
}
