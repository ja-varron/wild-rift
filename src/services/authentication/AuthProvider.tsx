import { useCallback, useEffect, useState } from "react";
import type { AuthTokens, AuthUser } from "./auth-types";
import { apiRefreshToken, apiSignin, apiSignout, decodeJWT } from "./auth-service";
import { AuthContext } from "./auth-context";

const REFRESH_KEY = 'tuon_rt'

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [accessToken, setAccessToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(() => Boolean(localStorage.getItem(REFRESH_KEY))) // true if refresh token exists

    const clearSession = useCallback(() => {
        setUser(null)
        setAccessToken(null)
        localStorage.removeItem(REFRESH_KEY)
    }, [])


    // Apply the tokens to the context
    const applyTokens = useCallback((tokens: AuthTokens) => {
        const payload = decodeJWT(tokens.access_token)
        setUser({ userId: payload.sub, email: payload.email, role: payload.role})
        setAccessToken(tokens.access_token)
        localStorage.setItem(REFRESH_KEY, tokens.refresh_token)
    }, [])

    // Sign in function
    const signin = useCallback(async (email: string, password: string) => {
        const tokens = await apiSignin(email, password)
        applyTokens(tokens)
    }, [applyTokens])

    // Sign out function
    const signout = useCallback(async () => {
        const refreshToken = localStorage.getItem(REFRESH_KEY)

        if (refreshToken && accessToken) {
            await apiSignout(refreshToken, accessToken).catch(() => undefined) // ignore errors on signout
        }

        clearSession()
    }, [accessToken, clearSession])

    // Restore session on mount
    useEffect(() => {
        const refreshToken = localStorage.getItem(REFRESH_KEY)
        if (!refreshToken) {
            return
        }

        apiRefreshToken(refreshToken)
            .then(applyTokens)
            .catch(clearSession)
            .finally(() => setIsLoading(false))
    }, [applyTokens, clearSession])

    return (
        <AuthContext.Provider value={{ user, accessToken, isLoading, signin, signout }}>
            {children}
        </AuthContext.Provider>
    )
}