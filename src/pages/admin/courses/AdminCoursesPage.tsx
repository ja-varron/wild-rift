import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus } from "lucide-react"

import CourseCard from "./components/CourseCard"
import CourseSearchBar from "./components/CourseSearchBar"
import CourseDialog, { type CourseForm } from "./dialogs/CourseDialog"
import DeleteCourseDialog, { type DeleteTarget } from "./dialogs/DeleteCourseDialog"
import { useFetchCourses } from "@/lib/supabase/course/context/use-fetch-courses"
import supabase from "@/lib/supabase/supabase"
import { Course } from "@/model/course"
import CourseCardSkeleton from "./components/CourseCardSkeleton"

const AdminCoursesPage = () => {
  const { courses, isLoading, refetch } = useFetchCourses()

  const [search, setSearch] = useState("")

  // Course dialog state
  const [courseDialogOpen, setCourseDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

  // ════════════════════════════════════════════════════════════════════════════
  // Course CRUD
  // ════════════════════════════════════════════════════════════════════════════

  function openCreateCourse() {
    setEditingCourse(null)
    setCourseDialogOpen(true)
  }

  function openEditCourse(course: Course) {
    setEditingCourse(course)
    setCourseDialogOpen(true)
  }

  async function handleSaveCourse(form: CourseForm) {
    const dataToUpsert = {
      course_name: form.course_name,
      course_description: form.description,
    }

    // If we are editing, we need to include the id in the upsert
    if (editingCourse) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(dataToUpsert as any).course_id = editingCourse.getCourseId
    }

    const { error } = await supabase.from("courses").upsert(dataToUpsert)

    if (error) {
      console.error("Error saving course:", error)
    } else {
      refetch()
    }

    setCourseDialogOpen(false)
  }
  
  async function handleDelete() {
    if (!deleteTarget) return

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('course_id', deleteTarget.course_id)

    if (error) {
      console.error("Error deleting course:", error)
    } else {
      refetch()
    }

    setDeleteDialogOpen(false)
  }


  // ════════════════════════════════════════════════════════════════════════════
  // Delete handler
  // ════════════════════════════════════════════════════════════════════════════

  function openDeleteDialog(course_id: string, name: string) {
    setDeleteTarget({ course_id, name })
    setDeleteDialogOpen(true)
  }

  const filteredCourses = courses.filter(
    (course) =>
      course.getCourseName.toLowerCase().includes(search.toLowerCase()) ||
      course.getCourseDescription?.toLowerCase().includes(search.toLowerCase()),
  )

  const initialData = editingCourse
    ? {
        course_name: editingCourse.getCourseName,
        description: editingCourse.getCourseDescription ?? "",
      }
    : undefined

  return (
    <ScrollArea className="flex-1">
      <main className="p-6 space-y-6 max-w-6xl mx-auto w-full">

        {/* Page title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Licensure Examination Management</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Manage licensure examinations, subjects, and topics offered at the VSU Review Center.
            </p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={openCreateCourse}>
            <Plus className="size-4" />
            Add Examination
          </Button>
        </div>

        <CourseSearchBar value={search} onChange={setSearch} />

        {/* Course skeletons */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        ) : 
        filteredCourses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No licensure examinations found.
            </CardContent>
          </Card>
        ) : (
          filteredCourses.map((course) => (
            <CourseCard
              key={course.getCourseId}
              course={course}
              onEditCourse={openEditCourse}
              onDeleteCourse={(id, name) => openDeleteDialog(id, name)}
            />
          ))
        )}

        {/* ── Dialogs ── */}
        <CourseDialog
          open={courseDialogOpen}
          onOpenChange={setCourseDialogOpen}
          initialData={initialData}
          onSave={handleSaveCourse}
        />

        <DeleteCourseDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          target={deleteTarget}
          onConfirm={handleDelete}
        />
      </main>
    </ScrollArea>
  )
}

export default AdminCoursesPage
