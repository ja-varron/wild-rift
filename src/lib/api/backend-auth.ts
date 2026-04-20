const BACKEND_API_URL = (import.meta.env.VITE_OMR_API_URL as string | undefined)?.replace(/\/$/, "") ?? "http://localhost:8000/api"

export async function ensureBackendSession(accessToken: string): Promise<void> {
  const response = await fetch(`${BACKEND_API_URL}/auth/session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ accessToken }),
  })

  if (!response.ok) {
    let errorMessage = `Backend session verification failed (${response.status} ${response.statusText}).`
    let errorDetails = ""

    try {
      const payload = await response.json() as { error?: string; message?: string; details?: string }
      if (payload?.error) {
        errorMessage = String(payload.error)
      } else if (payload?.message) {
        errorMessage = String(payload.message)
      }

      if (payload?.details) {
        errorDetails = String(payload.details)
      }
    } catch {
      try {
        const raw = await response.text()
        if (raw?.trim()) {
          errorDetails = raw.trim()
        }
      } catch {
        // Ignore response parsing errors and use fallback message.
      }
    }

    const parts = [
      `[Backend Auth] ${errorMessage}`,
      `endpoint=${BACKEND_API_URL}/auth/session`,
      `status=${response.status}`,
    ]

    if (errorDetails) {
      parts.push(`details=${errorDetails}`)
    }

    throw new Error(parts.join(" | "))
  }
}
