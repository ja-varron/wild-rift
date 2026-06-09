import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, CheckCircle2, XCircle } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useFetchProfile } from "@/lib/supabase/authentication/context/use-fetch-profile"

interface RecentExam {
  id: number
  title: string
  date: string
  course: string
  instructor: string
  status: "passed" | "failed" | null
  score?: number
  totalItems?: number
  hasScannedPapers?: boolean
}

type AssignedExamRow = {
  id: number
  exam_title?: string | null
  exam_date?: string | null
  exam_time?: string | null
  course_id?: string | null
  instructor_name?: string | null
  score?: number | null
  passed?: boolean | null
  attempted?: boolean
}

const parseScheduleDate = (examDateRaw: string, examTimeRaw?: string | null): Date => {
  const dateOnly = String(examDateRaw || "")
  const baseDate = new Date(dateOnly)
  if (Number.isNaN(baseDate.getTime())) {
    return new Date(0)
  }

  if (!examTimeRaw) {
    // If no time is provided, consider the exam complete after the day ends.
    return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 23, 59, 59, 999)
  }

  const normalized = examTimeRaw.trim().toUpperCase()
  const ampmMatch = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/)
  const h24Match = normalized.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  let hours = 23
  let minutes = 59

  if (ampmMatch) {
    hours = Number(ampmMatch[1])
    minutes = Number(ampmMatch[2])
    const meridiem = ampmMatch[3]
    if (meridiem === "PM" && hours < 12) hours += 12
    if (meridiem === "AM" && hours === 12) hours = 0
  } else if (h24Match) {
    hours = Number(h24Match[1])
    minutes = Number(h24Match[2])
  }

  return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hours, minutes, 0, 0)
}

const fetchRecentExams = async (userId: string | undefined): Promise<RecentExam[]> => {
  try {
    if (!userId) return []

    const now = new Date()
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"
    const endpoints = [
      `${backendUrl}/api/students/${userId}/assigned-exams`,
      `${backendUrl}/api/assignments/students/${userId}/assigned-exams`,
    ]

    let exams: AssignedExamRow[] = []
    let loaded = false
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint)
        if (!response.ok) {
          // Keep trying fallback endpoints before giving up.
          continue
        }

        const payload = await response.json().catch(() => ({}))
        exams = Array.isArray(payload?.exams) ? (payload.exams as AssignedExamRow[]) : []
        loaded = true
        break
      } catch {
        continue
      }
    }

    if (!loaded || exams.length === 0) {
      return []
    }

    const completedBySchedule = exams.filter(
      (exam) => parseScheduleDate(String(exam.exam_date || ""), exam.exam_time).getTime() < now.getTime(),
    )

    return completedBySchedule
      .slice(0, 10)
      .map((exam) => {
        const attempted = Boolean(exam.attempted)
        const passed = Boolean(exam.passed)
        return {
          id: exam.id,
          title: exam.exam_title || `Exam ${exam.id}`,
          date: exam.exam_date || new Date().toISOString(),
          course: exam.course_id || "General",
          instructor: exam.instructor_name || "Instructor",
          status: attempted ? (passed ? "passed" : "failed") : null,
          hasScannedPapers: attempted,
        }
      })
  } catch (err) {
    console.error("[RecentExams] Error fetching recent exams:", err)
    return []
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export const RecentExams = () => {
  const { authUser } = useFetchProfile()
  const { data: recentExams = [], isLoading } = useQuery({
    queryKey: ["recentExams", authUser?.id],
    queryFn: () => fetchRecentExams(authUser?.id),
    enabled: !!authUser?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-sm font-semibold">Recently Completed Exams</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (recentExams.length === 0) {
    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-sm font-semibold">Recently Completed Exams</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-center text-xs text-muted-foreground">No completed exams yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Recently Completed Exams</CardTitle>
          <span className="text-xs text-muted-foreground font-medium">
            {recentExams.length} exams
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {recentExams.map((exam) => (
          <div
            key={exam.id}
            className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-foreground truncate">
                {exam.title}
              </h4>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <Calendar className="size-3" />
                <span>{formatDate(exam.date)}</span>
                <span>•</span>
                <span>{exam.course}</span>
                <span>•</span>
                <span>{exam.instructor}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {exam.hasScannedPapers && exam.status === "passed" ? (
                <Badge className="bg-green-500 text-white hover:bg-green-600 border-0 flex items-center gap-1">
                  <CheckCircle2 className="size-3" />
                  Passed
                </Badge>
              ) : exam.hasScannedPapers && exam.status === "failed" ? (
                <Badge className="bg-red-500 text-white hover:bg-red-600 border-0 flex items-center gap-1">
                  <XCircle className="size-3" />
                  Failed
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground">No submitted result yet</span>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
