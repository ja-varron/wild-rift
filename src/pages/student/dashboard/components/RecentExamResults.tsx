import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { TrendingDown, TrendingUp } from "lucide-react"

type RecentResult = {
  id: number
  title: string
  date: string
  score: number
  total: number
  passed: boolean
}

type RecentExamResultsProps = {
  recentResults: RecentResult[]
}

function scoreColor(score: number) {
  if (score >= 75) return "text-green-500"
  return "text-red-500"
}

const RecentExamResults = ({ recentResults }: RecentExamResultsProps) => {
  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Recent Exam Results</CardTitle>
          <button className="text-sm text-green-600 hover:underline font-medium flex items-center gap-1">
            View all <TrendingUp className="size-3.5" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {recentResults.map((r, idx) => (
          <div key={r.id}>
            <div className="flex items-center justify-between px-5 py-3.5">
              <div>
                <p className="text-sm font-medium">{r.title}</p>
                <p className="text-xs text-muted-foreground">{r.date}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${scoreColor(r.score)}`}>
                  {r.score}/{r.total}
                </span>
                {r.passed
                  ? <TrendingUp className="size-4 text-green-500" />
                  : <TrendingDown className="size-4 text-red-500" />}
              </div>
            </div>
            {idx < recentResults.length - 1 && <Separator />}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export { RecentExamResults }