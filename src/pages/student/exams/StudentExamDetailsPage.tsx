import { useParams, useNavigate } from "react-router-dom"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ChevronLeft, TrendingUp } from "lucide-react"
import { useFetchExamDetails } from "@/lib/supabase/exam/context/use-fetch-exam-details"
import { useFetchProfile } from "@/lib/supabase/authentication/context/use-fetch-profile"
import { Skeleton } from "@/components/ui/skeleton"
import { ExamAnalyticsCard } from "./components/ExamAnalyticsCard"
import { ExamLearningMaterials } from "./components/ExamLearningMaterials"

function scoreColor(score: number) {
  if (score >= 75) return "text-green-600"
  return "text-red-500"
}

const StudentExamDetailsPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { authUser } = useFetchProfile()
  const { data: exams, isLoading } = useFetchExamDetails(authUser?.id)

  const exam = exams?.find((e) => e.id.toString() === id)

  if (isLoading) {
    return (
      <ScrollArea className="flex-1">
        <main className="p-6 space-y-6 max-w-4xl mx-auto w-full">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </main>
      </ScrollArea>
    )
  }

  if (!exam) {
    return (
      <ScrollArea className="flex-1">
        <main className="p-6 space-y-6 max-w-4xl mx-auto w-full">
          <Button variant="outline" onClick={() => navigate("/student/exams")}>
            <ChevronLeft className="size-4 mr-2" />
            Back to Exams
          </Button>
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">Exam not found (ID: {id})</p>
            <Button 
              variant="link" 
              onClick={() => navigate("/student/exams")}
              className="mt-4"
            >
              Return to exam list
            </Button>
          </div>
        </main>
      </ScrollArea>
    )
  }

  const isAttempted = exam.attempted === true
  const pct = isAttempted ? Math.round((exam.score / exam.totalItems) * 100) : 0

  return (
    <ScrollArea className="flex-1">
      <main className="p-6 space-y-6 max-w-4xl mx-auto w-full">
        {/* Back button */}
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate("/student/exams")}
        >
          <ChevronLeft className="size-4 mr-2" />
          Back to Exams
        </Button>

        {/* Exam header */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">{exam.title}</h1>
              <p className="text-muted-foreground text-sm mt-1">
                {exam.date} · Instructor: {exam.instructor}
              </p>
            </div>
            {isAttempted ? (
              <Badge
                variant={exam.passed ? "default" : "destructive"}
                className={exam.passed ? "bg-green-500 hover:bg-green-500" : ""}
              >
                {exam.passed ? "Passed" : "Failed"}
              </Badge>
            ) : null}
          </div>
          <Separator />
        </div>

        {/* Score summary cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="text-xs font-medium text-muted-foreground">Score</p>
            <p className={`text-2xl font-bold mt-1 ${isAttempted ? scoreColor(pct) : "text-muted-foreground"}`}>
              {isAttempted ? `${exam.score}/${exam.totalItems}` : `--/--`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{isAttempted ? `${pct}%` : "No submitted result yet"}</p>
          </div>
          
          <div className="rounded-lg border p-4">
            <p className="text-xs font-medium text-muted-foreground">Status</p>
            <p className={`text-sm font-semibold mt-1 ${!isAttempted ? "text-slate-600" : exam.passed ? "text-green-600" : "text-red-600"}`}>
              {!isAttempted ? "No submitted result" : exam.passed ? "Passed" : "Failed"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {!isAttempted ? "Paper not scanned or result not submitted" : exam.passed ? "Above threshold" : "Below 75%"}
            </p>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-xs font-medium text-muted-foreground">Topic Analytics</p>
            <p className="text-2xl font-bold mt-1">{isAttempted ? exam.topics.length : "--"}</p>
            <p className="text-xs text-muted-foreground mt-1">{isAttempted ? "Area breakdown" : "Available after result submission"}</p>
          </div>
        </div>

        <ExamLearningMaterials examId={exam.id} />

        {/* Detailed analytics */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Detailed Analysis</h2>
          <ExamAnalyticsCard exam={exam} />
        </div>

        {/* Recommendations */}
        <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/30 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <TrendingUp className="size-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                Personalized Recommendations
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-2 leading-relaxed">
                {exam.recommendation}
              </p>
            </div>
          </div>
        </div>
      </main>
    </ScrollArea>
  )
}

export default StudentExamDetailsPage
