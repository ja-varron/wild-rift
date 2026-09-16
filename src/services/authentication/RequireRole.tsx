import { Navigate, Outlet } from "react-router-dom"
import type { UserRole } from "./auth-types"
import { useAuth } from "./auth-context"

export function RequireRole({ roles }: { roles: UserRole[] }) {
	const { user } = useAuth()

	if(!user) return <Navigate to='/login' replace />

	if(!user || !roles.includes(user.role)) {
		return <Navigate to={`/${user?.role ?? 'login'}`} replace />
	}

	return <Outlet />
}