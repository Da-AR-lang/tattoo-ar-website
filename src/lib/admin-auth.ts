const RAW = process.env.ADMIN_EMAILS ?? ''

const ALLOWED = new Set(
  RAW.split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
)

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  if (ALLOWED.size === 0) return false
  return ALLOWED.has(email.toLowerCase())
}

export function adminEmailsConfigured(): boolean {
  return ALLOWED.size > 0
}
