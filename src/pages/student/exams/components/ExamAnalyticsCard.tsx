import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Award, BarChart3, CheckCircle2, MessageSquare, Target, TrendingDown, TrendingUp } from "lucide-react"

interface TopicScore {
  topic: string
  score: number
  maxScore: number
}

interface FeedbackItem {
  type: "strength" | "improvement" | "warning"
  text: string
}

interface ExamRecord {
  id: number
  title: string
  date: string
  instructor: string
  score: number
  totalItems: number
  passed: boolean
  topics: TopicScore[]
  feedback: FeedbackItem[]
  recommendation: string
}

function scoreColor(score: number) {
  if (score >= 75) return "text-green-600"
  return "text-red-500"
}

function progressBarColor(pct: number) {
  if (pct >= 75) return "[&>div]:bg-teal-700"
  if (pct >= 60) return "[&>div]:bg-yellow-500"
  return "[&>div]:bg-red-500"
}

function feedbackIcon(type: FeedbackItem["type"]) {
  if (type === "strength") return <CheckCircle2 className="size-4 text-green-500 shrink-0 mt-0.5" />
  if (type === "improvement") return <TrendingUp className="size-4 text-yellow-500 shrink-0 mt-0.5" />
  return <AlertTriangle className="size-4 text-red-500 shrink-0 mt-0.5" />
}

function feedbackBg(type: FeedbackItem["type"]) {
  if (type === "strength") return "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900"
  if (type === "improvement") return "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900"
  return "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900"
}

const ExamAnalyticsCard = ({ exam }: { exam: ExamRecord }) => {
  const pct = Math.round((exam.score / exam.totalItems) * 100)

  return (
    <Card className="overflow-hidden">
      {/* Header row */}
      <CardHeader className="border-b pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold">{exam.title}</CardTitle>
            <CardDescription className="mt-0.5">
              {exam.date} · {exam.instructor}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={exam.passed ? "default" : "destructive"}
              className={exam.passed ? "bg-green-500 hover:bg-green-500" : ""}
            >
              {exam.passed ? "Passed" : "Failed"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs defaultValue="score">
          <div className="px-5 pt-4">
            <TabsList>
              <TabsTrigger value="score" className="gap-1.5">
                <Award className="size-3.5" /> Score
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-1.5">
                <BarChart3 className="size-3.5" /> Analytics
              </TabsTrigger>
              <TabsTrigger value="feedback" className="gap-1.5">
                <MessageSquare className="size-3.5" /> Feedback
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── Score tab ── */}
          <TabsContent value="score" className="px-5 pb-5 pt-4 space-y-5">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Score circle */}
              <div className="relative flex size-24 shrink-0 items-center justify-center rounded-full border-4 border-muted">
                <div
                  className={`absolute inset-0 rounded-full border-4 ${exam.passed ? "border-teal-600" : "border-red-500"}`}
                  style={{
                    clipPath: `polygon(50% 50%, -50% -50%, ${pct >= 50 ? "150% -50%" : `${pct * 3}% -50%`}, 150% 150%, -50% 150%)`,
                  }}
                />
                <div className="flex flex-col items-center leading-none">
                  <span className={`text-2xl font-bold tabular-nums ${scoreColor(pct)}`}>
                    {exam.score}
                  </span>
                  <span className="text-xs text-muted-foreground">/{exam.totalItems}</span>
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Overall Score</span>
                  <span className={`font-semibold ${scoreColor(pct)}`}>{pct}%</span>
                </div>
                <Progress value={pct} className={`h-3 ${progressBarColor(pct)}`} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Passing mark: 75%</span>
                  <span className={exam.passed ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                    {exam.passed ? `+${pct - 75}pts above passing` : `${75 - pct}pts below passing`}
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Analytics tab ── */}
          <TabsContent value="analytics" className="px-5 pb-5 pt-4 space-y-5">
            <p className="text-sm font-medium">Performance by Topic</p>

            {/* Bar-style comparison */}
            <div className="space-y-3">
              {exam.topics.map((t) => {
                const tPct = Math.round((t.score / t.maxScore) * 100)
                const diff = tPct - 75
                return (
                  <div key={t.topic} className="flex items-center gap-3">
                    <span className="w-24 sm:w-44 text-xs text-muted-foreground truncate">{t.topic}</span>
                    <div className="relative flex-1 h-6 rounded bg-muted overflow-hidden">
                      {/* 75% line */}
                      <div className="absolute inset-y-0 left-[75%] w-px bg-border z-10" />
                      <div
                        className={`h-full rounded transition-all ${tPct >= 75 ? "bg-teal-600" : tPct >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                        style={{ width: `${tPct}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-1 w-20 justify-end">
                      <span className={`text-xs font-semibold ${scoreColor(tPct)}`}>{tPct}%</span>
                      {diff >= 0
                        ? <TrendingUp className="size-3.5 text-green-500 shrink-0" />
                        : <TrendingDown className="size-3.5 text-red-500 shrink-0" />}
                    </div>
                  </div>
                )
              })}
            </div>

            <Separator />

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-muted/50 p-3 text-center space-y-0.5">
                <p className="text-xs text-muted-foreground">Highest</p>
                <p className="text-sm font-bold text-green-600">
                  {Math.max(...exam.topics.map((t) => Math.round((t.score / t.maxScore) * 100)))}%
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {exam.topics.reduce((a, b) =>
                    b.score / b.maxScore > a.score / a.maxScore ? b : a
                  ).topic.split(" ")[0]}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center space-y-0.5">
                <p className="text-xs text-muted-foreground">Average</p>
                <p className={`text-sm font-bold ${scoreColor(pct)}`}>{pct}%</p>
                <p className="text-xs text-muted-foreground">All topics</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center space-y-0.5">
                <p className="text-xs text-muted-foreground">Lowest</p>
                <p className="text-sm font-bold text-red-500">
                  {Math.min(...exam.topics.map((t) => Math.round((t.score / t.maxScore) * 100)))}%
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {exam.topics.reduce((a, b) =>
                    b.score / b.maxScore < a.score / a.maxScore ? b : a
                  ).topic.split(" ")[0]}
                </p>
              </div>
            </div>
          </TabsContent>

          {/* ── Feedback tab ── */}
          <TabsContent value="feedback" className="px-5 pb-5 pt-4 space-y-5">
            {/* Instructor feedback items */}
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <MessageSquare className="size-3.5 text-muted-foreground" />
                Instructor Feedback
              </p>
              <div className="space-y-2">
                {exam.feedback.map((fb, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${feedbackBg(fb.type)}`}
                  >
                    {feedbackIcon(fb.type)}
                    <span>{fb.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Recommendation */}
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Target className="size-3.5 text-muted-foreground" />
                Recommendation
              </p>
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:bg-blue-950/20 dark:border-blue-900 dark:text-blue-200">
                {exam.recommendation}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export { ExamAnalyticsCard }