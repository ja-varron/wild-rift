import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Pencil,
  Trash2,
  GraduationCap,
  UserCog,
} from "lucide-react"
import type { Course } from "@/model/course"
import { useCourseRoleCount } from "@/lib/supabase/course/context/use-course-role-count"

interface CourseCardProps {
  course: Course
  onEditCourse: (course: Course) => void
  onDeleteCourse: (course_id: string, course_name: string) => void
}

const CourseCard = ({
  course,
  onEditCourse,
  onDeleteCourse,
}: CourseCardProps) => {
  const { roleCount, isLoading } = useCourseRoleCount(course.getCourseId)

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">{course.getCourseName}</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">{course.getCourseDescription}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="size-8" onClick={() => onEditCourse(course)}>
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive hover:text-destructive"
              onClick={() => onDeleteCourse(course.getCourseId, course.getCourseName)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
        {!isLoading && (
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              <GraduationCap className="size-3 mr-1" />
              {roleCount.students} student{(roleCount.students !== 1) ? "s" : ""}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <UserCog className="size-3 mr-1" />
              {roleCount.instructors} instructor{(roleCount.instructors !== 1) ? "s" : ""}
            </Badge>
          </div>
        )}
      </CardHeader>
    </Card>
  )
}

export default CourseCard
