import { Navigate, Outlet, useLocation } from "react-router-dom"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "./auth-context"

export function RequireAuth(){
    const { user, isLoading } = useAuth()
    const location = useLocation()

    if(isLoading) return <Spinner />

    if(!user) {
        return <Navigate to='/login' state={{ from: location }} replace/>
    }

    return <Outlet />
}