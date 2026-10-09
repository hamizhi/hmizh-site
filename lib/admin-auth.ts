export function getAdminPassword(): string | null {
  const password = process.env.ADMIN_PASSWORD?.trim();
  return password || null;
}

export function isValidAdminPassword(password: unknown): boolean {
  const expected = getAdminPassword();
  return Boolean(expected && typeof password === "string" && password === expected);
}
