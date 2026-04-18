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
import { useFetchInstructorExams } from "@/lib/supabase/exam/context/use-fetch-instructor-exams"
import { useEffect, useMemo, useState } from "react"
import type { Exam } from "../exams/types"

type DashboardUpcomingExam = {
  id: number
  title: string
  date: string
  room: string
  students: number
  topics: string[]
  daysLeft: number
}

type DashboardRecentExam = {
  id: number
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

const calculateAverageScore = (exam: Pick<Exam, "studentResults">): number => {
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

// ── Component ──────────────────────────────────────────────────────────────────

const InstructorDashboardPage = () => {
  const [instructorId, setInstructorId] = useState<string>()

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

  const { data: exams = [], isLoading: examsLoading } = useFetchInstructorExams(instructorId)

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
                        {exam.date}
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
                              <span>{exam.date}</span>
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
