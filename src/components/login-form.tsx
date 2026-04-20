import { cn } from "@/lib/utils"
import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { signIn } from "@/lib/supabase/authentication/auth"
// import { supabase } from "@/lib/supabase/supabase"
import { toast } from "sonner"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorDetails(null)
    try {
      const { error, redirectTo } = await signIn(email.trim(), password)
      if (error) {
        const message = error.message ?? "Sign in failed"
        setErrorDetails(message)
        toast.error(message)
        return
      }
      toast.success("Signed in successfully!")
      navigate(redirectTo ?? "/student", { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred during sign-in."
      setErrorDetails(message)
      toast.error("An unexpected error occurred during sign-in.")
      console.error("Sign-in error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      <Card className="overflow-hidden p-0 shadow-lg">
        <CardContent className="grid p-0 md:grid-cols-2">

          {/* ── Left: Form ── */}
          <form onSubmit={handleSubmit} className="p-8 md:p-10 flex flex-col justify-center">
            <FieldGroup>
              {/* Logo + heading */}
              <div className="flex flex-col items-center gap-3 text-center mb-2">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" className="size-8" alt="Tuon logo" />
                  <span className="text-xl font-bold tracking-tight">Tuon</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Welcome back</h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    Sign in to your account to continue
                  </p>
                </div>
              </div>

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@vsu.edu.ph"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>

              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Link
                    to="/forgot-password"
                    className="ml-auto text-sm text-teal-700 hover:text-teal-800 underline-offset-2 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>

              <Field>
                <Button
                  type="submit"
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </Field>

              <p className="text-sm text-center text-muted-foreground">
                No account yet?{" "}
                <Link to="/account-request" className="text-teal-700 hover:text-teal-800 underline underline-offset-2">
                  Request an account
                </Link>
              </p>

              {errorDetails && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <p className="font-semibold">Login failed</p>
                  <p className="mt-1 break-words">{errorDetails}</p>
                  <ul className="mt-2 list-disc pl-5 text-xs text-red-700/90">
                    <li>Check your email and password first.</li>
                    <li>If the message starts with [Backend Auth], verify backend server is running and VITE_OMR_API_URL is correct.</li>
                    <li>If the message starts with [Supabase Auth], verify Supabase credentials and user account status.</li>
                  </ul>
                </div>
              )}
            </FieldGroup>
          </form>

          {/* ── Right: Brand panel ── */}
          <div className="relative hidden md:flex flex-col items-center justify-center bg-teal-700 p-10 text-white">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 size-48 rounded-full bg-teal-600/40 -translate-y-1/3 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 size-64 rounded-full bg-teal-800/40 translate-y-1/3 -translate-x-1/3" />

            <div className="relative z-10 flex flex-col items-center gap-5 text-center">
              <img src="/logo.png" alt="Tuon" className="size-16 brightness-0 invert" />
              <div>
                <p className="text-3xl font-bold tracking-tight">Tuon</p>
                <p className="text-teal-100 text-sm mt-1 max-w-xs">
                  Automated exam scanning, grading, and analytics for modern educators.
                </p>
              </div>
              <div className="flex flex-col gap-2 text-sm text-teal-100 mt-2">
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-teal-300 shrink-0" />
                  OMR-based answer sheet scanning
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-teal-300 shrink-0" />
                  Instant automated grading
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-teal-300 shrink-0" />
                  Topic-based performance analytics
                </div>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>

      <FieldDescription className="text-center text-xs">
        By signing in, you agree to our{" "}
        <a href="#" className="text-teal-700 hover:underline underline-offset-2">Terms of Service</a>{" "}
        and{" "}
        <a href="#" className="text-teal-700 hover:underline underline-offset-2">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}
