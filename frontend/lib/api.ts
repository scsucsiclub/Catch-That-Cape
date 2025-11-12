export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

export function getApiUrl(path: string): string {
  // Remove leading slash if present, then combine with base
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}
