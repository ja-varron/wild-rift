import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ClipboardList,
  Users,
  Calendar,
  MapPin,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { SummaryStatsCard } from "@/components/custom/SummaryStatsCard"
import { supabase } from "@/lib/supabase/supabase"
import { useEffect, useMemo, useState } from "react"

type DashboardStudentResult = {
  studentId: string
  score: number
  totalItems: number
}

type DashboardExam = {
  id: string
  title: string
  date: string
  location?: string
  studentsEnrolled: number
  topics: { name: string }[]
  status: "Draft" | "Active" | "Completed"
  studentResults: DashboardStudentResult[]
}

type ExamRow = {
  exam_id?: string | null
  exam_title?: string | null
  exam_date?: string | null
  topics?: unknown
  status?: string | null
  location?: string | null
}

type ScoreResultRow = {
  exam_id?: string | null
  student_id?: string | null
  scores?: unknown
}

type DashboardUpcomingExam = {
  id: string
  title: string
  date: string
  room: string
  students: number
  topics: string[]
  daysLeft: number
}

type DashboardRecentExam = {
  id: string
  title: string
  date: string
  students: number
  status: "Draft" | "Active" | "Completed"
  avgScore: number
}

const getDayStart = (value: Date): Date =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate())

const parseExamDateValue = (value: string): Date | null => {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const calculateAverageScore = (exam: Pick<DashboardExam, "studentResults">): number => {
  const percentages = exam.studentResults
    .map((result) => {
      const totalItems = Number(result.totalItems)
      const score = Number(result.score)
      if (!Number.isFinite(totalItems) || totalItems <= 0 || !Number.isFinite(score)) {
        return null
      }
      return (score / totalItems) * 100
    })
    .filter((value): value is number => value !== null)

  if (percentages.length === 0) return 0
  return Math.round((percentages.reduce((sum, value) => sum + value, 0) / percentages.length) * 10) / 10
}


// ── Helpers ────────────────────────────────────────────────────────────────────

function getStatusColor(daysLeft: number) {
  if (daysLeft === 0) return "bg-red-500 text-white hover:bg-red-600"
  if (daysLeft === 1) return "bg-amber-500 text-white hover:bg-amber-600"
  return "bg-blue-500 text-white hover:bg-blue-600"
}

function getStatusLabel(daysLeft: number) {
  if (daysLeft === 0) return "Today"
  if (daysLeft === 1) return "Tomorrow"
  return "Scheduled"
}

function statusVariant(status: DashboardRecentExam["status"]) {
  if (status === "Completed") {
    return {
      icon: CheckCircle2,
      badgeClass: "bg-green-500 text-white",
      textColor: "text-green-600",
      cardClass: "bg-green-50 dark:bg-green-950/20",
    }
  }

  if (status === "Active") {
    return {
      icon: Activity,
      badgeClass: "bg-teal-700 text-white",
      textColor: "text-teal-700 dark:text-teal-400",
      cardClass: "bg-teal-50 dark:bg-teal-950/20",
    }
  }

  return {
    icon: AlertCircle,
    badgeClass: "bg-muted text-muted-foreground",
    textColor: "text-muted-foreground",
    cardClass: "bg-muted/40",
  }
}

const SkeletonLoader = () => (
  <div className="space-y-3 p-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    ))}
  </div>
)

const normalizeTopics = (raw: unknown): { name: string }[] => {
  const fromValues = (values: unknown[]): { name: string }[] =>
    values
      .map((item) => {
        if (typeof item === "string") {
          const name = item.trim()
          return name ? { name } : null
        }
        if (item && typeof item === "object") {
          const value = item as { name?: unknown; title?: unknown; topic?: unknown }
          const nameCandidate = value.name ?? value.title ?? value.topic
          const name = typeof nameCandidate === "string" ? nameCandidate.trim() : ""
          return name ? { name } : null
        }
        const fallback = String(item ?? "").trim()
        return fallback ? { name: fallback } : null
      })
      .filter((entry): entry is { name: string } => !!entry)
      .map((entry, idx) => ({ name: entry.name || `Topic ${idx + 1}` }))

  if (Array.isArray(raw)) {
    return fromValues(raw)
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim()
    if (!trimmed) return []
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) return fromValues(parsed)
    } catch {
      return trimmed
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
        .map((name) => ({ name }))
    }
  }

  return []
}

