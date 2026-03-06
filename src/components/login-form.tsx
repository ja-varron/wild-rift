import { cn } from "@/lib/utils"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      <Card className="overflow-hidden p-0 shadow-lg">
        <CardContent className="grid p-0 md:grid-cols-2">

          {/* ── Left: Form ── */}
          <form className="p-8 md:p-10 flex flex-col justify-center">
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
                <Input id="password" type="password" required />
              </Field>

              <Field>
                <Button
                  type="submit"
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white"
                >
                  Sign In
                </Button>
              </Field>
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
