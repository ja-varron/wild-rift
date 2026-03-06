import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Pencil,
  Trash2,
  FileText,
  GraduationCap,
  UserCog,
} from "lucide-react"
import type { Course, Subject } from "@/model/course"

interface CourseCardProps {
  course: Course
  onEditCourse: (course: Course) => void
  onDeleteCourse: (id: number, name: string) => void
  onEditSubject: (courseId: number, subject: Subject) => void
  onDeleteSubject: (id: number, name: string) => void
}

const CourseCard = ({
  course,
  onEditCourse,
  onDeleteCourse,
  onEditSubject,
  onDeleteSubject,
}: CourseCardProps) => {
  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">{course.course_name}</CardTitle>
              <Badge variant="secondary">{course.course_code}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{course.description}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="size-8" onClick={() => onEditCourse(course)}>
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive hover:text-destructive"
              onClick={() => onDeleteCourse(course.course_id, course.course_name)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="text-xs">
            {course.subjects.length} subject{course.subjects.length !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="outline" className="text-xs">
            <GraduationCap className="size-3 mr-1" />
            {course.enrolled_students ?? 0} student{(course.enrolled_students ?? 0) !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="outline" className="text-xs">
            <UserCog className="size-3 mr-1" />
            {course.enrolled_instructors ?? 0} instructor{(course.enrolled_instructors ?? 0) !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {course.subjects.length > 0 ? (
          <div className="divide-y">
            {course.subjects.map((subject) => (
              <div key={subject.subject_id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">{subject.subject_name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => onEditSubject(course.course_id, subject)}
                  >
                    <Pencil className="size-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive hover:text-destructive"
                    onClick={() => onDeleteSubject(subject.subject_id, subject.subject_name)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-6 text-center text-sm text-muted-foreground">
            No subjects yet.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default CourseCard
