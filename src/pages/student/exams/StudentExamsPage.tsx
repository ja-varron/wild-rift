import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
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
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/supabase"
import { StatusCard } from "./components/StatusCard"
import { ExamAnalyticsCard } from "./components/ExamAnalyticsCard"
import { RecentExamsList } from "./components/RecentExamsList"
import { useFetchExamDetails } from "@/lib/supabase/exam/context/use-fetch-exam-details"

// ── Helpers ────────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 75) return "text-green-600"
  return "text-red-500"
}

// ── Page ───────────────────────────────────────────────────────────────────────

const StudentAnalyticsPage = () => {
  const [userId, setUserId] = useState<string>()
  const { data: examRecords = [], isLoading } = useFetchExamDetails(userId)
  const submittedExamRecords = examRecords.filter((exam) => exam.attempted === true)

  // Fetch current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getCurrentUser()
  }, [])

  const scoreTrend = submittedExamRecords.slice(0, 3).map((exam, idx) => ({
    exam: `Exam ${idx + 1}`,
    score: Math.round((exam.score / exam.totalItems) * 100),
  }))

  const avg = scoreTrend.length > 0
    ? Math.round(scoreTrend.reduce((s, e) => s + e.score, 0) / scoreTrend.length)
    : 0

  const improvement = scoreTrend.length > 1
    ? scoreTrend[scoreTrend.length - 1].score - scoreTrend[0].score
    : 0

  const hasSubmittedResults = submittedExamRecords.length > 0

  return (
    <ScrollArea className="flex-1">
      <main className="p-6 space-y-6 max-w-6xl mx-auto w-full">

        {/* Page heading */}
        <div>
          <h1 className="text-2xl font-bold">Performance Analytics</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Track your progress and identify areas for improvement.
          </p>
        </div>

        {/* Summary stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatusCard
            cardName="Current Average"
            value={hasSubmittedResults ? `${avg}%` : "N/A"}
            icon={Target}
            iconBg="bg-teal-50 dark:bg-teal-950/30"
            iconColor="text-teal-700"
            valueColor={hasSubmittedResults ? undefined : "text-muted-foreground"}
          />

          <StatusCard
            cardName="Improvement"
            value={hasSubmittedResults ? `${improvement > 0 ? '+' : ''}${improvement} pts` : "N/A"}
            icon={TrendingUp}
            iconBg="bg-green-50 dark:bg-green-950/30"
            iconColor="text-green-600"
            valueColor={!hasSubmittedResults ? "text-muted-foreground" : improvement >= 0 ? "text-green-600" : "text-red-600"}
          />

          <StatusCard
            cardName="Exams Taken"
            value={submittedExamRecords.length}
            icon={BookOpen}
            iconBg="bg-amber-50 dark:bg-amber-950/30"
            iconColor="text-amber-600"
          />
        </div>

        {/* Recent Exams List */}
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <RecentExamsList
            recentResults={examRecords.map((exam) => ({
              id: exam.id,
              title: exam.title,
              date: exam.date,
              score: exam.score,
              total_items: exam.totalItems,
              percentage: Math.round((exam.score / exam.totalItems) * 100),
              passed: exam.passed,
              attempted: exam.attempted,
              user_id: userId || "",
              course_id: 0,
              feedback: "",
            }))}
          />
        )}

        {/* Per-exam accordion */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Exam-by-Exam Breakdown</h2>
          <p className="text-sm text-muted-foreground">
            Select an exam to view detailed scores, analytics, and instructor feedback.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : examRecords.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground">No exams taken yet</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-3">
            {examRecords.map((exam) => {
              const isAttempted = exam.attempted === true
              const pct = isAttempted ? Math.round((exam.score / exam.totalItems) * 100) : 0
              return (
                <AccordionItem
                  key={exam.id}
                  value={`exam-${exam.id}`}
                  className="border rounded-xl overflow-hidden shadow-sm"
                >
                  <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/30 transition-colors [&>svg]:shrink-0">
                    <div className="flex flex-1 items-center gap-4 min-w-0">
                      <div className="flex flex-col items-center justify-center size-12 rounded-lg border bg-muted/30 shrink-0">
                        <span className={`text-lg font-bold leading-none ${isAttempted ? scoreColor(pct) : "text-muted-foreground"}`}>
                          {isAttempted ? exam.score : "--"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">/{isAttempted ? exam.totalItems : "--"}</span>
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-semibold text-sm truncate">{exam.title}</p>
                        <p className="text-xs text-muted-foreground">{exam.date} · {exam.instructor}</p>
                      </div>
                      {isAttempted ? (
                        <Badge
                          variant={exam.passed ? "default" : "destructive"}
                          className={`hidden sm:inline-flex shrink-0 mr-2 ${exam.passed ? "bg-green-500 hover:bg-green-500" : ""}`}
                        >
                          {exam.passed ? "Passed" : "Failed"}
                        </Badge>
                      ) : null}
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
        )}

      </main>
    </ScrollArea>
  )
}

export default StudentAnalyticsPage