type ScorePayload = {
  totalScore?: number
  totalItems?: number
  topicScores?: Array<{ score?: number; maxScore?: number; total?: number }>
}

const parseScorePayload = (value: unknown): ScorePayload => {
  if (!value) return {}
  if (Array.isArray(value)) return { topicScores: value as ScorePayload["topicScores"] }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return { topicScores: parsed as ScorePayload["topicScores"] }
      return (parsed ?? {}) as ScorePayload
    } catch {
      return {}
    }
  }
  return value as ScorePayload
}

const resolveScoreTotals = (payload: ScorePayload): { score: number; totalItems: number } => {
  const score = Number(payload.totalScore)
  const totalItems = Number(payload.totalItems)
  if (Number.isFinite(score) && Number.isFinite(totalItems) && totalItems > 0) {
    return { score, totalItems }
  }

  const topicScores = payload.topicScores ?? []
  if (topicScores.length === 0) return { score: 0, totalItems: 0 }

  const totals = topicScores.reduce<{ score: number; totalItems: number }>(
    (acc, entry) => {
      const entryScore = Number(entry.score)
      const entryMax = Number(entry.total ?? entry.maxScore)
      acc.score += Number.isFinite(entryScore) ? entryScore : 0
      acc.totalItems += Number.isFinite(entryMax) ? entryMax : 0
      return acc
    },
    { score: 0, totalItems: 0 },
  )

  return totals
}

const deriveExamStatus = (status: string | null | undefined, examDate?: string | null) => {
  if (status === "Draft" || status === "Active" || status === "Completed") {
    return status
  }

  if (!examDate) return "Draft"
  const parsed = parseExamDateValue(examDate)
  if (!parsed) return "Draft"
  const today = getDayStart(new Date())
  const examDay = getDayStart(parsed)
  if (examDay.getTime() === today.getTime()) return "Active"
  if (examDay.getTime() < today.getTime()) return "Completed"
  return "Draft"
}

