const API_KEY_PREFIXES = {
  aisk_: 13,
  cb_: 11,
} as const;

export function isApiKey(token: string): boolean {
  return token.startsWith('aisk_') || token.startsWith('cb_');
}

export function extractApiKeyPrefix(key: string): string {
  for (const [prefix, len] of Object.entries(API_KEY_PREFIXES)) {
    if (key.startsWith(prefix)) return key.slice(0, len);
  }
  return key.slice(0, 13);
}
