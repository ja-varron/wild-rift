export type PasswordPolicyResult = {
  minLength: boolean
  uppercase: boolean
  lowercase: boolean
  number: boolean
  symbol: boolean
}

export const PASSWORD_MIN_LENGTH = 12

export function evaluatePasswordPolicy(password: string): PasswordPolicyResult {
  return {
    minLength: password.length >= PASSWORD_MIN_LENGTH,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  }
}

export function isPasswordPolicyValid(result: PasswordPolicyResult): boolean {
  return Object.values(result).every(Boolean)
}

export function passwordPolicyItems(result: PasswordPolicyResult): Array<{ label: string; ok: boolean }> {
  return [
    { label: `At least ${PASSWORD_MIN_LENGTH} characters`, ok: result.minLength },
    { label: "At least one uppercase letter", ok: result.uppercase },
    { label: "At least one lowercase letter", ok: result.lowercase },
    { label: "At least one number", ok: result.number },
    { label: "At least one symbol", ok: result.symbol },
  ]
}
