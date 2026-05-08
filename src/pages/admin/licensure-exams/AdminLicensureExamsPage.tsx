import { useState, useMemo } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import type { UserProfile } from "@/model/user-profile"
import type { Course } from "@/model/course"

import { useFetchCourses } from "@/lib/supabase/course/context/use-fetch-courses"
import { useCreateCourse } from "@/lib/supabase/course/context/use-create-course"
import { useUpdateCourse } from "@/lib/supabase/course/context/use-update-course"
import { useDeleteCourse } from "@/lib/supabase/course/context/use-delete-course"

import CourseCard from "./components/CourseCard"
import CourseCardSkeleton from "./components/CourseCardSkeleton"
import AddCourseDialog, { type CourseForm } from "./dialogs/AddCourseDialog"
import DeleteCourseDialog from "./dialogs/DeleteCourseDialog"

const AdminLicensureExamsPage = ({ userProfile }: { userProfile: UserProfile | null | undefined }) => {
  const institutionId = userProfile?.institution_id ?? ""
  const { courses, isLoading: coursesLoading } = useFetchCourses(institutionId)
  
  const { mutateAsync: createCourse } = useCreateCourse()
  const { mutateAsync: updateCourse } = useUpdateCourse()
  const { mutateAsync: deleteCourse, isPending: isDeleting } = useDeleteCourse()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null)
  const [deletingCourseName, setDeletingCourseName] = useState<string>("")

  const activeCount = useMemo(() => courses.length, [courses])

  // ADD / EDIT handlers
  function handleOpenCreate() {
    setEditingCourse(null)
    setDialogOpen(true)
  }

  // ADD / EDIT handlers
  function handleOpenEdit(course: Course) {
    setEditingCourse(course)
    setDialogOpen(true)
  }

  // ADD / EDIT handlers
  async function handleSaveCourse(form: CourseForm) {
    try {
      if (editingCourse) {
        await updateCourse({
          course_id: editingCourse.course_id,
          updates: {
            course_name: form.course_name,
            course_description: form.description
          }
        })
        toast.success("Examination updated successfully!")
      } else {
        if (!institutionId) {
          toast.error("Institution not found.")
          return
        }
        await createCourse({
          institution_id: institutionId,
          course_name: form.course_name,
          course_description: form.description
        })
        toast.success("Examination created successfully!")
      }
      setDialogOpen(false)
      setEditingCourse(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast.error(e.message || "An error occurred.")
    }
  }

  // DELETE handlers
  function handleOpenDelete(course_id: string, course_name: string) {
    setDeletingCourseId(course_id)
    setDeletingCourseName(course_name)
    setDeleteDialogOpen(true)
  }

  async function handleConfirmDelete() {
    if (!deletingCourseId) return
    if (!institutionId) {
      toast.error("Institution not found.")
      return
    }
    try {
      await deleteCourse({ course_id: deletingCourseId, institution_id: institutionId })
      toast.success("Examination deleted successfully!")
      setDeleteDialogOpen(false)
      setDeletingCourseId(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast.error(e.message || "An error occurred.")
    }
  }

  return (
    <ScrollArea className="flex-1">
      <main className="p-6 space-y-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">PRC Licensure Exams</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              List of PRC licensure examinations offered by VSU Review Center.
            </p>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 size-4" />
            Add Exam
          </Button>
        </div>  

        {/* Courses */}
        <Card>
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Offered Exams</CardTitle>
              <Badge variant="secondary">{activeCount} total</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {coursesLoading ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => <CourseCardSkeleton key={i} />)}
               </div>
            ) : courses.length === 0 ? (
              <div className="text-center p-8 border rounded-md border-dashed text-muted-foreground">
                No examinations found. Click "Add Exam" to create one.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((course) => (
                  <CourseCard
                    key={course.course_id}
                    course={course}
                    onEditCourse={handleOpenEdit}
                    onDeleteCourse={handleOpenDelete}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <AddCourseDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          initialData={editingCourse ? { course_name: editingCourse.course_name, description: editingCourse.course_description ?? "" } : undefined}
          onSave={handleSaveCourse}
        />

        {/* Delete Dialog */}
        <DeleteCourseDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          handleDelete={handleConfirmDelete}
          courseName={deletingCourseName}
          isDeleting={isDeleting}
        />
      </main>
    </ScrollArea>
  )
}

export default AdminLicensureExamsPage
