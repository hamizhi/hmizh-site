export type CdkCredential =
  | { mode: "session"; session: string }
  | { mode: "access_token"; accessToken: string };

export function parseCdkCredential(input: string): CdkCredential | null {
  const value = input.trim();
  if (!value) return null;

  if (value.startsWith("{") || value.startsWith("[")) {
    try {
      const data: unknown = JSON.parse(value);
      if (!data || typeof data !== "object" || Array.isArray(data)) return null;
      const credential = data as Record<string, unknown>;
      if (typeof credential.sessionToken === "string" && credential.sessionToken.trim()) {
        return { mode: "session", session: credential.sessionToken.trim() };
      }
      if (typeof credential.accessToken === "string" && credential.accessToken.trim()) {
        return { mode: "access_token", accessToken: credential.accessToken.trim() };
      }
    } catch {
      return null;
    }
    return null;
  }

  return { mode: "session", session: value };
}
