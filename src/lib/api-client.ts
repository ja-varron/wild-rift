import { useAuth } from "@/services/authentication/AuthProvider";

export function useAPIClient() {
    const { accessToken } = useAuth()

    return async function apiFetch(path: string, init: RequestInit = {}) {
        const response = await fetch(`/api/v1${path}`, {
            ...init,
            headers: {
                'Content-Type': 'application/json',
                ...(accessToken ? { Authorization: `Bearer ${accessToken}`}: {}),
                ...init.headers
            }
        })

        if (!response.ok) throw await response.json()

        return response.json()
    }
}