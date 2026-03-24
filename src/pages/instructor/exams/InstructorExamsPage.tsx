import { useState, useEffect } from "react"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Plus,
  ArrowLeft,
  KeyRound,
  ScanLine,
  Users,
  BarChart3,
  Calendar,
  BookOpen,
  ClipboardList,
} from "lucide-react"
import type { Exam, ExamTopic, AnswerKeyItem } from "./types"
import { AnswerKeyEditor } from "./components/AnswerKeyEditor"
import { ScannerPanel } from "./components/ScannerPanel"
import { StudentScoresTable } from "./components/StudentScoresTable"
import { ExamAnalyticsPanel } from "./components/ExamAnalyticsPanel"
import { ExamDialog } from "./dialogs/ExamDialog"
import { supabase } from "@/lib/supabase/supabase"
import { useFetchCourses } from "@/lib/supabase/course/context/use-fetch-courses"
import { Course } from "@/model/course"

// ── Mock data helpers ──────────────────────────────────────────────────────────

function generateAnswerKeys(
  topics: ExamTopic[],
  totalItems: number,
): AnswerKeyItem[] {
  const answers: ("A" | "B" | "C" | "D" | "E")[] = ["A", "B", "C", "D", "E"]
  const versions = ["A", "B", "C", "D"]
  const keys: AnswerKeyItem[] = []
  const qPerTopic = Math.ceil(totalItems / topics.length)
  for (const version of versions) {
    const vOffset = versions.indexOf(version)
    for (let i = 0; i < totalItems; i++) {
      const topicIdx = Math.min(
        Math.floor(i / qPerTopic),
        topics.length - 1,
      )
      keys.push({
        questionNumber: i + 1,
        topicId: topics[topicIdx].id,
        correctAnswer: answers[(i * 7 + 3 + vOffset * 2) % 5],
        points: 1,
        keyVersion: version,
      })
    }
  }
  return keys
}

// ── Mock data ──────────────────────────────────────────────────────────────────

const nursingTopics: ExamTopic[] = [
  { id: 1, name: "Fundamentals of Nursing" },
  { id: 2, name: "Medical-Surgical Nursing" },
  { id: 3, name: "Pharmacology" },
  { id: 4, name: "Community Health" },
]

const engineeringTopics: ExamTopic[] = [
  { id: 5, name: "Mathematics" },
  { id: 6, name: "General Engineering" },
  { id: 7, name: "Technical Sciences" },
]

const educationTopics: ExamTopic[] = [
  { id: 8, name: "General Education" },
  { id: 9, name: "Professional Education" },
  { id: 10, name: "Field of Specialization" },
]

