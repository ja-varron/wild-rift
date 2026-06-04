import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/supabase"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import type { Student } from "./types"
import { getStudentAnalytics } from "./types"

import StudentSummaryStats from "./components/StudentSummaryStats"
import StudentTable from "./components/StudentTable"
import StudentDetailHeader from "./components/StudentDetailHeader"
import StudentInfoCards from "./components/StudentInfoCards"
import StudentAnalyticsStats from "./components/StudentAnalyticsStats"
import ExamAccordionList from "./components/ExamAccordionList"

const PAGE_SIZE = 10
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"

type StudentResultRow = {
  student_id: string
  exam_id: number
  created_at?: string
  score?: number
  total_items?: number
  passed?: boolean
  topic_scores?: unknown
  feedback?: string
}

// ── Data Fetching Function ─────────────────────────────────────────────────────

const fetchInstructorAssignedStudents = async (instructorId?: string): Promise<Student[]> => {
  if (!instructorId) return []

  try {
    console.debug("Fetching students with same PRC exam type as instructor:", instructorId)

    // 1) Get all accounts
    const accountsResponse = await fetch(`${BACKEND_URL}/api/accounts`)
    const accountsPayload = await accountsResponse.json().catch(() => ({}))
    if (!accountsResponse.ok) {
      throw new Error(accountsPayload?.error || "Failed to fetch accounts")
    }

    const accounts = Array.isArray(accountsPayload?.accounts) ? accountsPayload.accounts : []
    
    // 2) Find the instructor's PRC exam type
    const instructor = accounts.find((account: { user_id?: string; role?: string }) => 
      account?.user_id === instructorId && account?.role === 'Instructor'
    )
    
    if (!instructor || !instructor.prc_exam_type) {
      console.debug("Instructor not found or has no PRC exam type")
      return []
    }

    const instructorPrcExamType = instructor.prc_exam_type
    console.debug("Instructor PRC exam type:", instructorPrcExamType)

    // 3) Filter students with the same PRC exam type
    const studentProfiles = accounts.filter(
      (account: { user_id?: string; role?: string; prc_exam_type?: string }) =>
        account?.role === "Student" && 
        !!account?.user_id && 
        account?.prc_exam_type === instructorPrcExamType
    )

    console.debug("Found students with matching PRC exam type:", studentProfiles.length)

    const studentIds = studentProfiles.map((profile: { user_id: string }) => profile.user_id)
    if (studentIds.length === 0) {
      return []
    }

    // 4) Load exam results for these students
    const { data: instructorExams, error: examsError } = await supabase
      .from("exams")
      .select("id")
      .eq("instructor_id", instructorId)

    if (examsError) {
      console.warn("Unable to fetch instructor exams; loading students without exam history", examsError)
    }

    const examIds = instructorExams?.map((e) => e.id) || []
    let studentResults: StudentResultRow[] = []

    if (examIds.length > 0) {
      const { data: results, error: resultsError } = await supabase
        .from("exam_results")
        .select("*")
        .in("exam_id", examIds)
        .in("student_id", studentIds)

      if (resultsError) {
        console.warn("Unable to fetch exam results; loading students without exam history", resultsError)
      } else {
        studentResults = results || []
      }
    }

    // 4. Build Student objects with their exam history
    const studentMap = new Map<string, Student>()

    studentProfiles.forEach((profile: { user_id: string; first_name?: string; last_name?: string; email?: string; created_at?: string }) => {
      studentMap.set(profile.user_id, {
        id: studentMap.size + 1,
        examineeNo: profile.user_id,
        name: `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim(),
        email: profile.email ?? "",
        mobileNumber: "",
        role: "Student",
        course: "",
        yearLevel: "",
        dateAdded: profile.created_at || new Date().toISOString(),
        examResults: [],
      })
    })

    // Add exam results to students
    studentResults.forEach((result) => {
      const student = studentMap.get(result.student_id)
      if (student) {
        const parsedTopicScores = (() => {
          const raw = result.topic_scores
          if (!raw) return []
          if (Array.isArray(raw)) return raw
          if (typeof raw === "string") {
            try {
              const decoded = JSON.parse(raw)
              return Array.isArray(decoded) ? decoded : []
            } catch {
              return []
            }
          }
          return []
        })()

        student.examResults.push({
          id: result.exam_id,
          examTitle: "",
          course: "",
          date: result.created_at || new Date().toISOString(),
          score: result.score || 0,
          totalItems: result.total_items || 100,
          passed: result.passed || false,
          topicScores: parsedTopicScores,
          feedback: result.feedback,
        })
      }
    })

    const students = Array.from(studentMap.values())
    console.debug("Retrieved students:", students.length)
    return students
  } catch (error) {
    console.error("Error fetching instructor assigned students:", error)
    return []
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

const InstructorListStudentPage = () => {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [instructorId, setInstructorId] = useState<string>()
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)

  // Get instructor ID from auth
  useEffect(() => {
    const getInstructor = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      console.debug("Auth user:", user)
      if (user) {
        console.debug("Setting instructorId to:", user.id)
        setInstructorId(user.id)
      } else {
        console.debug("No user found")
      }
    }
    getInstructor()
  }, [])

  // Fetch students assigned to this instructor
  const { data: students = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["instructorAssignedStudents", instructorId],
    queryFn: () => {
      console.debug("Query function called with instructorId:", instructorId)
      return fetchInstructorAssignedStudents(instructorId)
    },
    enabled: !!instructorId,
    staleTime: 1000 * 60 * 5,
  })

  const selectedStudent = students.find((s) => s.id === selectedStudentId) ?? null

  // ── Filtering & pagination ──
  const searchTerm = search.toLowerCase()
  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm) ||
      s.email.toLowerCase().includes(searchTerm) ||
      s.examineeNo.toLowerCase().includes(searchTerm),
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // ── Selection helpers ──
  const allPageSelected =
    pageItems.length > 0 && pageItems.every((s) => selected.has(s.id))
  const somePageSelected = pageItems.some((s) => selected.has(s.id))

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allPageSelected) {
        pageItems.forEach((s) => next.delete(s.id))
      } else {
        pageItems.forEach((s) => next.add(s.id))
      }
      return next
    })
  }

  function toggleOne(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ── STUDENT DETAIL VIEW ──
  // ─────────────────────────────────────────────────────────────────────────────

  if (selectedStudent) {
    const analytics = getStudentAnalytics(selectedStudent)

    return (
      <ScrollArea className="flex-1">
        <main className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto w-full">
          <StudentDetailHeader
            student={selectedStudent}
            onBack={() => setSelectedStudentId(null)}
          />
          <StudentInfoCards student={selectedStudent} />
          {analytics && (
            <StudentAnalyticsStats
              analytics={analytics}
              examCount={selectedStudent.examResults.length}
            />
          )}
          <ExamAccordionList results={selectedStudent.examResults} />
        </main>
      </ScrollArea>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ── STUDENT LIST VIEW ──
  // ─────────────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <ScrollArea className="flex-1">
        <main className="p-6 space-y-5 max-w-6xl mx-auto w-full">
          <div className="flex items-center justify-center py-16">
            <p className="text-muted-foreground">Loading students...</p>
          </div>
        </main>
      </ScrollArea>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <main className="p-4 sm:p-6 space-y-5 max-w-6xl mx-auto w-full">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Students</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {filtered.length} student{filtered.length !== 1 ? "s" : ""} assigned to you
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await refetch()
              toast.success("Student list refreshed")
            }}
            disabled={isRefetching}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            {isRefetching ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No students assigned to you yet. Contact your administrator to assign students.
            </p>
          </div>
        ) : (
          <>
            <StudentSummaryStats students={students} />

            <StudentTable
              search={search}
              onSearchChange={handleSearchChange}
              pageItems={pageItems}
              selected={selected}
              allPageSelected={allPageSelected}
              somePageSelected={somePageSelected}
              onToggleAll={toggleAll}
              onToggleOne={toggleOne}
              onSelectStudent={(id) => setSelectedStudentId(id)}
              page={safePage}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}

      </main>
    </ScrollArea>
  )
}

export default InstructorListStudentPage
