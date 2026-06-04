import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { BookOpenText, Link2 } from "lucide-react"
import { fetchExamMaterials } from "@/lib/supabase/exam/material-service"

type ExamLearningMaterialsProps = {
  examId: number
}

const formatDateTime = (value?: string) => {
  if (!value) return "Unknown date"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Unknown date"
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export const ExamLearningMaterials = ({ examId }: ExamLearningMaterialsProps) => {
  const { data: materials = [], isLoading } = useQuery({
    queryKey: ["examMaterials", examId],
    queryFn: () => fetchExamMaterials(examId),
    enabled: Number.isFinite(examId),
    staleTime: 1000 * 60 * 5,
  })

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <BookOpenText className="size-4 text-teal-700" />
        <h2 className="text-base font-semibold">Learning Materials</h2>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(2)].map((_, idx) => (
            <Skeleton key={idx} className="h-12" />
          ))}
        </div>
      ) : materials.length === 0 ? (
        <p className="text-sm text-muted-foreground">No review materials uploaded yet.</p>
      ) : (
        <div className="space-y-2">
          {materials.map((material) => (
            <div key={material.id} className="flex flex-col gap-2 rounded-md border px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{material.name}</p>
                <p className="text-xs text-muted-foreground">
                  {material.instructorName || "Instructor"} · {formatDateTime(material.uploadedAt)}
                </p>
              </div>

              <Button variant="outline" size="sm" className="gap-1.5" asChild>
                <a href={material.url} target="_blank" rel="noreferrer">
                  <Link2 className="size-3.5" />
                  Open
                </a>
              </Button>
            </div>
          ))}
        </div>
      )}

      <Badge variant="secondary" className="w-fit">
        Use these resources to review before and after scanning results.
      </Badge>
    </div>
  )
}
