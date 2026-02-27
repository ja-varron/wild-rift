import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { StudentSidebar } from "@/pages/student/components/StudentSidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  TooltipProvider,
} from "@/components/ui/tooltip"
import { TopBar } from "../components/TopBar"
import { SummaryCard } from "./components/SummaryCard"
import { RecentExamResults } from "./components/RecentExamResults"
import { ChartCard } from "./components/ChartCard"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

// ── Static data ────────────────────────────────────────────────────────────────

const summaryStats = [
  { label: "Total Exams", value: "2", color: "text-foreground", sub: "" },
  { label: "Average Score", value: "80%", color: "text-green-500", sub: "" },
  { label: "Passed Exams", value: "2", color: "text-green-500", sub: "" },
  { label: "Feedback Received", value: "2", color: "text-foreground", sub: "" },
]

type RecentResult = {
  id: number
  title: string
  date: string
  score: number
  total: number
  passed: boolean
}

const recentResult: RecentResult[] = [
  { id: 1, title: "Nursing Board Mock Exam 3", date: "Feb 15, 2026", score: 82, total: 100, passed: true },
  { id: 2, title: "Nursing Board Mock Exam 2", date: "Jan 20, 2026", score: 76, total: 100, passed: true },
  { id: 3, title: "Pharmacology Quiz 1", date: "Jan 5, 2026", score: 61, total: 100, passed: false },
]

const scoreTrend = [
  { exam: "Mock 1", score: 71 },
  { exam: "Mock 2", score: 76 },
  { exam: "Mock 3", score: 82 },
]

const lineChartConfig: ChartConfig = {
  score: {
    label: "Score",
    color: "#0f766e",
  },
}

// ── Component ──────────────────────────────────────────────────────────────────

const StudentDashboardPage = () => {
  return (
    <SidebarProvider>
      <TooltipProvider>
        <div className="flex min-h-screen w-full bg-background">
          {/* ── Sidebar ── */}
          <StudentSidebar />

          {/* ── Main content ── */}
          <SidebarInset className="flex flex-col flex-1 min-w-0">
            {/* Top bar */}
            <TopBar navigator="Dashboard" />

            {/* Page body */}
            <ScrollArea className="flex-1">
              <main className="p-6 space-y-6 max-w-6xl mx-auto w-full">

                {/* Page title */}
                <div>
                  <h1 className="text-2xl font-bold">Student Dashboard</h1>
                  <p className="text-muted-foreground text-sm mt-0.5">
                    Welcome back, Juan! Here's your activity summary.
                  </p>
                </div>

                {/* ── Summary stat cards ── */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {summaryStats.map((stat) => (
                    <SummaryCard key={stat.label} stat={stat} />
                  ))}
                </div>

                {/* Score Trend */}
                <ChartCard cardTitle="Overall Score Trend" cardDescription="Your scores across all mock exams">
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
                </ChartCard>

                {/* Recent Exam Results */}
                <RecentExamResults recentResults={recentResult} />
              </main>
            </ScrollArea>
          </SidebarInset>
        </div>
      </TooltipProvider>
    </SidebarProvider>
  )
}

export default StudentDashboardPage
