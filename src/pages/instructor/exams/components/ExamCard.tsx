import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Calendar, ClipboardList } from "lucide-react"
import type { Exam } from "@/model/exam"

type ExamCardProps = {
  exam: Exam
  onSelect: (examId: string) => void
}

const ExamCard = ({ exam, onSelect }: ExamCardProps) => {
  return (
    <Card
      className="group cursor-pointer transition-colors hover:border-teal-300 dark:hover:border-teal-800"
      onClick={() => onSelect(exam.getExamId)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold line-clamp-2">
            {exam.getExamTitle}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="size-3.5 shrink-0" />
            <span>{exam.getExamDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ClipboardList className="size-3.5 shrink-0" />
            <span>
              {exam.getTotalItems} items ·{" "}
              {exam.getPassingRate}% passing
            </span>
          </div>
        </div>

        <Separator />

        <div className="flex flex-wrap gap-1.5">
          {exam.getTopics.map((topic) => (
            <Badge
              key={topic}
              variant="outline"
              className="text-xs font-normal"
            >
              {topic}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export { ExamCard }