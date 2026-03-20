import { useState, useMemo } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Student, TopicScore, ExamResult } from "./types"
import { getStudentAnalytics } from "./types"

import StudentSummaryStats from "./components/StudentSummaryStats"
import StudentTable from "./components/StudentTable"
import StudentDetailHeader from "./components/StudentDetailHeader"
import StudentInfoCards from "./components/StudentInfoCards"
import StudentAnalyticsStats from "./components/StudentAnalyticsStats"
import ExamAccordionList from "./components/ExamAccordionList"

// ── Mock data ──────────────────────────────────────────────────────────────────

const EXAM_TITLE = "Computer Science Licensure Examination"

function generateStudents(): Student[] {
  const names = [
    "Juan Dela Cruz", "Maria Santos", "Carlos Reyes", "Ana Flores",
    "Mark Lim", "Grace Tan", "Paulo Rivera", "Lisa Cruz",
    "Ben Torres", "Alex Gomez", "Sarah Vargas", "Jhon Varron",
    "Nicole Perez", "Ryan Diaz", "Carla Mendoza", "James Uy",
    "Kate Villanueva", "Mike Bautista", "Rina Aguilar", "Dave Castillo",
  ]
  const roles = ["Student", "Instructor", "Student", "Student", "Instructor"]
  const courses = ["BSCS", "BSIT", "BSCS", "BSIT", "BSCS"]
  const years = ["4th Year", "4th Year", "3rd Year", "4th Year", "4th Year"]

  const topics = [
    { topicId: 1, topicName: "Data Structures & Algorithms" },
    { topicId: 2, topicName: "Operating Systems" },
    { topicId: 3, topicName: "Software Engineering" },
    { topicId: 4, topicName: "Database Management" },
  ]

  return names.map((name, i) => {
    const baseScore1 = 55 + ((i * 13 + 7) % 40)
    const baseScore2 = 50 + ((i * 17 + 3) % 45)

    const makeTopicScores = (base: number): TopicScore[] =>
      topics.map((t, j) => ({
        ...t,
        score: Math.min(25, Math.max(8, Math.round(base / 4 + ((j * 3 + i * 2) % 8) - 4))),
        maxScore: 25,
      }))

    const ts1 = makeTopicScores(baseScore1)
    const total1 = ts1.reduce((s, t) => s + t.score, 0)
    const ts2 = makeTopicScores(baseScore2)
    const total2 = ts2.reduce((s, t) => s + t.score, 0)

    const feedbacks = [
      "Great improvement in algorithms. Focus more on OS concepts for the next exam.",
      "Solid performance across all topics. Keep it up!",
      "Struggling with database management. Consider reviewing normalization topics.",
      "Good grasp of software engineering principles. Need to practice more coding problems.",
      undefined,
    ]

    const examResults: ExamResult[] = [
      {
        id: i * 10 + 1,
        examTitle: "CS Licensure Mock Exam 3",
        course: "BSCS",
        date: "Feb 15, 2026",
        score: total1,
        totalItems: 100,
        passed: total1 >= 75,
        topicScores: ts1,
        feedback: feedbacks[i % feedbacks.length],
      },
      {
        id: i * 10 + 2,
        examTitle: "CS Licensure Mock Exam 2",
        course: "BSCS",
        date: "Jan 20, 2026",
        score: total2,
        totalItems: 100,
        passed: total2 >= 75,
        topicScores: ts2,
        feedback: feedbacks[(i + 2) % feedbacks.length],
      },
    ]

    return {
      id: i + 1,
      examineeNo: `CS-${String(100001 + i * 137).slice(0, 6)}`,
      name,
      email: `${name.split(" ")[0].toLowerCase()}.${name.split(" ").at(-1)!.toLowerCase()}@vsu.edu.ph`,
      mobileNumber: `+63 9${String(10 + i).padStart(2, "0")} ${String(300 + i * 17).padStart(3, "0")} ${String(4000 + i * 53).padStart(4, "0")}`,
      role: roles[i % roles.length],
      course: courses[i % courses.length],
      yearLevel: years[i % years.length],
      dateAdded: `02-${String(1 + (i % 28)).padStart(2, "0")}-2026`,
      examResults,
    }
  })
}

const allStudents = generateStudents().filter((s) => s.role === "Student")
const PAGE_SIZE = 10

// ── Component ──────────────────────────────────────────────────────────────────

const InstructorListStudentPage = () => {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [students] = useState<Student[]>(allStudents)
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)

  const selectedStudent = students.find((s) => s.id === selectedStudentId) ?? null

  // ── Filtering & pagination ──
  const filtered = useMemo(
    () =>
      students.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.email.toLowerCase().includes(search.toLowerCase()) ||
          s.examineeNo.toLowerCase().includes(search.toLowerCase()),
      ),
    [search, students],
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
        <main className="p-6 space-y-6 max-w-5xl mx-auto w-full">
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

  return (
    <ScrollArea className="flex-1">
      <main className="p-6 space-y-5 max-w-6xl mx-auto w-full">

        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold">Participants</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {filtered.length} student{filtered.length !== 1 ? "s" : ""} enrolled
            in {EXAM_TITLE}
          </p>
        </div>

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

      </main>
    </ScrollArea>
  )
}

export default InstructorListStudentPage
