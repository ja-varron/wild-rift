/**
 * Safely parses a JSON string into an object of type T. If parsing fails, it returns null instead of throwing an error.
 * @param json The JSON string to parse
 * @returns The parsed object if successful, or null if parsing fails
 * @example
 * const jsonString = '{"name": "Alice", "age": 30}'
 * const result = safeJSONParse<{ name: string; age: number }>(jsonString)
 * // result is { name: "Alice", age: 30 }
 * @errors If the input string is not valid JSON, it logs the error and returns null
 */
export function safeJSONParse<T> (json: string): T | null {
  try {
    return JSON.parse(json) as T
  } catch (e) {
    console.error("Failed to parse JSON:", e)
    return null
  }
}


export function safeJSONStringify(value: unknown): string {
  try {
    return JSON.stringify(value)
  } catch (e) {
    console.error("Failed to stringify value:", e)
    return ""
  }
}