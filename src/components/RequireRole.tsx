import React, { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"

type RequireRoleProps = {
    allowedRoles: string[]
    children: React.ReactNode
}

export default function RequireRole({ allowedRoles, children }: RequireRoleProps) {
    const navigate = useNavigate()
    const location = useLocation()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true

            ; (async () => {
                setLoading(true)
                const { data, error } = await supabase.auth.getUser()
                const user = (data as any)?.user

                if (!mounted) return

                if (error || !user) {
                    navigate("/login", { state: { from: location }, replace: true })
                    return
                }

                // Fetch canonical role from profiles table when available
                const { data: profile, error: profileError } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", user.id)
                    .maybeSingle()

                const roleFromProfile = !profileError && profile?.role ? profile.role : null
                const role = (roleFromProfile || user.user_metadata?.role || user.app_metadata?.role || "Student") as string

                const normalized = role.trim().toLowerCase()
                const allowed = allowedRoles.map((r) => r.toLowerCase())

                console.debug("RequireRole -> user.id:", user.id)
                console.debug("RequireRole -> roleFromProfile:", roleFromProfile)
                console.debug("RequireRole -> resolved role:", role)

                if (!allowed.includes(normalized)) {
                    // redirect to user's home based on their role
                    if (normalized.includes("admin")) navigate("/admin", { replace: true })
                    else if (normalized.includes("instructor")) navigate("/instructor", { replace: true })
                    else navigate("/student", { replace: true })
                    return
                }

                setLoading(false)
            })()

        return () => {
            mounted = false
        }
    }, [allowedRoles, navigate, location])

    if (loading) {
        return (
            <div className="flex items-center justify-center p-6">
                <div>Loading…</div>
            </div>
        )
    }

    return <>{children}</>
}
