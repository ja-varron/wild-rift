import { useState, useMemo } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus } from "lucide-react"
import type { Course, Subject } from "@/model/course"

import CourseCard from "./components/CourseCard"
import CourseSummaryBar from "./components/CourseSummaryBar"
import CourseSearchBar from "./components/CourseSearchBar"
import CourseDialog, { type CourseFormData } from "./dialogs/CourseDialog"
import SubjectDialog from "./dialogs/SubjectDialog"
import DeleteCourseDialog, { type DeleteTarget } from "./dialogs/DeleteCourseDialog"

// ── Mock data ──────────────────────────────────────────────────────────────────

function generateCourses(): Course[] {
  return [
    {
      course_id: 1,
      course_name: "BS Computer Science Licensure Review",
      course_code: "BSCS",
      description: "Review program for the Computer Science licensure board examination.",
      enrolled_students: 42,
      enrolled_instructors: 3,
      subjects: [
        {
          subject_id: 1,
          subject_name: "Data Structures & Algorithms",
          course_id: 1,
          topics: [
            { topic_id: 1, topic_name: "Arrays & Linked Lists", subject_id: 1 },
            { topic_id: 2, topic_name: "Trees & Graphs", subject_id: 1 },
            { topic_id: 3, topic_name: "Sorting & Searching", subject_id: 1 },
          ],
        },
        {
          subject_id: 2,
          subject_name: "Operating Systems",
          course_id: 1,
          topics: [
            { topic_id: 4, topic_name: "Process Management", subject_id: 2 },
            { topic_id: 5, topic_name: "Memory Management", subject_id: 2 },
            { topic_id: 6, topic_name: "File Systems", subject_id: 2 },
          ],
        },
        {
          subject_id: 3,
          subject_name: "Software Engineering",
          course_id: 1,
          topics: [
            { topic_id: 7, topic_name: "SDLC Models", subject_id: 3 },
            { topic_id: 8, topic_name: "Requirements Engineering", subject_id: 3 },
            { topic_id: 9, topic_name: "Software Testing", subject_id: 3 },
          ],
        },
        {
          subject_id: 4,
          subject_name: "Database Management",
          course_id: 1,
          topics: [
            { topic_id: 10, topic_name: "Normalization", subject_id: 4 },
            { topic_id: 11, topic_name: "SQL Queries", subject_id: 4 },
            { topic_id: 12, topic_name: "Transaction Management", subject_id: 4 },
          ],
        },
      ],
    },
    {
      course_id: 2,
      course_name: "BS Nursing Licensure Review",
      course_code: "BSN",
      description: "Review program for the Nursing licensure board examination.",
      enrolled_students: 58,
      enrolled_instructors: 4,
      subjects: [
        {
          subject_id: 5,
          subject_name: "Fundamentals of Nursing",
          course_id: 2,
          topics: [
            { topic_id: 13, topic_name: "Vital Signs & Assessment", subject_id: 5 },
            { topic_id: 14, topic_name: "Infection Control", subject_id: 5 },
          ],
        },
        {
          subject_id: 6,
          subject_name: "Pharmacology",
          course_id: 2,
          topics: [
            { topic_id: 15, topic_name: "Drug Classifications", subject_id: 6 },
            { topic_id: 16, topic_name: "Dosage Computation", subject_id: 6 },
          ],
        },
        {
          subject_id: 7,
          subject_name: "Medical-Surgical Nursing",
          course_id: 2,
          topics: [
            { topic_id: 17, topic_name: "Cardiovascular Disorders", subject_id: 7 },
            { topic_id: 18, topic_name: "Respiratory Disorders", subject_id: 7 },
          ],
        },
      ],
    },
    {
      course_id: 3,
      course_name: "BS Information Technology Review",
      course_code: "BSIT",
      description: "Review program for IT professionals.",
      enrolled_students: 35,
      enrolled_instructors: 2,
      subjects: [
        {
          subject_id: 8,
          subject_name: "Networking",
          course_id: 3,
          topics: [
            { topic_id: 19, topic_name: "TCP/IP Model", subject_id: 8 },
            { topic_id: 20, topic_name: "Network Security", subject_id: 8 },
          ],
        },
        {
          subject_id: 9,
          subject_name: "Web Development",
          course_id: 3,
          topics: [
            { topic_id: 21, topic_name: "Frontend Technologies", subject_id: 9 },
            { topic_id: 22, topic_name: "Backend Frameworks", subject_id: 9 },
          ],
        },
      ],
    },
    {
      course_id: 4,
      course_name: "BS Education Licensure Review",
      course_code: "BSEd",
      description: "Review program for the Licensure Examination for Teachers.",
      enrolled_students: 27,
      enrolled_instructors: 2,
      subjects: [
        {
          subject_id: 10,
          subject_name: "General Education",
          course_id: 4,
          topics: [
            { topic_id: 23, topic_name: "Filipino", subject_id: 10 },
            { topic_id: 24, topic_name: "Mathematics", subject_id: 10 },
            { topic_id: 25, topic_name: "English", subject_id: 10 },
          ],
        },
        {
          subject_id: 11,
          subject_name: "Professional Education",
          course_id: 4,
          topics: [
            { topic_id: 26, topic_name: "Child Development", subject_id: 11 },
            { topic_id: 27, topic_name: "Assessment of Learning", subject_id: 11 },
          ],
        },
      ],
    },
  ]
}