const initialExams: Exam[] = [
  {
    id: 1,
    title: "Nursing Board Mock Exam 3",
    course: "BSN - Nursing",
    date: "Feb 15, 2026",
    totalItems: 100,
    passingRate: 75,
    status: "Completed",
    studentsEnrolled: 42,
    papersScanned: 8,
    topics: nursingTopics,
    answerKeys: generateAnswerKeys(nursingTopics, 100),
    studentResults: [
      {
        id: 1,
        name: "Mark Lim",
        studentId: "2022-0106",
        score: 91,
        totalItems: 100,
        passed: true,
        topicScores: [
          { topicId: 1, score: 24, maxScore: 25 },
          { topicId: 2, score: 22, maxScore: 25 },
          { topicId: 3, score: 23, maxScore: 25 },
          { topicId: 4, score: 22, maxScore: 25 },
        ],
        scannedAt: "Feb 15, 2026",
      },
      {
        id: 2,
        name: "Maria Cruz",
        studentId: "2022-0101",
        score: 87,
        totalItems: 100,
        passed: true,
        topicScores: [
          { topicId: 1, score: 23, maxScore: 25 },
          { topicId: 2, score: 21, maxScore: 25 },
          { topicId: 3, score: 22, maxScore: 25 },
          { topicId: 4, score: 21, maxScore: 25 },
        ],
        scannedAt: "Feb 15, 2026",
      },
      {
        id: 3,
        name: "Juan Dela Cruz",
        studentId: "2022-0102",
        score: 82,
        totalItems: 100,
        passed: true,
        topicScores: [
          { topicId: 1, score: 22, maxScore: 25 },
          { topicId: 2, score: 17, maxScore: 25 },
          { topicId: 3, score: 20, maxScore: 25 },
          { topicId: 4, score: 23, maxScore: 25 },
        ],
        scannedAt: "Feb 15, 2026",
      },
      {
        id: 4,
        name: "Grace Flores",
        studentId: "2022-0107",
        score: 79,
        totalItems: 100,
        passed: true,
        topicScores: [
          { topicId: 1, score: 21, maxScore: 25 },
          { topicId: 2, score: 18, maxScore: 25 },
          { topicId: 3, score: 20, maxScore: 25 },
          { topicId: 4, score: 20, maxScore: 25 },
        ],
        scannedAt: "Feb 15, 2026",
      },
      {
        id: 5,
        name: "Ana Reyes",
        studentId: "2022-0103",
        score: 76,
        totalItems: 100,
        passed: true,
        topicScores: [
          { topicId: 1, score: 20, maxScore: 25 },
          { topicId: 2, score: 19, maxScore: 25 },
          { topicId: 3, score: 18, maxScore: 25 },
          { topicId: 4, score: 19, maxScore: 25 },
        ],
        scannedAt: "Feb 15, 2026",
      },
      {
        id: 6,
        name: "Carlos Santos",
        studentId: "2022-0104",
        score: 71,
        totalItems: 100,
        passed: false,
        topicScores: [
          { topicId: 1, score: 18, maxScore: 25 },
          { topicId: 2, score: 16, maxScore: 25 },
          { topicId: 3, score: 19, maxScore: 25 },
          { topicId: 4, score: 18, maxScore: 25 },
        ],
        scannedAt: "Feb 15, 2026",
      },
      {
        id: 7,
        name: "Lisa Tan",
        studentId: "2022-0105",
        score: 68,
        totalItems: 100,
        passed: false,
        topicScores: [
          { topicId: 1, score: 17, maxScore: 25 },
          { topicId: 2, score: 15, maxScore: 25 },
          { topicId: 3, score: 18, maxScore: 25 },
          { topicId: 4, score: 18, maxScore: 25 },
        ],
        scannedAt: "Feb 15, 2026",
      },
      {
        id: 8,
        name: "Paulo Rivera",
        studentId: "2022-0108",
        score: 63,
        totalItems: 100,
        passed: false,
        topicScores: [
          { topicId: 1, score: 16, maxScore: 25 },
          { topicId: 2, score: 14, maxScore: 25 },
          { topicId: 3, score: 17, maxScore: 25 },
          { topicId: 4, score: 16, maxScore: 25 },
        ],
        scannedAt: "Feb 15, 2026",
      },
    ],
    scannedPapers: [
      { id: 1, studentName: "Mark Lim", studentId: "2022-0106", scannedAt: "Feb 15, 2026 9:10 AM", status: "Graded" },
      { id: 2, studentName: "Maria Cruz", studentId: "2022-0101", scannedAt: "Feb 15, 2026 9:12 AM", status: "Graded" },
      { id: 3, studentName: "Juan Dela Cruz", studentId: "2022-0102", scannedAt: "Feb 15, 2026 9:14 AM", status: "Graded" },
      { id: 4, studentName: "Grace Flores", studentId: "2022-0107", scannedAt: "Feb 15, 2026 9:16 AM", status: "Graded" },
      { id: 5, studentName: "Ana Reyes", studentId: "2022-0103", scannedAt: "Feb 15, 2026 9:18 AM", status: "Graded" },
      { id: 6, studentName: "Carlos Santos", studentId: "2022-0104", scannedAt: "Feb 15, 2026 9:20 AM", status: "Graded" },
      { id: 7, studentName: "Lisa Tan", studentId: "2022-0105", scannedAt: "Feb 15, 2026 9:22 AM", status: "Graded" },
      { id: 8, studentName: "Paulo Rivera", studentId: "2022-0108", scannedAt: "Feb 15, 2026 9:24 AM", status: "Graded" },
    ],
  },
  {
    id: 2,
    title: "Engineering Licensure Review 2",
    course: "BSCE - Civil Engineering",
    date: "Mar 10, 2026",
    totalItems: 80,
    passingRate: 75,
    status: "Active",
    studentsEnrolled: 35,
    papersScanned: 3,
    topics: engineeringTopics,
    answerKeys: generateAnswerKeys(engineeringTopics, 80),
    studentResults: [
      {
        id: 9,
        name: "Ben Torres",
        studentId: "2022-0201",
        score: 72,
        totalItems: 80,
        passed: true,
        topicScores: [
          { topicId: 5, score: 25, maxScore: 27 },
          { topicId: 6, score: 24, maxScore: 27 },
          { topicId: 7, score: 23, maxScore: 26 },
        ],
        scannedAt: "Feb 28, 2026",
      },
      {
        id: 10,
        name: "Alex Gomez",
        studentId: "2022-0202",
        score: 65,
        totalItems: 80,
        passed: true,
        topicScores: [
          { topicId: 5, score: 22, maxScore: 27 },
          { topicId: 6, score: 21, maxScore: 27 },
          { topicId: 7, score: 22, maxScore: 26 },
        ],
        scannedAt: "Feb 28, 2026",
      },
      {
        id: 11,
        name: "Sarah Cruz",
        studentId: "2022-0203",
        score: 58,
        totalItems: 80,
        passed: false,
        topicScores: [
          { topicId: 5, score: 19, maxScore: 27 },
          { topicId: 6, score: 20, maxScore: 27 },
          { topicId: 7, score: 19, maxScore: 26 },
        ],
        scannedAt: "Feb 28, 2026",
      },
    ],
    scannedPapers: [
      { id: 9, studentName: "Ben Torres", studentId: "2022-0201", scannedAt: "Feb 28, 2026 1:10 PM", status: "Graded" },
      { id: 10, studentName: "Alex Gomez", studentId: "2022-0202", scannedAt: "Feb 28, 2026 1:12 PM", status: "Graded" },
      { id: 11, studentName: "Sarah Cruz", studentId: "2022-0203", scannedAt: "Feb 28, 2026 1:14 PM", status: "Processing" },
    ],
  },
  {
    id: 3,
    title: "Education Board Mock Exam 2",
    course: "BEEd - Elementary Education",
    date: "Mar 18, 2026",
    totalItems: 120,
    passingRate: 75,
    status: "Draft",
    studentsEnrolled: 62,
    papersScanned: 0,
    topics: educationTopics,
    answerKeys: [],
    studentResults: [],
    scannedPapers: [],
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function statusBadgeClass(status: Exam["status"]) {
  switch (status) {
    case "Completed":
      return "bg-green-500 hover:bg-green-500 text-white"
    case "Active":
      return "bg-teal-700 hover:bg-teal-700 text-white"
    case "Draft":
      return "bg-muted text-muted-foreground hover:bg-muted"
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

const InstructorExamsPage = () => {
  const [exams, setExams] = useState<Exam[]>(initialExams)
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // Create exam form state
  const [newTitle, setNewTitle] = useState("")
  const [newCourseId, setNewCourseId] = useState("")
  const [newDate, setNewDate] = useState("")
  const [newTotalItems, setNewTotalItems] = useState("")
  const [newPassingRate, setNewPassingRate] = useState("75")
  const [newTopics, setNewTopics] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const { courses } = useFetchCourses()
  const [coursesList, setCoursesList] = useState(courses ?? [])
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [coursesError, setCoursesError] = useState<string | null>(null)

  useEffect(() => {
    // Prefer courses returned by the hook; fall back to direct fetch if empty
    if (courses && courses.length > 0) {
      setCoursesList(courses)
      return
    }

    let mounted = true
    ;(async () => {
      setCoursesLoading(true)
      setCoursesError(null)
      try {
        const { data, error } = await supabase
          .from("courses")
          .select("course_id, course_name, course_description, created_at")

        if (error) {
          console.warn("Could not fetch courses directly:", error)
          setCoursesError(error.message)
          return
        }

        if (!mounted || !data) return

        const mapped = data.map((r: any) =>
          new Course({
            course_id: r.course_id,
            course_name: r.course_name,
            course_description: r.course_description,
            created_at: r.created_at,
          }),
        )
        setCoursesList(mapped)
      } catch (err: any) {
        console.warn("Error fetching courses fallback:", err)
        setCoursesError(err?.message ?? String(err))
      } finally {
        setCoursesLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [courses])

  function resetForm() {
    setNewTitle("")
    setNewCourseId("")
    setNewDate("")
    setNewTotalItems("")
    setNewPassingRate("75")
    setNewTopics("")
  }

  const selectedExam = exams.find((e) => e.id === selectedExamId) ?? null

  // ── Handlers ──

  function handleCreateExam() {
    if (!newTitle || !newCourseId) return
    if (isSaving) return
    setIsSaving(true)

    const topicNames = newTopics
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)

    const topics: ExamTopic[] = topicNames.map((name, i) => ({
      id: Date.now() + i,
      name,
    }))

    const passingRateNum = parseInt(newPassingRate) || 75

    ;(async () => {
      console.log("Creating exam...", { newTitle, newCourseId })
      const { data, error } = await supabase.rpc("rpc_create_exam", {
        p_course_id: newCourseId,
        p_exam_title: newTitle,
        p_exam_date: newDate || null,
        p_passing_rate: passingRateNum || null,
        p_topics: topicNames.length ? topicNames : null,
      }) as any

      if (error) {
        console.error("Error creating exam:", error)
        setIsSaving(false)
        return
      }

      const created = data as any

      const courseName = courses.find((c) => c.getCourseId === created.course_id)?.getCourseName ?? ""

      const newExam: Exam = {
        id: Date.now(),
        title: created.exam_title || newTitle,
        course: courseName || newCourseId,
        date: created.exam_date ? String(created.exam_date) : newDate,
        totalItems: parseInt(newTotalItems) || 100,
        passingRate: passingRateNum,
        status: "Draft",
        studentsEnrolled: 0,
        papersScanned: 0,
        topics,
        answerKeys: [],
        studentResults: [],
        scannedPapers: [],
      }

      setExams((prev) => [...prev, newExam])
      setSelectedExamId(newExam.id)
      setCreateDialogOpen(false)

      // Reset form
      setNewTitle("")
      setNewCourseId("")
      setNewDate("")
      setNewTotalItems("")
      setNewPassingRate("75")
      setNewTopics("")
      setIsSaving(false)
    })()
  }

  function handleSaveAnswerKeys(examId: number, keys: AnswerKeyItem[]) {
    setExams((prev) =>
      prev.map((exam) =>
        exam.id === examId ? { ...exam, answerKeys: keys } : exam,
      ),
    )
  }

  function handleUpdateFeedback(
    examId: number,
    studentId: number,
    feedback: string,
  ) {
    setExams((prev) =>
      prev.map((exam) => {
        if (exam.id !== examId) return exam
        return {
          ...exam,
          studentResults: exam.studentResults.map((r) =>
            r.id === studentId ? { ...r, feedback } : r,
          ),
        }
      }),
    )
  }

  // ── Render ──

  return (
    <SidebarProvider>
      <TooltipProvider>
        <div className="flex min-h-screen w-full bg-background">
          <SidebarInset className="flex flex-col flex-1 min-w-0">

            <ScrollArea className="flex-1">
              <main className="p-6 space-y-6 max-w-6xl mx-auto w-full">
                {selectedExam ? (
                  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                   *  EXAM DETAIL VIEW
                   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
                  <>
                    {/* Back button + heading */}
                    <div className="flex items-start gap-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 mt-0.5"
                        onClick={() => setSelectedExamId(null)}
                      >
                        <ArrowLeft className="size-4" />
                      </Button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h1 className="text-2xl font-bold">
                            {selectedExam.title}
                          </h1>
                          <Badge
                            className={statusBadgeClass(selectedExam.status)}
                          >
                            {selectedExam.status}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mt-0.5">
                          {selectedExam.course} · {selectedExam.date} ·{" "}
                          {selectedExam.totalItems} items ·{" "}
                          {selectedExam.passingRate}% passing
                        </p>
                      </div>
                    </div>

                    {/* Overview stat cards */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      {[
                        {
                          label: "Total Items",
                          value: selectedExam.totalItems,
                          icon: ClipboardList,
                        },
                        {
                          label: "Students",
                          value: selectedExam.studentsEnrolled,
                          icon: Users,
                        },
                        {
                          label: "Papers Scanned",
                          value: selectedExam.papersScanned,
                          icon: ScanLine,
                        },
                        {
                          label: "Topics",
                          value: selectedExam.topics.length,
                          icon: BookOpen,
                        },
                      ].map((stat) => (
                        <Card key={stat.label} className="py-4">
                          <CardContent className="px-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">
                                  {stat.label}
                                </p>
                                <p className="text-2xl font-bold">
                                  {stat.value}
                                </p>
                              </div>
                              <div className="flex size-8 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
                                <stat.icon className="size-4 text-teal-700" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Tabs: Answer Key | Scanner | Scores | Analytics */}
                    <Tabs defaultValue="answer-key">
                      <TabsList>
                        <TabsTrigger value="answer-key" className="gap-1.5">
                          <KeyRound className="size-3.5" /> Answer Key
                        </TabsTrigger>
                        <TabsTrigger value="scanner" className="gap-1.5">
                          <ScanLine className="size-3.5" /> Scanner
                        </TabsTrigger>
                        <TabsTrigger value="scores" className="gap-1.5">
                          <Users className="size-3.5" /> Scores
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="gap-1.5">
                          <BarChart3 className="size-3.5" /> Analytics
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="answer-key" className="mt-4">
                        <AnswerKeyEditor
                          topics={selectedExam.topics}
                          answerKeys={selectedExam.answerKeys}
                          totalItems={selectedExam.totalItems}
                          onSave={(keys) =>
                            handleSaveAnswerKeys(selectedExam.id, keys)
                          }
                          onCancel={() => {}}
                        />
                      </TabsContent>

                      <TabsContent value="scanner" className="mt-4">
                        <ScannerPanel
                          scannedPapers={selectedExam.scannedPapers}
                          examTitle={selectedExam.title}
                        />
                      </TabsContent>

                      <TabsContent value="scores" className="mt-4">
                        <StudentScoresTable
                          results={selectedExam.studentResults}
                          topics={selectedExam.topics}
                          passingRate={selectedExam.passingRate}
                          onUpdateFeedback={(studentId, feedback) =>
                            handleUpdateFeedback(selectedExam.id, studentId, feedback)
                          }
                        />
                      </TabsContent>

                      <TabsContent value="analytics" className="mt-4">
                        <ExamAnalyticsPanel
                          results={selectedExam.studentResults}
                          topics={selectedExam.topics}
                          passingRate={selectedExam.passingRate}
                        />
                      </TabsContent>
                    </Tabs>
                  </>
                ) : (
                  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                   *  EXAM LIST VIEW
                   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
                  <>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h1 className="text-2xl font-bold">
                          Exam Management
                        </h1>
                        <p className="text-muted-foreground text-sm mt-0.5">
                          Create, configure, and manage your examinations.
                        </p>
                      </div>
                      <Button
                        className="gap-1.5 bg-teal-700 hover:bg-teal-800"
                        onClick={() => setCreateDialogOpen(true)}
                      >
                        <Plus className="size-4" />
                        Create Exam
                      </Button>
                    </div>

                    {/* Exam cards grid */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {exams.map((exam) => (
                        <Card
                          key={exam.id}
                          className="group cursor-pointer transition-colors hover:border-teal-300 dark:hover:border-teal-800"
                          onClick={() => setSelectedExamId(exam.id)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-base font-semibold line-clamp-2">
                                {exam.title}
                              </CardTitle>
                              <Badge
                                className={`shrink-0 ${statusBadgeClass(exam.status)}`}
                              >
                                {exam.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="space-y-1.5 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <BookOpen className="size-3.5 shrink-0" />
                                <span>{exam.course}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Calendar className="size-3.5 shrink-0" />
                                <span>{exam.date}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <ClipboardList className="size-3.5 shrink-0" />
                                <span>
                                  {exam.totalItems} items ·{" "}
                                  {exam.passingRate}% passing
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Users className="size-3.5 shrink-0" />
                                <span>
                                  {exam.studentsEnrolled} students ·{" "}
                                  {exam.papersScanned} scanned
                                </span>
                              </div>
                            </div>

                            <Separator />

                            <div className="flex flex-wrap gap-1.5">
                              {exam.topics.map((t) => (
                                <Badge
                                  key={t.id}
                                  variant="outline"
                                  className="text-xs font-normal"
                                >
                                  {t.name}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </main>
            </ScrollArea>
          </SidebarInset>
        </div>

        <ExamDialog
          createDialogOpen={createDialogOpen}
          setCreateDialogOpen={setCreateDialogOpen}
          newTitle={newTitle}
          setNewTitle={setNewTitle}
          newCourseId={newCourseId}
          setNewCourseId={setNewCourseId}
          newDate={newDate}
          setNewDate={setNewDate}
          newTotalItems={newTotalItems}
          setNewTotalItems={setNewTotalItems}
          newPassingRate={newPassingRate}
          setNewPassingRate={setNewPassingRate}
          newTopics={newTopics}
          setNewTopics={setNewTopics}
          handleCreateExam={handleCreateExam}
          onCancel={() => {
            resetForm()
          }}
          courses={coursesList}
          coursesLoading={coursesLoading}
          coursesError={coursesError}
          isSaving={isSaving}
        />
      </TooltipProvider>
    </SidebarProvider>
  )
}

export default InstructorExamsPage
