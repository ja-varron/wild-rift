import { useState } from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { useFetchStudentsByCourse } from "@/lib/supabase/authentication/context/use-fetch-users"
import { getStudentAnalytics } from "./types"

import StudentSummaryStats from "./components/StudentSummaryStats"
import StudentTable from "./components/StudentTable"
import StudentDetailHeader from "./components/StudentDetailHeader"
import StudentInfoCards from "./components/StudentInfoCards"
import StudentAnalyticsStats from "./components/StudentAnalyticsStats"
import ExamAccordionList from "./components/ExamAccordionList"
import type { UserProfile } from "@/model/user-profile"

const PAGE_SIZE = 10

// ── Component ──────────────────────────────────────────────────────────────────

const InstructorListStudentPage = ({ userProfile }: { userProfile: UserProfile | null | undefined }) => {

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)

  // Fetch students assigned to this instructor's course
  // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
  const { students, isLoading } = useFetchStudentsByCourse(userProfile?.course?.course_id!) 

  const selectedStudent = students.find((s) => s.user_id === selectedStudentId) ?? null

  // ── Filtering & pagination ──
  const searchTerm = search.toLowerCase()
  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm) ||
      s.email.toLowerCase().includes(searchTerm) ||
      s.examinee_id_number.toLowerCase().includes(searchTerm),
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // ── Selection helpers ──
  const allPageSelected =
    pageItems.length > 0 && pageItems.every((s) => selected.has(s.user_id))
  const somePageSelected = pageItems.some((s) => selected.has(s.user_id))

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allPageSelected) {
        pageItems.forEach((s) => next.delete(s.user_id))
      } else {
        pageItems.forEach((s) => next.add(s.user_id))
      }
      return next
    })
  }

  function toggleOne(id: string) {
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
        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold">Participants</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {filtered.length} student{filtered.length !== 1 ? "s" : ""} enrolled
            in {userProfile?.course?.course_name}
          </p>
        </div>

        {/* Page header */}
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

      </main>
    </ScrollArea>
  )
}

export default InstructorListStudentPage
