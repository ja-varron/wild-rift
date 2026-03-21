import { Card, CardContent } from "@/components/ui/card"
import {
  Users,
  BookOpen,
  ClipboardList,
  TrendingUp,
} from "lucide-react"
import type { Student } from "../types"

interface StudentSummaryStatsProps {
  students: Student[]
}

const StudentSummaryStats = ({ students }: StudentSummaryStatsProps) => {
  const allResults = students.flatMap((s) => s.examResults)
  const avgScore =
    allResults.length > 0
      ? Math.round(
          allResults.reduce((sum, r) => sum + Math.round((r.score / r.totalItems) * 100), 0) /
            allResults.length,
        )
      : 0

  const stats = [
    { label: "Total Students", value: `${students.length}`, icon: Users },
    { label: "Courses", value: `${new Set(students.map((s) => s.course)).size}`, icon: BookOpen },
    { label: "Exams Taken", value: `${allResults.length}`, icon: ClipboardList },
    { label: "Avg. Score", value: `${avgScore}%`, icon: TrendingUp },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="py-5">
          <CardContent className="px-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <div className="flex size-9 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
                <stat.icon className="size-5 text-teal-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default StudentSummaryStats
