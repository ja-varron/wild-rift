import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Target,
  TrendingUp,
  TrendingDown,
  Award,
  BarChart3,
} from "lucide-react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts"
import type { ExamTopic, StudentResult } from "../types"

// ── Props ──────────────────────────────────────────────────────────────────────

interface ExamAnalyticsPanelProps {
  results: StudentResult[]
  topics: ExamTopic[]
  passingRate: number
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function scoreColor(score: number, passing: number) {
  return score >= passing ? "text-green-600" : "text-red-500"
}

const distChartConfig: ChartConfig = {
  count: { label: "Students", color: "#0f766e" },
}

// ── Component ──────────────────────────────────────────────────────────────────

export function ExamAnalyticsPanel({
  results,
  topics,
  passingRate,
}: ExamAnalyticsPanelProps) {
  // ── Empty state ──
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BarChart3 className="size-8 text-muted-foreground mb-2" />
        <p className="text-sm font-medium">No analytics available</p>
        <p className="text-xs text-muted-foreground mt-1">
          Scan and grade student papers to see exam analytics.
        </p>
      </div>
    )
  }

  // ── Derived data ──
  const scores = results.map((r) =>
    Math.round((r.score / r.totalItems) * 100),
  )
  const avgScore = Math.round(
    scores.reduce((a, b) => a + b, 0) / scores.length,
  )
  const passRate = Math.round(
    (results.filter((r) => r.passed).length / results.length) * 100,
  )
  const highest = Math.max(...scores)
  const lowest = Math.min(...scores)

  // Topic averages
  const topicAvgs = topics.map((topic) => {
    const topicScores = results
      .map((r) => r.topicScores.find((ts) => ts.topicId === topic.id))
      .filter(Boolean)
    if (topicScores.length === 0) return { topic: topic.name, avg: 0 }
    const avg = Math.round(
      topicScores.reduce(
        (sum, ts) => sum + (ts!.score / ts!.maxScore) * 100,
        0,
      ) / topicScores.length,
    )
    return { topic: topic.name, avg }
  })

  // Score distribution
  const ranges = [
    { range: "0–49", min: 0, max: 49 },
    { range: "50–59", min: 50, max: 59 },
    { range: "60–69", min: 60, max: 69 },
    { range: "70–74", min: 70, max: 74 },
    { range: "75–84", min: 75, max: 84 },
    { range: "85–100", min: 85, max: 100 },
  ]
  const distribution = ranges.map(({ range, min, max }) => ({
    range,
    count: scores.filter((s) => s >= min && s <= max).length,
    min,
  }))

  const summaryStats = [
    {
      label: "Average Score",
      value: `${avgScore}%`,
      icon: Target,
      color: scoreColor(avgScore, passingRate),
    },
    {
      label: "Pass Rate",
      value: `${passRate}%`,
      icon: Award,
      color: passRate >= 50 ? "text-green-600" : "text-red-500",
    },
    {
      label: "Highest Score",
      value: `${highest}%`,
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      label: "Lowest Score",
      value: `${lowest}%`,
      icon: TrendingDown,
      color: "text-red-500",
    },
  ]

  return (
    <div className="space-y-6">
      {/* ── Summary stat cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {summaryStats.map((stat) => (
          <Card key={stat.label} className="py-4">
            <CardContent className="px-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
                <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                  <stat.icon className="size-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Topic performance bars ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Performance by Topic
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4 space-y-3">
          {topicAvgs.map((t) => (
            <div key={t.topic} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground truncate">
                  {t.topic}
                </span>
                <span
                  className={`font-semibold ${scoreColor(t.avg, passingRate)}`}
                >
                  {t.avg}%
                </span>
              </div>
              <div className="relative h-5 rounded bg-muted overflow-hidden">
                {/* 75% passing mark line */}
                <div className="absolute inset-y-0 left-[75%] w-px bg-border z-10" />
                <div
                  className={`h-full rounded transition-all ${
                    t.avg >= 75
                      ? "bg-teal-600"
                      : t.avg >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${t.avg}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Score distribution chart ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Score Distribution
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <ChartContainer
            config={distChartConfig}
            className="h-48 w-full sm:h-60"
          >
            <BarChart
              data={distribution}
              margin={{ top: 8, right: 16, left: -16, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="range"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {distribution.map((entry, idx) => {
                  const color =
                    entry.min >= 75
                      ? "#0f766e"
                      : entry.min >= 60
                        ? "#eab308"
                        : "#ef4444"
                  return <Cell key={idx} fill={color} />
                })}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
