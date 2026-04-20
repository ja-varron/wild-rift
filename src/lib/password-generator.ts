/**
 * Generates a secure random password that meets the application's requirements
 * Requirements: min 8 chars, uppercase, lowercase, number, symbol
 */
export function generateRandomPassword(length: number = 12): string {
  const targetLength = Math.max(4, length)
  const lowercase = "abcdefghijklmnopqrstuvwxyz"
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const numbers = "0123456789"
  const symbols = "!@#$%^&*-_=+"

  const randomInt = (maxExclusive: number): number => {
    if (maxExclusive <= 0) return 0

    const array = new Uint32Array(1)
    const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive
    let value = 0

    do {
      crypto.getRandomValues(array)
      value = array[0]
    } while (value >= limit)

    return value % maxExclusive
  }

  // Ensure at least one of each required character type
  const passwordChars = [
    uppercase[randomInt(uppercase.length)],
    lowercase[randomInt(lowercase.length)],
    numbers[randomInt(numbers.length)],
    symbols[randomInt(symbols.length)],
  ]

  // Fill the rest with random characters from all sets
  const allChars = lowercase + uppercase + numbers + symbols
  while (passwordChars.length < targetLength) {
    passwordChars.push(allChars[randomInt(allChars.length)])
  }

  // Fisher-Yates shuffle for an unbiased random permutation.
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]]
  }

  return passwordChars.join("")
}
