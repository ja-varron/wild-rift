import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, ChevronRight } from "lucide-react"
import { ExamResult } from "@/model/exam"
import { Link } from "react-router-dom"

type RecentExamsListProps = {
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

const RecentExamsList = ({ recentResults }: RecentExamsListProps) => {
  if (recentResults.length === 0) {
    return (
      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base font-semibold">Recent Exams</CardTitle>
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
        <div className="flex items-center">
          <CardTitle className="text-base font-semibold">Recent Exams</CardTitle>
          <span className="ml-auto text-xs text-muted-foreground font-medium">
            {recentResults.length} exams
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {recentResults.map((r) => {
          const attempted = r.attempted === true
          const isPassed = attempted && r.percentage >= 75
          
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
                  {attempted ? (
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`${isPassed ? "bg-green-500" : "bg-red-500"} text-white border-0 flex items-center gap-1`}
                      >
                        {isPassed ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
                        {isPassed ? "Passed" : "Failed"}
                      </Badge>
                    </div>
                  ) : null}
                </div>

                {/* Score Bar and Percentage */}
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Score</span>
                    <span className={`text-sm font-bold ${attempted ? scoreColor(r.percentage) : "text-muted-foreground"}`}>
                      {attempted ? `${r.percentage}%` : "No result yet"}
                    </span>
                  </div>
                  {attempted ? (
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          r.percentage >= 75
                            ? "bg-green-500"
                            : r.percentage >= 60
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${r.percentage}%` }}
                      />
                    </div>
                  ) : (
                    <div className="rounded border border-dashed px-2 py-1 text-xs text-muted-foreground">
                      Paper not scanned or result not submitted yet.
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground text-right">
                    {attempted ? `${r.score}/${r.total_items} items` : "No submitted score"}
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

export { RecentExamsList }
