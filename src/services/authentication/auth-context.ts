import { createContext, useContext } from "react";
import type { AuthUser } from "./auth-types";

export interface AuthContextType {
    user: AuthUser | null
    accessToken: string | null
    isLoading: boolean
    signin: (email: string, password: string) => Promise<void>
    signout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error('useAuth must be used inside AuthProvider')
    }

    return context
}