import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ScanLine,
  BarChart3,
  MessageSquare,
  Bell,
  CheckCircle2,
  GraduationCap,
  UserCog,
  ShieldCheck,
  ArrowRight,
  Zap,
} from "lucide-react"

// ── Data ───────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: ScanLine,
    title: "Exam Paper Scanner",
    description:
      "Scan multiple-choice answer sheets using optical mark recognition (OMR). Quickly upload scanned papers and let Tuon handle the rest.",
  },
  {
    icon: CheckCircle2,
    title: "Automated Grading",
    description:
      "Instantly compares scanned answers against stored answer keys and computes total and per-topic scores with precision.",
  },
  {
    icon: BarChart3,
    title: "Exam Analytics",
    description:
      "Generate topic-based performance analytics for each exam. Identify strengths and weaknesses to guide study strategies.",
  },
  {
    icon: MessageSquare,
    title: "Personalized Feedback",
    description:
      "Instructors can provide tailored feedback per student per exam, stored directly in the student's record.",
  },
  {
    icon: Bell,
    title: "Instant Notifications",
    description:
      "Students are automatically notified via email the moment their exam scores and feedback are released.",
  },
  {
    icon: Zap,
    title: "Fast & Accurate Results",
    description:
      "Eliminate human error and delays caused by manual checking. Get reliable results faster, every time.",
  },
]

const steps = [
  { step: "01", title: "Scan Answer Sheets", description: "Instructors scan completed answer sheets using any standard scanner." },
  { step: "02", title: "Automated Processing", description: "Tuon compares scanned answers against the answer key and computes scores." },
  { step: "03", title: "Review Analytics", description: "Topic-based analytics are generated for instructors to review student performance." },
  { step: "04", title: "Provide Feedback", description: "Instructors add personalized feedback per student, per exam." },
  { step: "05", title: "Notify Students", description: "Students receive an email notification with their results and feedback." },
]

const roles = [
  {
    icon: ShieldCheck,
    role: "Administrator",
    description: "Manage user accounts, configure system settings, and oversee overall platform operations.",
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950",
  },
  {
    icon: UserCog,
    role: "Instructor",
    description: "Scan exam papers, review results, generate analytics, and provide personalized student feedback.",
    color: "text-teal-600",
    bg: "bg-teal-50 dark:bg-teal-950",
  },
  {
    icon: GraduationCap,
    role: "Student",
    description: "View exam results, access topic-based analytics, and receive instructor feedback through the platform.",
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950",
  },
]

// ── Component ──────────────────────────────────────────────────────────────────

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Tuon logo" className="h-9 w-9 object-contain" />
            <span className="text-xl font-bold tracking-tight">Tuon</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground sm:flex">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#roles" className="hover:text-foreground transition-colors">Who It's For</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <a href="/login">Log in</a>
            </Button>
            <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white" asChild>
              <a href="/login">Get Started <ArrowRight className="ml-1.5 size-3.5" /></a>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-6 py-24 sm:py-32">
        {/* Background gradient blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-32 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-teal-500/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-[300px] w-[400px] rounded-full bg-green-500/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-4xl text-center">
          <Badge className="mb-4 bg-teal-100 text-teal-700 hover:bg-teal-100 dark:bg-teal-900 dark:text-teal-300">
            VSU Review Center
          </Badge>
          <div className="mb-6 flex justify-center">
            <img src="/logo.png" alt="Tuon logo" className="h-24 w-24 object-contain drop-shadow-md sm:h-28 sm:w-28" />
          </div>
          <h1 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Smarter Exam Checking <br className="hidden sm:block" />
            <span className="text-teal-600">for Future Board Passers</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Tuon automates mock board exam checking, delivers instant performance analytics, and provides personalized feedback — helping VSU Review Center students prepare with confidence.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" className="w-full bg-teal-700 hover:bg-teal-800 text-white sm:w-auto" asChild>
              <a href="/login">Get Started <ArrowRight className="ml-2 size-4" /></a>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
              <a href="#how-it-works">See How It Works</a>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="border-y bg-muted/40">
        <div className="mx-auto grid max-w-4xl grid-cols-2 divide-x divide-border sm:grid-cols-4">
          {[
            { value: "100%", label: "Automated Grading" },
            { value: "5", label: "Core Modules" },
            { value: "3", label: "User Roles" },
            { value: "0", label: "Manual Errors" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center py-8 px-4 text-center">
              <span className="text-3xl font-extrabold text-teal-600">{s.value}</span>
              <span className="mt-1 text-xs text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <Badge className="mb-3 bg-teal-100 text-teal-700 hover:bg-teal-100 dark:bg-teal-900 dark:text-teal-300">Features</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need, automated</h2>
            <p className="mt-3 text-muted-foreground">From scanning to feedback — Tuon handles every step of the examination evaluation process.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="border hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900">
                    <Icon className="size-5 text-teal-700 dark:text-teal-300" />
                  </div>
                  <h3 className="mb-2 font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* ── How It Works ── */}
      <section id="how-it-works" className="px-6 py-20 sm:py-28 bg-muted/30">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <Badge className="mb-3 bg-teal-100 text-teal-700 hover:bg-teal-100 dark:bg-teal-900 dark:text-teal-300">Process</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How It Works</h2>
            <p className="mt-3 text-muted-foreground">A simple, end-to-end automated workflow replacing manual checking entirely.</p>
          </div>
          <ol className="relative space-y-8 border-l-2 border-teal-200 dark:border-teal-800 pl-8">
            {steps.map(({ step, title, description }) => (
              <li key={step} className="relative">
                <span className="absolute -left-[2.85rem] flex h-9 w-9 items-center justify-center rounded-full border-2 border-teal-500 bg-background text-xs font-bold text-teal-600">
                  {step}
                </span>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <Separator />

      {/* ── Roles ── */}
      <section id="roles" className="px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <Badge className="mb-3 bg-teal-100 text-teal-700 hover:bg-teal-100 dark:bg-teal-900 dark:text-teal-300">Who It's For</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Built for every role</h2>
            <p className="mt-3 text-muted-foreground">Tuon provides a tailored experience for each user of the VSU Review Center.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {roles.map(({ icon: Icon, role, description, color, bg }) => (
              <Card key={role} className="border text-center hover:shadow-md transition-shadow">
                <CardContent className="p-8">
                  <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${bg}`}>
                    <Icon className={`size-7 ${color}`} />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{role}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="px-6 py-16 bg-teal-700">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-3 text-3xl font-bold text-white sm:text-4xl">Ready to get started?</h2>
          <p className="mb-8 text-teal-100">Join the VSU Review Center's automated exam evaluation platform today.</p>
          <Button size="lg" className="bg-white text-teal-700 hover:bg-teal-50 font-semibold" asChild>
            <a href="/login">Log In to Tuon <ArrowRight className="ml-2 size-4" /></a>
          </Button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Tuon logo" className="h-6 w-6 object-contain" />
            <span className="font-semibold text-foreground">Tuon</span>
            <span>— VSU Review Center Exam System</span>
          </div>
          <p>© {new Date().getFullYear()} Tuon. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}

export default LandingPage