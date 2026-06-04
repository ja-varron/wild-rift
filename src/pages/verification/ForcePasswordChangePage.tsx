import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { evaluatePasswordPolicy, isPasswordPolicyValid, PASSWORD_MIN_LENGTH, passwordPolicyItems } from "@/lib/password-policy"

const ForcePasswordChangePage = () => {
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const passwordChecks = useMemo(
    () => passwordPolicyItems(evaluatePasswordPolicy(newPassword)),
    [newPassword],
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!currentPassword) {
      setError("Please enter your current temporary password.")
      return
    }

    if (!isPasswordPolicyValid(evaluatePasswordPolicy(newPassword))) {
      setError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters and include uppercase, lowercase, number, and symbol.`)
      return
    }

    if (newPassword === currentPassword) {
      setError("Your new password must be different from the temporary password.")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      const email = userData?.user?.email
      if (!email) {
        setError("Unable to verify the current account. Please sign in again.")
        return
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      })

      if (verifyError) {
        setError("Current temporary password is incorrect.")
        return
      }

      const currentMetadata = userData?.user?.user_metadata ?? {}

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
        data: {
          ...currentMetadata,
          force_password_change: false,
          password_changed_at: new Date().toISOString(),
        },
      })

      if (updateError) {
        setError(updateError.message || "Failed to update password")
        return
      }

      toast.success("Password updated successfully")
      navigate("/", { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update password"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-teal-50 dark:bg-background flex min-h-svh w-full flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <Card className="overflow-hidden p-0 shadow-lg">
          <CardContent className="grid p-0 md:grid-cols-2">
            <form onSubmit={handleSubmit} className="p-8 md:p-10 flex flex-col justify-center">
              <FieldGroup>
                <div className="flex flex-col items-center gap-3 text-center mb-2">
                  <div className="flex items-center gap-2">
                    <img src="/logo.png" className="size-8" alt="Tuon logo" />
                    <span className="text-xl font-bold tracking-tight">Tuon</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">Change Temporary Password</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                      You must update your password before accessing your account.
                    </p>
                  </div>
                </div>

                <Field>
                  <FieldLabel htmlFor="current-password">Current Temporary Password</FieldLabel>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="new-password">New Password</FieldLabel>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <ul className="mt-2 space-y-1 text-xs">
                    {passwordChecks.map((item) => (
                      <li key={item.label} className={cn("flex items-center gap-2", item.ok ? "text-emerald-600" : "text-muted-foreground")}>
                        <span className={cn("size-1.5 rounded-full", item.ok ? "bg-emerald-600" : "bg-muted-foreground/40")} />
                        {item.label}
                      </li>
                    ))}
                  </ul>
                </Field>

                <Field>
                  <FieldLabel htmlFor="confirm-password">Confirm New Password</FieldLabel>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </Field>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Field>
                  <Button
                    type="submit"
                    className="w-full bg-teal-700 hover:bg-teal-800 text-white"
                    disabled={loading}
                  >
                    {loading ? "Updating Password..." : "Update Password"}
                  </Button>
                </Field>

                <FieldDescription className="text-xs text-center">
                  For security, access to dashboards is blocked until this step is completed.
                </FieldDescription>
              </FieldGroup>
            </form>

            <div className="relative hidden md:flex flex-col items-center justify-center bg-teal-700 p-10 text-white">
              <div className="absolute top-0 right-0 size-48 rounded-full bg-teal-600/40 -translate-y-1/3 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 size-64 rounded-full bg-teal-800/40 translate-y-1/3 -translate-x-1/3" />

              <div className="relative z-10 text-center">
                <p className="text-3xl font-bold tracking-tight">Account Security</p>
                <p className="text-teal-100 text-sm mt-3 max-w-xs">
                  Your account was created with a temporary password. Please set a personal password now.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ForcePasswordChangePage
