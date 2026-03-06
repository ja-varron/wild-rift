import { Separator } from "@/components/ui/separator"
import {
  BookOpen,
  FileText,
  GraduationCap,
  UserCog,
} from "lucide-react"

interface CourseSummaryBarProps {
  totalCourses: number
  totalStudents: number
  totalInstructors: number
  totalSubjects: number
}

const CourseSummaryBar = ({
  totalCourses,
  totalStudents,
  totalInstructors,
  totalSubjects,
}: CourseSummaryBarProps) => {
  const items = [
    { icon: BookOpen, count: totalCourses, label: "examination" },
    { icon: GraduationCap, count: totalStudents, label: "student" },
    { icon: UserCog, count: totalInstructors, label: "instructor" },
    { icon: FileText, count: totalSubjects, label: "subject" },
  ]

  return (
    <div className="flex items-center gap-3">
      {items.map((item, idx) => (
        <div key={item.label} className="contents">
          {idx > 0 && <Separator orientation="vertical" className="h-4" />}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <item.icon className="size-4" />
            <span>
              {item.count} {item.label}{item.count !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default CourseSummaryBar
