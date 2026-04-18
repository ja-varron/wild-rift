import { useMemo } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts"
import { ChartCard } from "./components/ChartCard"
import { UpcomingExams } from "./components/UpcomingExams"
import { RecentExams } from "./components/RecentExams"
import { SummaryStatsCard } from "@/components/custom/SummaryStatsCard"
import { useFetchProfile } from "@/lib/supabase/authentication/context/use-fetch-profile"
import { useFetchStudentExams } from "@/lib/supabase/exam/context/use-fetch-student-exams"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { BarChart3, ClipboardCheck, MessageSquare, Target } from "lucide-react"

const lineChartConfig: ChartConfig = {
  score: {
    label: "Score",
    color: "#0f766e",
  },
}

const StudentDashboardPage = () => {
  const { authUser, userProfile, isLoading: isLoadingUser } = useFetchProfile()
  const { data: exams, isLoading: isLoadingExams } = useFetchStudentExams(authUser?.id)
  const submittedExams = useMemo(() => (exams || []).filter((exam) => exam.attempted === true), [exams])

  const summaryStats = useMemo(() => {
    if (!exams || exams.length === 0) {
      return [
        { label: "Total Exams", value: "0", color: "text-foreground", sub: "No attempts yet", icon: ClipboardCheck },
        { label: "Average Score", value: "N/A", color: "text-foreground", sub: "Awaiting results", icon: Target },
        { label: "Passed Exams", value: "0", color: "text-foreground", sub: "Target: 75%", icon: BarChart3 },
        { label: "Feedback Received", value: "0", color: "text-foreground", sub: "No instructor notes", icon: MessageSquare },
      ]
    }

    const totalExams = exams.length
    const resultsCount = submittedExams.length
    const passedExams = submittedExams.filter((e) => e.passed).length
    const averageScore = resultsCount > 0
      ? Math.round(submittedExams.reduce((acc, e) => acc + e.percentage, 0) / resultsCount)
      : null
    const passRate = resultsCount > 0 ? Math.round((passedExams / resultsCount) * 100) : 0
    const feedbackCount = resultsCount

    return [
      { label: "Total Exams", value: totalExams.toString(), color: "text-foreground", sub: "Assigned to you", icon: ClipboardCheck },
      {
        label: "Average Score",
        value: averageScore === null ? "N/A" : `${averageScore}%`,
        color: averageScore === null ? "text-foreground" : averageScore >= 75 ? "text-green-600" : "text-red-500",
        sub: averageScore === null ? "No submitted results yet" : averageScore >= 75 ? "Above passing mark" : "Below passing mark",
        icon: Target,
      },
      {
        label: "Passed Exams",
        value: passedExams.toString(),
        color: resultsCount === 0 ? "text-foreground" : passRate >= 50 ? "text-green-600" : "text-amber-600",
        sub: resultsCount === 0 ? "No submitted results yet" : `${passRate}% pass rate`,
        icon: BarChart3,
      },
      { label: "Feedback Received", value: feedbackCount.toString(), color: "text-foreground", sub: resultsCount === 0 ? "No submitted results yet" : "Instructor comments ready", icon: MessageSquare },
    ]
  }, [exams, submittedExams])

  const scoreTrend = useMemo(() => {
    if (!submittedExams) return []
    // Create a simplified name for the chart
    return [...submittedExams].reverse().map((e, index) => ({
      exam: `Exam ${index + 1}`,
      score: e.percentage,
    }))
  }, [submittedExams])

  const welcomeMessage = useMemo(() => {
    if (isLoadingUser) return "Welcome back! Here's your activity summary."
    if (!userProfile) return "Welcome! Here's your activity summary."
    return `Welcome back, ${userProfile.getFirstName}! Here's your activity summary.`
  }, [userProfile, isLoadingUser])

  const topInsight = useMemo(() => {
    if (!exams || exams.length === 0) {
      return "Take your first exam to unlock insights and performance trends."
    }
    const latest = submittedExams[0]
    if (!latest) {
      return "You have assigned exams, but no submitted results yet."
    }
    return `Latest result: ${latest.percentage}% on ${latest.title}`
  }, [exams, submittedExams])

  return (
    <ScrollArea className="flex-1">
      <main className="p-6 space-y-6 max-w-6xl mx-auto w-full">
        <div className="rounded-2xl border bg-gradient-to-br from-teal-50 via-white to-sky-50 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
              <p className="text-muted-foreground text-sm mt-1.5">
                {welcomeMessage}
              </p>
            </div>
            <Badge className="bg-teal-700 text-white hover:bg-teal-700">Progress Snapshot</Badge>
          </div>
          <p className="mt-4 text-sm text-teal-800/90">{topInsight}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(isLoadingUser || isLoadingExams) ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
          ) : (
            summaryStats.map((stat) => (
              <SummaryStatsCard key={stat.label} stats={stat} />
            ))
          )}
        </div>

        <ChartCard cardTitle="Overall Score Trend" cardDescription="Your scores across submitted exams">
          {(isLoadingExams) ? <Skeleton className="h-48 w-full sm:h-60 lg:h-72" /> :
            scoreTrend.length === 0 ? (
              <div className="flex h-48 w-full items-center justify-center text-sm text-muted-foreground sm:h-60 lg:h-72">
                No submitted results yet.
              </div>
            ) : (
              <ChartContainer config={lineChartConfig} className="h-48 w-full sm:h-60 lg:h-72">
                <LineChart data={scoreTrend} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="exam"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  <ReferenceLine y={75} label={{ value: "Passing", position: 'insideTopLeft', fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#0f766e"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#0f766e", strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartContainer>
            )
          }
        </ChartCard>

        {(isLoadingExams) ? <Skeleton className="h-60 w-full" /> :
          <UpcomingExams />
        }

        {(isLoadingExams) ? <Skeleton className="h-60 w-full" /> :
          <RecentExams />
        }

      </main>
    </ScrollArea>
  )
}

export default StudentDashboardPage

