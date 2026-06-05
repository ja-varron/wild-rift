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
import { StatusCard } from "./components/StatusCard"
import { ExamAnalyticsCard } from "./components/ExamAnalyticsCard"
import { useFetchStudentsByCourse } from "@/lib/supabase/authentication/context/use-fetch-users"
import type { UserProfile } from "@/model/user-profile"

// ── Helpers ────────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 75) return "text-green-600"
  return "text-red-500"
}

// ── Page ───────────────────────────────────────────────────────────────────────

const StudentAnalyticsPage = ({ userProfile }: { userProfile: UserProfile | null | undefined }) => {
  const courseId = userProfile?.course?.course_id ?? ""
  const { students, isLoading } = useFetchStudentsByCourse(courseId)

  const currentStudent = students.find((s) => s.user_id === userProfile?.user_id) ?? null
  const examRecords = (currentStudent?.examResults ?? []).map((result) => {
    const attempted = result.attempted === true
    const feedbackText = result.feedback?.trim()

    return {
      id: result.id,
      title: result.examTitle,
      date: result.date,
      instructor: "Instructor",
      score: result.score,
      totalItems: result.totalItems,
      passingRate: result.passingRate ?? 75,
      passed: result.passed,
      attempted,
      topics: result.topicScores.map((topic) => ({
        topic: topic.topicName,
        score: topic.score,
        maxScore: topic.maxScore,
      })),
      feedback: feedbackText ? [{ type: "improvement" as const, text: feedbackText }] : [],
      recommendation: attempted
        ? result.passed
          ? "Continue maintaining your performance level. Review challenging topics periodically."
          : "Focus on reviewing exam topics and practice similar questions before your next attempt."
        : "No submitted result yet. Your exam result will appear after scanning and submission.",
    }
  })

  const takenExamRecords = examRecords.filter((exam) => exam.attempted === true)

  const scoreTrend = takenExamRecords.slice(0, 3).map((exam, idx) => ({
    exam: `Exam ${idx + 1}`,
    score: exam.totalItems > 0 ? Math.round((exam.score / exam.totalItems) * 100) : 0,
  }))

  const avg = scoreTrend.length > 0
    ? Math.round(scoreTrend.reduce((s, e) => s + e.score, 0) / scoreTrend.length)
    : 0

  const improvement = scoreTrend.length > 1
    ? scoreTrend[scoreTrend.length - 1].score - scoreTrend[0].score
    : 0

  const hasSubmittedResults = takenExamRecords.length > 0

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
            value={takenExamRecords.length}
            icon={BookOpen}
            iconBg="bg-amber-50 dark:bg-amber-950/30"
            iconColor="text-amber-600"
          />
        </div>

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
        ) : takenExamRecords.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground">No completed exams yet. Results will appear after you submit an exam.</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-3">
            {takenExamRecords.map((exam) => {
              const isAttempted = exam.attempted === true
              const pct = isAttempted && exam.totalItems > 0
                ? Math.round((exam.score / exam.totalItems) * 100)
                : 0
              return (
                <AccordionItem
                  key={exam.id}
                  value={`exam-${exam.id}`}
                  className="border rounded-xl overflow-hidden shadow-sm bg-card"
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
                          className={`shrink-0 mr-2 ${exam.passed ? "bg-green-500 hover:bg-green-500" : ""}`}
                        >
                          {exam.passed ? "Passed" : "Failed"}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="shrink-0 mr-2 text-muted-foreground">
                          Pending
                        </Badge>
                      )}
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
