/**
 * Prevents open redirects: only same-origin relative paths are allowed.
 */
export function getSafeReturnPath(raw: string | null | undefined): string {
  if (raw == null || typeof raw !== 'string') return '/dashboard';
  const t = raw.trim();
  if (!t.startsWith('/') || t.startsWith('//')) return '/dashboard';
  return t;
}
