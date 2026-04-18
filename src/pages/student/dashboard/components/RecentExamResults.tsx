import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, ChevronRight, CheckCircle2, XCircle, Clock3 } from "lucide-react"
import { ExamResult } from "@/model/exam"
import { Link } from "react-router-dom"

type RecentExamResultsProps = {
  recentResults: ExamResult[]
}

function scoreColor(score: number) {
  if (score >= 75) return "text-green-600"
  if (score >= 60) return "text-amber-600"
  return "text-red-600"
}

function scoreBackground(score: number) {
  if (score >= 75) return "bg-green-100 dark:bg-green-950"
  if (score >= 60) return "bg-amber-100 dark:bg-amber-950"
  return "bg-red-100 dark:bg-red-950"
}

function getStatusAndIcon(score: number, attempted: boolean) {
  if (!attempted) {
    return { label: "Pending", color: "bg-slate-500", icon: Clock3 }
  }
  if (score >= 75) {
    return { label: "Passed", color: "bg-green-500", icon: CheckCircle2 }
  }
  return { label: "Failed", color: "bg-red-500", icon: XCircle }
}

const RecentExamResults = ({ recentResults }: RecentExamResultsProps) => {
  if (recentResults.length === 0) {
    return (
      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base font-semibold">Recent Exam Results</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground text-sm">No exams yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Recent Exam Results</CardTitle>
          <Button variant="link" asChild className="text-blue-600 hover:text-blue-700">
            <Link to="/student/exams">
              View all <TrendingUp className="size-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {recentResults.slice(0, 3).map((r) => {
          const attempted = r.attempted ?? true
          const { label: statusLabel, color: statusColor, icon: StatusIcon } = getStatusAndIcon(r.percentage, attempted)
          
          return (
            <Link
              key={r.id}
              to={`/student/exams/${r.id}`}
              className={`group block rounded-lg border p-4 transition-all duration-200 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 ${attempted ? scoreBackground(r.percentage) : "bg-slate-100 dark:bg-slate-900"}`}
            >
              <div className="space-y-3">
                {/* Header: Title and Status Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-blue-600 transition-colors">
                      {r.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(r.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`${statusColor} text-white border-0 flex items-center gap-1`}
                    >
                      <StatusIcon className="size-3" />
                      {statusLabel}
                    </Badge>
                  </div>
                </div>

                {/* Score Bar and Percentage */}
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Score</span>
                    <span className={`text-sm font-bold ${scoreColor(r.percentage)}`}>
                      {attempted ? `${r.percentage}%` : "Pending"}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        !attempted
                          ? "bg-slate-400"
                          : r.percentage >= 75
                          ? "bg-green-500"
                          : r.percentage >= 60
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${attempted ? r.percentage : 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-right">
                    {attempted ? `${r.score}/${r.total_items} items` : "Not yet scanned"}
                  </p>
                </div>

                {/* Footer with Details Button */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">
                    {r.total_items} questions
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="group-hover:bg-blue-100 dark:group-hover:bg-blue-950 transition-colors"
                    asChild
                  >
                    <span>
                      Details <ChevronRight className="size-4 ml-1" />
                    </span>
                  </Button>
                </div>
              </div>
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}

export { RecentExamResults }