export function formatAssetCode(a: { id: string; code?: string | null }) {
  return a.code && a.code.trim() ? a.code : `PAT-${a.id.slice(0,8).toUpperCase()}`;
}
