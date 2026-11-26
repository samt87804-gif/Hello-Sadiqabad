export function getSafeOwnerNotificationPath(path: string | null): string | null {
  if (!path || path.length > 200 || path.startsWith('//') || path.includes('\\') || /[\u0000-\u001f]/.test(path)) {
    return null;
  }
  if (path === '/owner' || path.startsWith('/owner/')) return path;
  return null;
}
