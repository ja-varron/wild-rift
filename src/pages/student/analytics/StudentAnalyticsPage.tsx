import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { StudentSidebar } from "@/pages/student/components/StudentSidebar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  TrendingUp,
  Target,
  BookOpen,
} from "lucide-react"
import { StatusCard } from "./components/StatusCard"
import { TopBar } from "../components/TopBar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ExamAnalyticsCard } from "./components/ExamAnalyticsCard"

// ── Types ──────────────────────────────────────────────────────────────────────

interface TopicScore {
  topic: string
  score: number
  maxScore: number
}

interface FeedbackItem {
  type: "strength" | "improvement" | "warning"
  text: string
}

interface ExamRecord {
  id: number
  title: string
  date: string
  instructor: string
  score: number
  totalItems: number
  passed: boolean
  topics: TopicScore[]
  feedback: FeedbackItem[]
  recommendation: string
}

// ── Static Data ────────────────────────────────────────────────────────────────

const scoreTrend = [
  { exam: "Mock 1", score: 71 },
  { exam: "Mock 2", score: 76 },
  { exam: "Mock 3", score: 82 },
]

const examRecords: ExamRecord[] = [
  {
    id: 1,
    title: "Nursing Board Mock Exam 3",
    date: "Feb 15, 2026",
    instructor: "Dr. Maria Santos",
    score: 82,
    totalItems: 100,
    passed: true,
    topics: [
      { topic: "Fundamentals of Nursing", score: 22, maxScore: 25 },
      { topic: "Medical-Surgical Nursing", score: 17, maxScore: 25 },
      { topic: "Pharmacology", score: 20, maxScore: 25 },
      { topic: "Community Health", score: 23, maxScore: 25 },
    ],
    feedback: [
      { type: "strength", text: "Excellent performance in Community Health — keep it up!" }
    ],
    recommendation:
      "Focus your review sessions on Medical-Surgical Nursing case studies. Practice at least 20 NCLEX-style questions on post-operative care daily. For Pharmacology, use flashcards to memorize drug classifications before the next mock exam.",
  },
  {
    id: 2,
    title: "Nursing Board Mock Exam 2",
    date: "Jan 20, 2026",
    instructor: "Dr. Maria Santos",
    score: 76,
    totalItems: 100,
    passed: true,
    topics: [
      { topic: "Fundamentals of Nursing", score: 20, maxScore: 25 },
      { topic: "Medical-Surgical Nursing", score: 19, maxScore: 25 },
      { topic: "Pharmacology", score: 18, maxScore: 25 },
      { topic: "Community Health", score: 19, maxScore: 25 },
    ],
    feedback: [
      { type: "strength", text: "Consistent performance across all sections — good foundation." },
    ],
    recommendation:
      "Your scores are balanced, which is a good sign. Dedicate extra time to Pharmacology dosage computation and review epidemiological models for Community Health. Consider group study sessions to strengthen weaker areas.",
  },
  {
    id: 3,
    title: "Pharmacology Quiz 1",
    date: "Jan 5, 2026",
    instructor: "Dr. Maria Santos",
    score: 61,
    totalItems: 100,
    passed: false,
    topics: [
      { topic: "Drug Classification", score: 18, maxScore: 34 },
      { topic: "Dosage Computation", score: 22, maxScore: 33 },
      { topic: "Drug Interactions", score: 21, maxScore: 33 },
    ],
    feedback: [
      { type: "warning", text: "Score is below the passing threshold of 75%. Immediate remediation required." },
    ],
    recommendation:
      "You need focused remediation on Pharmacology. Begin with drug classification mnemonics and work through at least 2 chapters of your textbook before the next exam. Schedule a consultation with Dr. Santos for one-on-one guidance on dosage computation. A retake assessment will be scheduled.",
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 75) return "text-green-600"
  return "text-red-500"
}

// ── Page ───────────────────────────────────────────────────────────────────────

const StudentAnalyticsPage = () => {
  const avg = Math.round(
    scoreTrend.reduce((s, e) => s + e.score, 0) / scoreTrend.length
  )
  const improvement = scoreTrend[scoreTrend.length - 1].score - scoreTrend[0].score

  return (
    <SidebarProvider>
      <TooltipProvider>
        <div className="flex min-h-screen w-full bg-background">
          <StudentSidebar />

          <SidebarInset className="flex flex-col flex-1 min-w-0">
            {/* Top bar */}
            <TopBar navigator="Analytics" />

            <ScrollArea className="flex-1">
              <main className="p-6 space-y-6 max-w-6xl mx-auto w-full">

                {/* Page heading */}
                <div>
                  <h1 className="text-2xl font-bold">Performance Analytics</h1>
                  <p className="text-muted-foreground text-sm mt-0.5">
                    Track your progress and identify areas for improvement.
                  </p>
                </div>

                {/* ── Summary stat cards ── */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <StatusCard
                    cardName="Current Average"
                    value={`${avg}%`}
                    icon={Target}
                    iconBg="bg-teal-50 dark:bg-teal-950/30"
                    iconColor="text-teal-700"
                  />

                  <StatusCard
                    cardName="Improvement"
                    value={`+${improvement} pts`}
                    icon={TrendingUp}
                    iconBg="bg-green-50 dark:bg-green-950/30"
                    iconColor="text-green-600"
                    valueColor="text-green-600"
                  />

                  <StatusCard
                    cardName="Exams Taken"
                    value={scoreTrend.length}
                    icon={BookOpen}
                    iconBg="bg-amber-50 dark:bg-amber-950/30"
                    iconColor="text-amber-600"
                  />
                </div>

                {/* ── Per-exam accordion ── */}
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold">Exam-by-Exam Breakdown</h2>
                  <p className="text-sm text-muted-foreground">
                    Select an exam to view detailed scores, analytics, and instructor feedback.
                  </p>
                </div>

                <Accordion type="single" collapsible className="space-y-3">
                  {examRecords.map((exam) => {
                    const pct = Math.round((exam.score / exam.totalItems) * 100)
                    return (
                      <AccordionItem
                        key={exam.id}
                        value={`exam-${exam.id}`}
                        className="border rounded-xl overflow-hidden shadow-sm"
                      >
                        <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/30 transition-colors [&>svg]:shrink-0">
                          <div className="flex flex-1 items-center gap-4 min-w-0">
                            <div className="flex flex-col items-center justify-center size-12 rounded-lg border bg-muted/30 shrink-0">
                              <span className={`text-lg font-bold leading-none ${scoreColor(pct)}`}>
                                {exam.score}
                              </span>
                              <span className="text-[10px] text-muted-foreground">/{exam.totalItems}</span>
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className="font-semibold text-sm truncate">{exam.title}</p>
                              <p className="text-xs text-muted-foreground">{exam.date} · {exam.instructor}</p>
                            </div>
                            <Badge
                              variant={exam.passed ? "default" : "destructive"}
                              className={`hidden sm:inline-flex shrink-0 mr-2 ${exam.passed ? "bg-green-500 hover:bg-green-500" : ""}`}
                            >
                              {exam.passed ? "Passed" : "Failed"}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-0 pb-0 pt-0">
                          <Separator />
                          <div className="p-5">
                            <ExamAnalyticsCard exam={exam} />
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>

              </main>
            </ScrollArea>
          </SidebarInset>
        </div>
      </TooltipProvider>
    </SidebarProvider>
  )
}

export default StudentAnalyticsPage
