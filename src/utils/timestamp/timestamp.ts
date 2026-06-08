/**
 * Converts an ISO 8601 string to a locale-specific date and time string.
 * Example: "2026-06-08T16:48:00+08:00" -> "6/9/2026, 12:48:00 AM"
 * @param iso The ISO 8601 date string.
 * @returns Locale-specific date and time string.
 */
export const dateTimeFormatter = (iso: string) => {
  return new Date(iso).toLocaleString();
}

/**
 * Converts an ISO 8601 string to a locale-specific time string.
 * Example: "2026-06-08T16:48:00+08:00" -> "12:48:00 AM"
 * @param iso The ISO 8601 date string.
 * @returns Locale-specific time string.
 */
export const timeFormatter = (iso: string) => {
  return new Date(iso).toLocaleTimeString();
}

/**
 * Converts an ISO 8601 string to a locale-specific date string.
 * Example: "2026-06-08T16:48:00+08:00" -> "6/9/2026"
 * @param iso The ISO 8601 date string.
 * @returns Locale-specific date string.
 */
export const dateFormatter = (iso: string) => {
  return new Date(iso).toLocaleDateString();
}