const formatExamDateLabel = (value: string): string => {
  const parsed = parseExamDateValue(value)
  if (!parsed) return value || "TBA"
  return parsed.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// ── Component ──────────────────────────────────────────────────────────────────

const InstructorDashboardPage = () => {
  const [instructorId, setInstructorId] = useState<string>()
  const [exams, setExams] = useState<DashboardExam[]>([])
  const [examsLoading, setExamsLoading] = useState(false)

  // Fetch instructor ID from auth
  useEffect(() => {
    const getInstructor = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setInstructorId(user.id)
      }
    }
    getInstructor()
  }, [])

  useEffect(() => {
    let active = true

    const loadExams = async () => {
      if (!instructorId) {
        if (active) {
          setExams([])
          setExamsLoading(false)
        }
        return
      }

      if (active) setExamsLoading(true)

      try {
        const { data: examRows, error: examError } = await supabase
          .from("exams")
          .select("*")
          .eq("created_by", instructorId)

        if (examError) throw examError

        const rows = (examRows ?? []) as ExamRow[]
        const examIds = rows
          .map((row) => row.exam_id)
          .filter((id): id is string => Boolean(id))

        let scoreRows: ScoreResultRow[] = []
        if (examIds.length > 0) {
          const { data, error } = await supabase
            .from("score_results")
            .select("exam_id, student_id, scores")
            .in("exam_id", examIds)

          if (error) {
            console.error("Error fetching score results:", error)
          } else {
            scoreRows = (data ?? []) as ScoreResultRow[]
          }
        }

        const scoresByExam = new Map<
          string,
          { results: DashboardStudentResult[]; studentIds: Set<string> }
        >()

        for (const scoreRow of scoreRows) {
          const examId = scoreRow.exam_id
          const studentId = scoreRow.student_id
          if (!examId || !studentId) continue

          const payload = parseScorePayload(scoreRow.scores)
          const totals = resolveScoreTotals(payload)
          const entry: DashboardStudentResult = {
            studentId,
            score: totals.score,
            totalItems: totals.totalItems,
          }

          const bucket = scoresByExam.get(examId) ?? {
            results: [],
            studentIds: new Set<string>(),
          }
          bucket.results.push(entry)
          bucket.studentIds.add(studentId)
          scoresByExam.set(examId, bucket)
        }

        const mappedExams: DashboardExam[] = rows.map((row) => {
          const examId = row.exam_id ?? ""
          const scoreBucket = scoresByExam.get(examId)
          return {
            id: examId,
            title: row.exam_title?.trim() || "Untitled Exam",
            date: row.exam_date || "",
            location: row.location ?? undefined,
            studentsEnrolled: scoreBucket?.studentIds.size ?? 0,
            topics: normalizeTopics(row.topics),
            status: deriveExamStatus(row.status, row.exam_date),
            studentResults: scoreBucket?.results ?? [],
          }
        })

        if (active) setExams(mappedExams)
      } catch (error) {
        console.error("Error loading instructor exams:", error)
        if (active) setExams([])
      } finally {
        if (active) setExamsLoading(false)
      }
    }

    void loadExams()

    return () => {
      active = false
    }
  }, [instructorId])

  const stats = useMemo(() => {
    const totalExams = exams.length

    const uniqueStudentIds = new Set<string>()
    for (const exam of exams) {
      for (const result of exam.studentResults) {
        const normalized = result.studentId.trim()
        if (normalized) {
          uniqueStudentIds.add(normalized)
        }
      }
    }

    const totalStudents =
      uniqueStudentIds.size > 0
        ? uniqueStudentIds.size
        : exams.reduce((sum, exam) => sum + Math.max(exam.studentsEnrolled, 0), 0)

    const allPercentages = exams.flatMap((exam) =>
      exam.studentResults
        .map((result) => {
          const totalItems = Number(result.totalItems)
          const score = Number(result.score)
          if (!Number.isFinite(totalItems) || totalItems <= 0 || !Number.isFinite(score)) {
            return null
          }
          return (score / totalItems) * 100
        })
        .filter((value): value is number => value !== null),
    )

    const avgScore =
      allPercentages.length > 0
        ? Math.round(
            (allPercentages.reduce((sum, value) => sum + value, 0) / allPercentages.length) * 10,
          ) / 10
        : 0

    return {
      totalExams,
      totalStudents,
      avgScore,
    }
  }, [exams])

  const upcomingExams = useMemo<DashboardUpcomingExam[]>(() => {
    const todayStart = getDayStart(new Date())

    return exams
      .map((exam) => {
        const parsedDate = parseExamDateValue(exam.date)
        if (!parsedDate) return null

        const examDateStart = getDayStart(parsedDate)
        const daysLeft = Math.ceil((examDateStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24))
        if (daysLeft < 0) return null

        return {
          id: exam.id,
          title: exam.title,
          date: exam.date,
          room: exam.location?.trim() || "TBA",
          students: exam.studentsEnrolled,
          topics: exam.topics.map((topic) => topic.name).filter(Boolean),
          daysLeft,
        }
      })
      .filter((exam): exam is DashboardUpcomingExam => !!exam)
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 5)
  }, [exams])

  const recentExams = useMemo<DashboardRecentExam[]>(() => {
    const sortedExams = [...exams].sort((a, b) => {
      const first = parseExamDateValue(a.date)
      const second = parseExamDateValue(b.date)
      const firstTs = first?.getTime() ?? -Infinity
      const secondTs = second?.getTime() ?? -Infinity
      return secondTs - firstTs
    })

    return sortedExams.slice(0, 5).map((exam) => ({
      id: exam.id,
      title: exam.title,
      date: exam.date,
      students: exam.studentsEnrolled,
      status: exam.status,
      avgScore: calculateAverageScore(exam),
    }))
  }, [exams])

  const summaryStats = useMemo(
    () => [
      {
        label: "Total Exams",
        value: (stats?.totalExams ?? 0).toString(),
        sub: "Exams created",
        icon: ClipboardList,
      },
      {
        label: "Students",
        value: (stats?.totalStudents ?? 0).toString(),
        sub: "Enrolled",
        icon: Users,
      },
      {
        label: "Avg. Score",
        value: `${stats?.avgScore ?? 0}%`,
        sub: "Class average",
        icon: TrendingUp,
      },
    ],
    [stats],
  )

  const upcomingLoading = examsLoading && upcomingExams.length === 0
  const recentLoading = examsLoading && recentExams.length === 0

  const recentActivity = [
    {
      id: 1,
      description: "Exam results updated",
      time: "2 hours ago",
    },
    {
      id: 2,
      description: "New student enrolled",
      time: "Yesterday",
    },
    {
      id: 3,
      description: "Exam created successfully",
      time: "2 days ago",
    },
  ]

  return (
    <ScrollArea className="flex-1">
      <main className="p-6 space-y-6 max-w-6xl mx-auto w-full">

        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Welcome back. Here is an overview of your exam activity.
          </p>
        </div>

        {/* Summary stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {summaryStats.map((stat) => (
            <SummaryStatsCard key={stat.label} stats={stat} />
          ))}
        </div>

        {/* Upcoming Exams */}
        <Card>
          <CardHeader className="border-b pb-4">
            <div className="flex items-center">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="size-4 text-blue-600" />
                Upcoming Exams
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {upcomingLoading ? (
              <SkeletonLoader />
            ) : upcomingExams.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-muted-foreground">No upcoming exams</p>
              </div>
            ) : (
              upcomingExams.map((exam, idx) => (
                <div key={exam.id}>
                  <div className="flex flex-col gap-3 px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{exam.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{exam.students} students</p>
                      </div>
                      <Badge className={getStatusColor(exam.daysLeft)}>
                        {getStatusLabel(exam.daysLeft)}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="size-3.5" />
                        {formatExamDateLabel(exam.date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="size-3.5" />
                        {exam.room}
                      </div>
                    </div>

                    {exam.topics.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-foreground">Topics Covered:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {exam.topics.map((topic: string) => (
                            <Badge key={topic} variant="secondary" className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {idx < upcomingExams.length - 1 && <Separator />}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Exams + Recent Activity */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Recent Exams */}
          <Card className="lg:col-span-3">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Recent Exams</CardTitle>
                <Button variant="link" asChild className="text-blue-600 hover:text-blue-700">
                  <a href="/instructor/exams" className="text-sm font-medium">
                    View all
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {recentLoading ? (
                <SkeletonLoader />
              ) : recentExams.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">No recent exams</p>
                </div>
              ) : (
                recentExams.map((exam) => {
                  const {
                    icon: StatusIcon,
                    badgeClass: statusBadgeClass,
                    textColor: statusTextColor,
                    cardClass,
                  } = statusVariant(exam.status)
                  const isCompleted = exam.status === "Completed"
                  
                  return (
                    <div
                      key={exam.id}
                      className={`group block rounded-lg border p-4 transition-all duration-200 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 ${cardClass}`}
                    >
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-blue-600 transition-colors">
                              {exam.title}
                            </h3>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span>{formatExamDateLabel(exam.date)}</span>
                              <span>•</span>
                              <span>{exam.students} students</span>
                            </div>
                          </div>
                          <Badge className={`${statusBadgeClass} border-0 flex items-center gap-1`}>
                            <StatusIcon className="size-3" />
                            {exam.status}
                          </Badge>
                        </div>

                        {/* Score bar if graded */}
                        {isCompleted && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Average Score</span>
                              <span className={`font-semibold ${statusTextColor}`}>{exam.avgScore}%</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                              <div
                                className="h-full rounded-full bg-green-500"
                                style={{ width: `${exam.avgScore}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 shrink-0 mt-0.5">
                    <Activity className="size-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm leading-snug text-foreground">{item.description}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

      </main>
    </ScrollArea>
  )
}

export default InstructorDashboardPage
