import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, Clock } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useFetchProfile } from "@/lib/supabase/authentication/context/use-fetch-profile"

interface UpcomingExam {
  id: number
  title: string
  date: string
  time: string
  duration: number // in minutes
  course: string
  instructor: string
  status: "scheduled" | "today" | "tomorrow"
  topics: string[] // Topics covered in the exam
}

type AssignedExamRow = {
  id: number
  exam_title?: string | null
  exam_date?: string | null
  exam_time?: string | null
  total_items?: number | null
  course_id?: string | null
  instructor_name?: string | null
  topics?: string[] | string | null
}

const normalizeTopics = (rawTopics: AssignedExamRow["topics"]): string[] => {
  const toLabel = (topic: unknown): string => {
    if (typeof topic === "string") return topic.trim()
    if (topic && typeof topic === "object") {
      const candidate = topic as { name?: unknown; title?: unknown; topic?: unknown }
      const value = candidate.name ?? candidate.title ?? candidate.topic
      return typeof value === "string" ? value.trim() : ""
    }
    return ""
  }

  let list: unknown[] = []
  if (typeof rawTopics === "string") {
    try {
      const parsed = JSON.parse(rawTopics)
      list = Array.isArray(parsed) ? parsed : []
    } catch {
      list = rawTopics
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
    }
  } else if (Array.isArray(rawTopics)) {
    list = rawTopics
  }

  return Array.from(new Set(list.map(toLabel).filter(Boolean)))
}

const parseScheduleDate = (examDateRaw: string, examTimeRaw?: string | null): Date => {
  const dateOnly = String(examDateRaw || "")
  const baseDate = new Date(dateOnly)
  if (Number.isNaN(baseDate.getTime())) {
    return new Date(0)
  }

  if (!examTimeRaw) {
    // If no time is provided, treat schedule as end-of-day so it remains upcoming for that date.
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

const fetchUpcomingExams = async (userId: string | undefined): Promise<UpcomingExam[]> => {
  try {
    if (!userId) return []

    const now = new Date()
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"
    const endpoints = [
      `${backendUrl}/api/students/${userId}/assigned-exams`,
      `${backendUrl}/api/assignments/students/${userId}/assigned-exams`,
    ]

    let data: AssignedExamRow[] = []
    let loaded = false
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint)
        if (!response.ok) {
          // Keep trying fallback endpoints before giving up.
          continue
        }

        const payload = await response.json().catch(() => ({}))
        data = Array.isArray(payload?.exams) ? (payload.exams as AssignedExamRow[]) : []
        loaded = true
        break
      } catch {
        continue
      }
    }

    if (!loaded || data.length === 0) {
      return []
    }

    return data
      .filter((exam) => parseScheduleDate(String(exam.exam_date || ""), exam.exam_time).getTime() >= now.getTime())
      .slice(0, 10)
      .map((exam) => {
      const examDate = parseScheduleDate(String(exam.exam_date || ""), exam.exam_time)
      const localMidnightNow = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const localMidnightExam = new Date(examDate.getFullYear(), examDate.getMonth(), examDate.getDate())
      const daysUntil = Math.floor((localMidnightExam.getTime() - localMidnightNow.getTime()) / (1000 * 60 * 60 * 24))

      return {
        id: exam.id,
        title: exam.exam_title || `Exam ${exam.id}`,
        date: exam.exam_date || new Date().toISOString(),
        time: exam.exam_time || "10:00 AM",
        duration: Number(exam.total_items || 0) * 1.5, // Rough estimate
        course: exam.course_id || "General",
        instructor: exam.instructor_name || "Instructor",
        status: daysUntil === 0 ? "today" : daysUntil === 1 ? "tomorrow" : "scheduled",
        topics: normalizeTopics(exam.topics),
      }
    })
  } catch (err) {
    console.error("[UpcomingExams] Error fetching upcoming exams:", err)
    return []
  }
}

function getStatusColor(status: UpcomingExam["status"]) {
  if (status === "today") return "bg-red-500 text-white hover:bg-red-600"
  if (status === "tomorrow") return "bg-amber-500 text-white hover:bg-amber-600"
  return "bg-blue-500 text-white hover:bg-blue-600"
}

function getStatusLabel(status: UpcomingExam["status"]) {
  if (status === "today") return "Today"
  if (status === "tomorrow") return "Tomorrow"
  return "Scheduled"
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`
  }
  const hours = Math.round(minutes / 60 * 10) / 10 // Round to 1 decimal place
  if (hours === 1) return '1 hr'
  return `${hours} hrs`
}

type UpcomingExamsProps = {
  exams?: UpcomingExam[]
}

const UpcomingExams = ({ exams }: UpcomingExamsProps) => {
  const { authUser } = useFetchProfile()
  const { data: fetchedExams, isLoading } = useQuery({
    queryKey: ["upcomingExams", authUser?.id],
    queryFn: () => fetchUpcomingExams(authUser?.id),
    enabled: !!authUser?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const displayExams = exams || fetchedExams || []

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <div className="flex items-center">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calendar className="size-4 text-teal-600" />
            Upcoming Exams
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading && !exams ? (
          <div className="p-4 space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            ))}
          </div>
        ) : displayExams.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground">No upcoming exams at the moment</p>
          </div>
        ) : (
          displayExams.map((exam, idx) => (
            <div key={exam.id}>
              <div className="flex flex-col gap-3 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{exam.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {exam.course} · {exam.instructor}
                    </p>
                  </div>
                  <Badge className={getStatusColor(exam.status)}>
                    {getStatusLabel(exam.status)}
                  </Badge>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    {formatDate(exam.date)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {exam.time}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs">⏱️</span>
                    {formatDuration(exam.duration)}
                  </div>
                </div>

                {exam.topics && exam.topics.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-foreground">Topics Covered:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {exam.topics.map((topic, topicIdx) => (
                        <Badge key={`${exam.id}-${topic}-${topicIdx}`} variant="secondary" className="text-xs bg-teal-50 text-teal-700 hover:bg-teal-100">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Note: No grades for upcoming exams */}
                <div className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded border border-amber-200">
                  ℹ️ Grades will be available after exam completion and paper scanning
                </div>
              </div>
              {idx < displayExams.length - 1 && <Separator />}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

export { UpcomingExams }
