import { useState } from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { ArrowLeft, Mail, ShieldCheck, KeyRound, CheckCircle2 } from "lucide-react"

type Step = "email" | "otp" | "reset" | "success"

const AccountVerificationPage = () => {
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")

  // ── Step handlers ──

  function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.")
      return
    }
    // TODO: call API to send verification code
    setStep("otp")
  }

  function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (otp.length < 6) {
      setError("Please enter the full 6-digit code.")
      return
    }
    // TODO: call API to verify OTP
    setStep("reset")
  }

  function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    // TODO: call API to reset password
    setStep("success")
  }

  // ── Step indicators ──

  const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
    { key: "email", label: "Email", icon: <Mail className="size-4" /> },
    { key: "otp", label: "Verify", icon: <ShieldCheck className="size-4" /> },
    { key: "reset", label: "Reset", icon: <KeyRound className="size-4" /> },
  ]

  const stepOrder: Step[] = ["email", "otp", "reset"]
  const currentIdx = stepOrder.indexOf(step)

  return (
    <div className="bg-teal-50 dark:bg-background flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <div className={cn("flex flex-col gap-4")}>
          <Card className="overflow-hidden p-0 shadow-lg">
            <CardContent className="grid p-0 md:grid-cols-2">

              {/* ── Left: Form ── */}
              <div className="p-8 md:p-10 flex flex-col justify-center">

                {/* Logo + heading */}
                <div className="flex flex-col items-center gap-3 text-center mb-6">
                  <div className="flex items-center gap-2">
                    <img src="/logo.png" className="size-8" alt="Tuon logo" />
                    <span className="text-xl font-bold tracking-tight">Tuon</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">
                      {step === "email" && "Recover Your Account"}
                      {step === "otp" && "Verify Your Identity"}
                      {step === "reset" && "Set New Password"}
                      {step === "success" && "All Done!"}
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                      {step === "email" && "Enter your email address and we'll send a verification code."}
                      {step === "otp" && `We sent a 6-digit code to ${email}.`}
                      {step === "reset" && "Choose a strong new password for your account."}
                      {step === "success" && "Your password has been reset successfully."}
                    </p>
                  </div>
                </div>

                {/* Step indicator (hidden on success) */}
                {step !== "success" && (
                  <div className="flex items-center justify-center gap-2 mb-6">
                    {steps.map((s, i) => {
                      const isActive = i === currentIdx
                      const isCompleted = i < currentIdx
                      return (
                        <div key={s.key} className="flex items-center gap-2">
                          {i > 0 && (
                            <div className={cn("h-px w-8", isCompleted || isActive ? "bg-teal-600" : "bg-muted-foreground/25")} />
                          )}
                          <div
                            className={cn(
                              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                              isActive && "bg-teal-700 text-white",
                              isCompleted && "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
                              !isActive && !isCompleted && "bg-muted text-muted-foreground"
                            )}
                          >
                            {s.icon}
                            <span className="hidden sm:inline">{s.label}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* ── Step: Email ── */}
                {step === "email" && (
                  <form onSubmit={handleSendCode}>
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="recovery-email">Email Address</FieldLabel>
                        <Input
                          id="recovery-email"
                          type="email"
                          placeholder="you@vsu.edu.ph"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
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
                        >
                          Send Verification Code
                        </Button>
                      </Field>

                      <div className="text-center">
                        <Link
                          to="/login"
                          className="inline-flex items-center gap-1 text-sm text-teal-700 hover:text-teal-800 hover:underline underline-offset-2"
                        >
                          <ArrowLeft className="size-3.5" />
                          Back to Sign In
                        </Link>
                      </div>
                    </FieldGroup>
                  </form>
                )}

                {/* ── Step: OTP ── */}
                {step === "otp" && (
                  <form onSubmit={handleVerifyOtp}>
                    <FieldGroup>
                      <Field>
                        <FieldLabel>Verification Code</FieldLabel>
                        <div className="flex justify-center">
                          <InputOTP
                            maxLength={6}
                            value={otp}
                            onChange={(val) => setOtp(val)}
                          >
                            <InputOTPGroup>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                              <InputOTPSlot index={3} />
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                        <FieldDescription className="text-center text-xs mt-2">
                          Didn't receive a code?{" "}
                          <button
                            type="button"
                            className="text-teal-700 hover:underline underline-offset-2"
                            onClick={() => {
                              // TODO: resend code
                            }}
                          >
                            Resend
                          </button>
                        </FieldDescription>
                      </Field>

                      {error && (
                        <p className="text-sm text-destructive">{error}</p>
                      )}

                      <Field>
                        <Button
                          type="submit"
                          className="w-full bg-teal-700 hover:bg-teal-800 text-white"
                        >
                          Verify Code
                        </Button>
                      </Field>

                      <div className="text-center">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-sm text-teal-700 hover:text-teal-800 hover:underline underline-offset-2"
                          onClick={() => { setStep("email"); setOtp(""); setError("") }}
                        >
                          <ArrowLeft className="size-3.5" />
                          Change email address
                        </button>
                      </div>
                    </FieldGroup>
                  </form>
                )}

                {/* ── Step: Reset Password ── */}
                {step === "reset" && (
                  <form onSubmit={handleResetPassword}>
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="new-password">New Password</FieldLabel>
                        <Input
                          id="new-password"
                          type="password"
                          placeholder="At least 8 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="Re-enter your new password"
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
                        >
                          Reset Password
                        </Button>
                      </Field>
                    </FieldGroup>
                  </form>
                )}

                {/* ── Step: Success ── */}
                {step === "success" && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center justify-center size-16 rounded-full bg-teal-100 dark:bg-teal-950">
                      <CheckCircle2 className="size-8 text-teal-700 dark:text-teal-300" />
                    </div>
                    <p className="text-sm text-muted-foreground text-center max-w-xs">
                      You can now sign in with your new password. You'll be redirected to the login page.
                    </p>
                    <Link to="/login">
                      <Button className="bg-teal-700 hover:bg-teal-800 text-white">
                        Back to Sign In
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

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
            By using this service, you agree to our{" "}
            <a href="#" className="text-teal-700 hover:underline underline-offset-2">Terms of Service</a>{" "}
            and{" "}
            <a href="#" className="text-teal-700 hover:underline underline-offset-2">Privacy Policy</a>.
          </FieldDescription>
        </div>
      </div>
    </div>
  )
}

export default AccountVerificationPage
