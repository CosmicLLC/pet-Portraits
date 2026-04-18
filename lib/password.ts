import bcrypt from "bcryptjs"

const BCRYPT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters"
  if (!/[a-zA-Z]/.test(password)) return "Password must contain a letter"
  if (!/[0-9]/.test(password)) return "Password must contain a number"
  return null
}
