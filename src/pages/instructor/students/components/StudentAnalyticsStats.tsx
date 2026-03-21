import { Card, CardContent } from "@/components/ui/card"
import {
  Target,
  Award,
  TrendingUp,
  ClipboardList,
} from "lucide-react"
import type { StudentAnalytics } from "../types"
import { scoreColor } from "../types"

interface StudentAnalyticsStatsProps {
  analytics: StudentAnalytics
  examCount: number
}

const StudentAnalyticsStats = ({ analytics, examCount }: StudentAnalyticsStatsProps) => {
  const stats = [
    { label: "Average Score", value: `${analytics.avgScore}%`, icon: Target, color: scoreColor(analytics.avgScore) },
    { label: "Pass Rate", value: `${analytics.passRate}%`, icon: Award, color: analytics.passRate >= 50 ? "text-green-600" : "text-red-500" },
    { label: "Highest", value: `${analytics.highest}%`, icon: TrendingUp, color: "text-green-600" },
    { label: "Exams Taken", value: `${examCount}`, icon: ClipboardList, color: "text-foreground" },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="py-4">
          <CardContent className="px-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <div className="flex size-8 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
                <stat.icon className="size-4 text-teal-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default StudentAnalyticsStats
