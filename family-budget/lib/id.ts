export function createId(): string {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