// ── Next‑ID counters ──
let nextCourseId = 100
let nextSubjectId = 100

// ── Component ──────────────────────────────────────────────────────────────────

const AdminCoursesPage = () => {
  const [courseList, setCourseList] = useState<Course[]>(generateCourses)
  const [search, setSearch] = useState("")

  // Course dialog state
  const [courseDialogOpen, setCourseDialogOpen] = useState(false)
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null)
  const [courseInitialData, setCourseInitialData] = useState<CourseFormData | undefined>(undefined)

  // Subject dialog state
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false)
  const [subjectParentCourseId, setSubjectParentCourseId] = useState<number | null>(null)
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null)
  const [subjectInitialName, setSubjectInitialName] = useState<string | undefined>(undefined)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

  // ── Filtered courses ──
  const filtered = useMemo(() => {
    if (!search.trim()) return courseList
    const q = search.toLowerCase()
    return courseList.filter(
      (c) =>
        c.course_name.toLowerCase().includes(q) ||
        c.course_code.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.subjects.some((s) => s.subject_name.toLowerCase().includes(q))
    )
  }, [courseList, search])

  // ── Stats ──
  const totalSubjects = courseList.reduce((sum, c) => sum + c.subjects.length, 0)
  const totalStudents = courseList.reduce((sum, c) => sum + (c.enrolled_students ?? 0), 0)
  const totalInstructors = courseList.reduce((sum, c) => sum + (c.enrolled_instructors ?? 0), 0)

  // ════════════════════════════════════════════════════════════════════════════
  // Course CRUD
  // ════════════════════════════════════════════════════════════════════════════

  function openCreateCourse() {
    setEditingCourseId(null)
    setCourseInitialData(undefined)
    setCourseDialogOpen(true)
  }

  function openEditCourse(course: Course) {
    setEditingCourseId(course.course_id)
    setCourseInitialData({
      course_name: course.course_name,
      course_code: course.course_code,
      description: course.description,
    })
    setCourseDialogOpen(true)
  }

  function handleSaveCourse(data: CourseFormData) {
    if (editingCourseId !== null) {
      setCourseList((prev) =>
        prev.map((c) => (c.course_id === editingCourseId ? { ...c, ...data } : c))
      )
    } else {
      const newCourse: Course = {
        course_id: nextCourseId++,
        ...data,
        subjects: [],
      }
      setCourseList((prev) => [...prev, newCourse])
    }
    setCourseDialogOpen(false)
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Subject CRUD
  // ════════════════════════════════════════════════════════════════════════════

  function openEditSubject(courseId: number, subject: Subject) {
    setSubjectParentCourseId(courseId)
    setEditingSubjectId(subject.subject_id)
    setSubjectInitialName(subject.subject_name)
    setSubjectDialogOpen(true)
  }

  function handleSaveSubject(subjectName: string) {
    if (subjectParentCourseId === null) return

    setCourseList((prev) =>
      prev.map((c) => {
        if (c.course_id !== subjectParentCourseId) return c

        if (editingSubjectId !== null) {
          return {
            ...c,
            subjects: c.subjects.map((s) =>
              s.subject_id === editingSubjectId ? { ...s, subject_name: subjectName } : s
            ),
          }
        } else {
          const newSubject: Subject = {
            subject_id: nextSubjectId++,
            subject_name: subjectName,
            course_id: subjectParentCourseId,
            topics: [],
          }
          return { ...c, subjects: [...c.subjects, newSubject] }
        }
      })
    )
    setSubjectDialogOpen(false)
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Delete handler
  // ════════════════════════════════════════════════════════════════════════════

  function openDeleteDialog(type: "course" | "subject", id: number, name: string) {
    setDeleteTarget({ type, id, name })
    setDeleteDialogOpen(true)
  }

  function handleDelete() {
    if (!deleteTarget) return

    if (deleteTarget.type === "course") {
      setCourseList((prev) => prev.filter((c) => c.course_id !== deleteTarget.id))
    } else {
      setCourseList((prev) =>
        prev.map((c) => ({
          ...c,
          subjects: c.subjects.filter((s) => s.subject_id !== deleteTarget.id),
        }))
      )
    }

    setDeleteDialogOpen(false)
    setDeleteTarget(null)
  }

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

        <CourseSummaryBar
          totalCourses={courseList.length}
          totalStudents={totalStudents}
          totalInstructors={totalInstructors}
          totalSubjects={totalSubjects}
        />

        <CourseSearchBar value={search} onChange={setSearch} />

        {/* ── Course list ── */}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No licensure examinations found.
            </CardContent>
          </Card>
        ) : (
          filtered.map((course) => (
            <CourseCard
              key={course.course_id}
              course={course}
              onEditCourse={openEditCourse}
              onDeleteCourse={(id, name) => openDeleteDialog("course", id, name)}
              onEditSubject={openEditSubject}
              onDeleteSubject={(id, name) => openDeleteDialog("subject", id, name)}
            />
          ))
        )}

        {/* ── Dialogs ── */}
        <CourseDialog
          key={editingCourseId ?? "new"}
          open={courseDialogOpen}
          onOpenChange={setCourseDialogOpen}
          initialData={courseInitialData}
          onSave={handleSaveCourse}
        />

        <SubjectDialog
          key={editingSubjectId ?? "new"}
          open={subjectDialogOpen}
          onOpenChange={setSubjectDialogOpen}
          initialName={subjectInitialName}
          onSave={handleSaveSubject}
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
