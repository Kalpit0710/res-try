export function normalizeMongoUri(uri: string, defaultDatabase = 'srms'): string {
  try {
    const parsed = new URL(uri);
    const pathname = parsed.pathname.replace(/^\/+/, '');

    if (!pathname) {
      parsed.pathname = `/${defaultDatabase}`;
      return parsed.toString();
    }

    return parsed.toString();
  } catch {
    if (uri.endsWith('/')) return `${uri}${defaultDatabase}`;
    return uri;
  }
}