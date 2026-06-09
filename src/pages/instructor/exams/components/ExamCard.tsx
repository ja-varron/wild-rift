import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronRight, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Exam } from "@/model/exam"

type ExamCardProps = {
  exam: Exam
  onSelect: (exam_id: string) => void
  onEdit?: (exam: Exam) => void
  onDelete?: (exam: Exam) => void
  isDeleting?: boolean
}

const ExamCard = ({ exam, onSelect, onEdit, onDelete, isDeleting }: ExamCardProps) => {
  const parsedDate = new Date(exam.exam_date)
  const displayDate = Number.isNaN(parsedDate.getTime())
    ? exam.exam_date
    : parsedDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })

  return (
    <div className="rounded-lg border p-4 transition-colors hover:border-teal-300 dark:hover:border-teal-800">
      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-lg font-semibold line-clamp-2">{exam.exam_title}</h3>
      </div>

      <div className="mb-4 space-y-2 text-sm text-gray-600">
        <p className="line-clamp-1">{exam.course?.course_name}</p>
        <p className="line-clamp-1">Created by {exam.profile?.first_name} {exam.profile?.last_name}</p>
        <div className="flex items-center gap-2">
          <Calendar className="size-4" />
          <span>{displayDate}</span>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded bg-gray-100 p-2">
          <p className="font-medium text-gray-600">Items</p>
          <p className="font-semibold">{exam.total_items}</p>
        </div>
        <div className="rounded bg-gray-100 p-2">
          <p className="font-medium text-gray-600">Passing</p>
          <p className="font-semibold">{exam.passing_rate}%</p>
        </div>
      </div>

      {exam.topics.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {exam.topics.slice(0, 2).map((topic, index) => (
            <Badge key={`${topic}-${index}`} variant="outline" className="text-xs">
              {topic}
            </Badge>
          ))}
          {exam.topics.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{exam.topics.length - 2} more
            </Badge>
          )}
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-full transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
        onClick={() => onSelect(exam.exam_id!)}
      >
        View Details <ChevronRight className="ml-1 size-4" />
      </Button>

      {onEdit && onDelete && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => onEdit(exam)}
          >
            <Pencil className="size-3.5" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5"
            onClick={() => onDelete(exam)}
            disabled={isDeleting}
          >
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        </div>
      )}
    </div>
  )
}

export { ExamCard }