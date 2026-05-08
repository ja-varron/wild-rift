import { useMemo, useRef, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft, AlertCircle, Calendar, KeyRound, ScanLine, Users, BarChart3, BookOpen, ClipboardList } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Exam } from "@/model/exam"
import { toast } from "sonner"
import { AddExamDialog } from "./dialogs/AddExamDialog"
import { ExamCard } from "./components/ExamCard"
import { useFetchExams } from "@/lib/supabase/exam/context/use-fetch-exams"
import { useCreateExam } from "@/lib/supabase/exam/context/use-create-exam"
import { useUpdateExam } from "@/lib/supabase/exam/context/use-update-exam"
import { useFetchScoreResults } from "@/lib/supabase/exam/context/use-fetch-score-results"
import type { UserProfile } from "@/model/user-profile"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { AnswerKeyEditor } from "./components/AnswerKeyEditor"
import { ExamAnalyticsPanel } from "./components/ExamAnalyticsPanel"
import { StudentScoresTable } from "./components/StudentScoresTable"
import type { AnswerKeyItem, ExamTopic, ScannedPaper, StudentResult } from "./types"
import {
  deleteAnswerKeyVersion,
  getAnswerKeyVersionsByExam,
  saveAnswerKeysFromEditor,
} from "@/lib/supabase/exam/answer-key-service"
import { useCreateScoreResults } from "@/lib/supabase/exam/context/use-create-score-results"
import { useCreateFeedback } from "@/lib/supabase/feedback/context/use-create-feedback"
import { useFetchFeedback } from "@/lib/supabase/feedback/context/use-fetch-feedback"
import { ScannerPanel } from "./components/ScannerPanel"

export type ExamFormData = {
  title: string
  course: string
  examDate: string
  totalItems: number
  passingRate: number
  topics: string
}

const defaultFormData: ExamFormData = {
  title: "",
  course: "",
  examDate: "",
  totalItems: 100,
  passingRate: 75,
  topics: "",
}

const ANSWER_CHOICES = ["A", "B", "C", "D", "E"] as const

type AnswerChoice = (typeof ANSWER_CHOICES)[number]

function normalizeAnswerValue(value: unknown): AnswerChoice | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const idx = Math.trunc(value)
    if (idx >= 1 && idx <= ANSWER_CHOICES.length) return ANSWER_CHOICES[idx - 1]
    return null
  }

  if (typeof value !== "string") return null
  const trimmed = value.trim().toUpperCase()
  if (!trimmed) return null
  if (ANSWER_CHOICES.includes(trimmed as AnswerChoice)) {
    return trimmed as AnswerChoice
  }
  const parsed = Number.parseInt(trimmed, 10)
  if (Number.isFinite(parsed) && parsed >= 1 && parsed <= ANSWER_CHOICES.length) {
    return ANSWER_CHOICES[parsed - 1]
  }
  return null
}

function getNormalizedAnswer(
  answers: Record<string, string> | string[] | undefined,
  questionNumber: number,
): AnswerChoice | null {
  if (!answers) return null
  if (Array.isArray(answers)) {
    return normalizeAnswerValue(answers[questionNumber - 1])
  }

  const value = answers[String(questionNumber)]
  return normalizeAnswerValue(value)
}


const InstructorExamsPage = ({ userProfile }: { userProfile: UserProfile | null | undefined }) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
  const { exams, isLoading, refetch } = useFetchExams(userProfile?.course?.course_id!)
  const { mutateAsync: createExam, isPending: isCreatePending } = useCreateExam()
  const { mutateAsync: updateExam, isPending: isUpdatePending } = useUpdateExam()
  const { mutateAsync: createScoreResults } = useCreateScoreResults()
  const { mutateAsync: saveFeedback } = useCreateFeedback()

  const [selectedExamID, setSelectedExamID] = useState<string | null>(null)
  const [editingExam, setEditingExam] = useState<Exam | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [answerKeys, setAnswerKeys] = useState<AnswerKeyItem[]>([])
  const [answerKeyVersions, setAnswerKeyVersions] = useState<string[]>([])
  const [studentResults, setStudentResults] = useState<StudentResult[]>([])
  const nextResultIdRef = useRef(1)

  const { scoreResults } = useFetchScoreResults(selectedExamID ?? "")
  const { feedbackEntries } = useFetchFeedback(selectedExamID ?? "")

  const feedbackByStudentId = useMemo(() => {
    const map = new Map<string, { comment: string; message_at: string }>()
    for (const entry of feedbackEntries) {
      const studentId = entry.student?.student_id?.trim()
      if (!studentId) continue
      const messageAt = entry.message_at || ""
      const existing = map.get(studentId)
      if (!existing || messageAt > existing.message_at) {
        map.set(studentId, { comment: entry.comment, message_at: messageAt })
      }
    }
    return map
  }, [feedbackEntries])

  const [formData, setFormData] = useState<ExamFormData>(defaultFormData)
  // const [error, setError] = useState<string | null>(null)
  // const [deletingExamId, setDeletingExamId] = useState<string | null>(null)

  const selectedExam = useMemo(
    () => exams.find((exam) => exam.exam_id === selectedExamID),
    [exams, selectedExamID],
  )

  const topicDefinitions = useMemo<ExamTopic[]>(() => {
    const topics = selectedExam?.topics ?? []
    if (topics.length === 0) return [{ topic_idx: 1, name: "General" }]

    return topics.map((name, index) => ({
      topic_idx: index + 1,
      name: name.trim() || `Topic ${index + 1}`,
    }))
  }, [selectedExam])

  const persistedResults = useMemo<StudentResult[]>(() => {
    if (!scoreResults || scoreResults.length === 0) return []

    const fallbackTotalItems = Math.max(1, selectedExam?.total_items ?? 1)
    const passingRate = selectedExam?.passing_rate ?? 0

    return scoreResults.map((result, index) => {
      const firstName = result.student.first_name.trim()
      const lastName = result.student.last_name.trim()
      const name = [firstName, lastName].filter(Boolean).join(" ") || "Unknown"
      const studentId =
        result.student.student_id ||
        result.student.examinee_id_number ||
        `unknown-${index + 1}`
      const totalItems = typeof result.totalItems === "number" && Number.isFinite(result.totalItems)
        ? result.totalItems
        : fallbackTotalItems
      const score = typeof result.totalScore === "number" && Number.isFinite(result.totalScore)
        ? result.totalScore
        : 0
      const passed = typeof result.passed === "boolean"
        ? result.passed
        : (score / Math.max(1, totalItems)) * 100 >= passingRate
      const topicScores = Array.isArray(result.topicScores)
        ? result.topicScores.map((topic, topicIndex) => ({
            topicId: Number.isFinite(topic.topic.topic_idx) ? topic.topic.topic_idx : topicIndex + 1,
            score: Number.isFinite(topic.score) ? topic.score : 0,
            maxScore: Number.isFinite(topic.total) ? topic.total : 0,
          }))
        : []

      return {
        id: index + 1,
        name,
        studentId,
        score,
        totalItems,
        passed,
        topicScores,
        scannedAt: result.scanned_at || "",
        feedback: feedbackByStudentId.get(studentId)?.comment || undefined,
      }
    })
  }, [scoreResults, selectedExam, feedbackByStudentId])

  const displayResults = useMemo<StudentResult[]>(() => {
    if (persistedResults.length === 0) return studentResults
    if (studentResults.length === 0) return persistedResults

    const merged = new Map<string, StudentResult>()
    for (const result of persistedResults) {
      merged.set(result.studentId, result)
    }

    for (const local of studentResults) {
      const key = local.studentId || `local-${local.id}`
      const existing = merged.get(key)
      if (!existing) {
        merged.set(key, local)
        continue
      }
      if (local.feedback && local.feedback !== existing.feedback) {
        merged.set(key, { ...existing, feedback: local.feedback })
      }
    }

    return Array.from(merged.values())
  }, [persistedResults, studentResults])

  function resetResults() {
    setStudentResults([])
    nextResultIdRef.current = 1
  }

  async function loadAnswerKeys(examId: string) {
    const result = await getAnswerKeyVersionsByExam(examId)

    if (!result.success) {
      toast.error(result.error || "Failed to load answer keys")
      setAnswerKeys([])
      setAnswerKeyVersions([])
      return
    }

    setAnswerKeyVersions(result.data.map((record) => record.key_version))
    setAnswerKeys(
      result.data.flatMap((record) =>
        record.answer_key.map((item) => ({
          ...item,
          exam_id: examId,
          key_version: record.key_version,
        })),
      ),
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }))
  }

  function handleOpenCreate() {
    setEditingExam(null)
    setDialogOpen(true)
  }

  // ADD / EDIT handlers
  function handleOpenEdit(exam: Exam) {
    setEditingExam(exam)
    
    // Convert formatted date back to YYYY-MM-DD for the HTML date input
    const parsedDate = new Date(exam.exam_date)
    const formattedDateForInput = !isNaN(parsedDate.getTime()) 
      ? parsedDate.toISOString().split('T')[0] 
      : ""

    setFormData({
      title: exam.exam_title || "",
      course: exam.course_id || "",
      examDate: formattedDateForInput,
      totalItems: exam.total_items || 100,
      passingRate: exam.passing_rate || 75,
      topics: exam.topics ? exam.topics.join(", ") : "",
    })
    setDialogOpen(true)
  }

  // ADD / EDIT handlers
  async function handleSaveExam(form: ExamFormData) {
    try {
      if (editingExam) {
        await updateExam({
          exam_id: editingExam.exam_id,
          updates: {
            exam_title: form.title,
            exam_date: form.examDate,
            total_items: form.totalItems,
            passing_rate: form.passingRate,
            topics: form.topics.split(",").map((t) => t.trim()),
          }
        })
        toast.success("Examination updated successfully!")
      } else {
        
        await createExam({
          // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
          course_id: userProfile?.course?.course_id!,
          created_by: userProfile?.user_id,
          exam_title: form.title,
          exam_date: form.examDate,
          total_items: form.totalItems,
          passing_rate: form.passingRate,
          topics: form.topics.split(",").map((t) => t.trim()),
        })
        toast.success("Examination created successfully!")
      }
      await refetch()
      closeExamDialog()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast.error(e.message || "An error occurred.")
    }
  }

  function closeExamDialog() {
    setDialogOpen(false)
    setEditingExam(null)
    setFormData(defaultFormData)
  }


  async function handleSaveAnswerKeys(
    exam_id: string,
    keys: AnswerKeyItem[],
    versions: string[],
  ): Promise<void> {
    const deletedVersions = answerKeyVersions.filter(
      (version) => !versions.includes(version),
    )

    for (const version of deletedVersions) {
      const deleteResult = await deleteAnswerKeyVersion(exam_id, version)
      if (!deleteResult.success) {
        toast.error(deleteResult.error || `Failed to delete key version ${version}`)
        return
      }
    }

    const result = await saveAnswerKeysFromEditor(exam_id, keys)

    if (!result.success) {
      toast.error(result.error || "Failed to save answer keys")
      return
    }

    await loadAnswerKeys(exam_id)
    toast.success("Answer keys saved successfully")
  }

  function handleScanCapture(
    paper: ScannedPaper,
    scanResult?: {
      resultId: string
      answers?: Record<string, string> | string[]
      answerKeyVersion?: string
      studentName?: string | null
      examineeId?: string
    },
  ) {
    if (!selectedExam) return

    const answers = scanResult?.answers
    if (!answers) {
      toast.error("No answers returned from the scan.")
      return
    }

    const keyVersion = scanResult?.answerKeyVersion
    if (!keyVersion) {
      toast.error("Missing answer key version for this scan.")
      return
    }

    const keyItems = answerKeys
      .filter((key) => key.key_version === keyVersion)
      .sort((a, b) => a.question_number - b.question_number)

    if (keyItems.length === 0) {
      toast.error(`No answer key found for version ${keyVersion}.`)
      return
    }

    const topics = topicDefinitions.length > 0
      ? topicDefinitions
      : [{ topic_idx: 1, name: "General" }]
    const topicIdByName = new Map(
      topics.map((topic) => [topic.name.trim().toLowerCase(), topic.topic_idx]),
    )
    const topicTotals = new Map<number, { score: number; maxScore: number }>()
    topics.forEach((topic) => {
      topicTotals.set(topic.topic_idx, { score: 0, maxScore: 0 })
    })

    let totalScore = 0
    let totalMax = 0

    for (const keyItem of keyItems) {
      const points = Number.isFinite(keyItem.points) ? keyItem.points : 1
      totalMax += points

      const topicLabel =
        typeof keyItem.topic === "string"
          ? keyItem.topic
          : keyItem.topic?.name
      const topicKey = topicLabel?.trim().toLowerCase()
        || topics[0].name.trim().toLowerCase()
      const topicId = topicIdByName.get(topicKey) ?? topics[0].topic_idx
      const bucket = topicTotals.get(topicId) ?? { score: 0, maxScore: 0 }
      bucket.maxScore += points

      const answer = getNormalizedAnswer(answers, keyItem.question_number)
      if (answer && answer === keyItem.correct_answer) {
        bucket.score += points
        totalScore += points
      }
      topicTotals.set(topicId, bucket)
    }

    const topicScores = topics.map((topic) => {
      const bucket = topicTotals.get(topic.topic_idx) ?? { score: 0, maxScore: 0 }
      return {
        topicId: topic.topic_idx,
        score: bucket.score,
        maxScore: Math.max(1, bucket.maxScore),
      }
    })

    const topicScoresPayload = topics.map((topic) => {
      const bucket = topicTotals.get(topic.topic_idx) ?? { score: 0, maxScore: 0 }
      const safeMax = Math.max(1, bucket.maxScore)
      return {
        topicId: topic.topic_idx,
        topicName: topic.name,
        score: bucket.score,
        maxScore: safeMax,
        percent: Math.round((bucket.score / safeMax) * 100),
      }
    })

    const totalItems = totalMax > 0
      ? totalMax
      : Math.max(1, selectedExam.total_items)
    const scorePercent = (totalScore / Math.max(1, totalItems)) * 100
    const passed = scorePercent >= selectedExam.passing_rate

    const resultBase = {
      name: scanResult?.studentName || paper.studentName,
      studentId: paper.studentId,
      score: totalScore,
      totalItems,
      passed,
      topicScores,
      scannedAt: paper.scannedAt,
    }

    setStudentResults((prev) => {
      const existingIndex = prev.findIndex(
        (entry) => entry.studentId === resultBase.studentId,
      )
      if (existingIndex >= 0) {
        const existing = prev[existingIndex]
        const next = [...prev]
        next[existingIndex] = {
          ...existing,
          ...resultBase,
          id: existing.id,
          feedback: existing.feedback,
        }
        return next
      }

      const nextId = nextResultIdRef.current++
      return [{ id: nextId, ...resultBase }, ...prev]
    })

    void createScoreResults({
      examId: selectedExam.exam_id,
      examineeId: scanResult?.examineeId ?? paper.studentId,
      answers,
      scorePayload: {
        totalScore,
        totalItems,
        scorePercent,
        passed,
        answerKeyVersion: keyVersion,
        scannedAt: paper.scannedAt,
        topicScores: topicScoresPayload,
      },
    }).catch((error) => {
      toast.error(error instanceof Error ? error.message : "Failed to store scan results.")
    })
  }

  async function handleUpdateFeedback(studentId: string, feedback: string) {
    const trimmedStudentId = studentId.trim()
    if (!trimmedStudentId || trimmedStudentId === "—") {
      toast.error("Student ID is required to save feedback.")
      return
    }

    setStudentResults((prev) => {
      const existingIndex = prev.findIndex(
        (entry) => entry.studentId === trimmedStudentId,
      )
      if (existingIndex >= 0) {
        const next = [...prev]
        next[existingIndex] = { ...next[existingIndex], feedback }
        return next
      }

      const baseEntry = displayResults.find(
        (entry) => entry.studentId === trimmedStudentId,
      )
      if (!baseEntry) return prev

      return [{ ...baseEntry, feedback }, ...prev]
    })

    if (!selectedExam) return

    try {
      await saveFeedback({
        exam_id: selectedExam.exam_id,
        student_id: trimmedStudentId,
        comment: feedback,
        message_at: new Date().toISOString(),
      })
      toast.success("Feedback saved.")
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save feedback.",
      )
    }
  }

  return (
    <SidebarProvider>
      <TooltipProvider>
        <div className="flex min-h-screen w-full bg-background">
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
                      onClick={() => {
                        setSelectedExamID(null)
                        setAnswerKeys([])
                        setAnswerKeyVersions([])
                        resetResults()
                      }}
                    >
                      <ArrowLeft className="size-4" />
                    </Button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-2xl font-bold">
                          {selectedExam.exam_title}
                        </h1>
                      </div>
                      <p className="text-muted-foreground text-sm mt-0.5">
                        {selectedExam.course?.course_name} · {selectedExam.exam_date} ·{" "}
                        {selectedExam.total_items} items ·{" "}
                        {selectedExam.passing_rate}% passing
                      </p>
                    </div>
                  </div>

                  {/* Overview stat cards */}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                      {
                        label: "Total Items",
                        value: selectedExam.total_items,
                        icon: ClipboardList,
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
                        totalItems={selectedExam.total_items}
                        keyVersions={
                          answerKeyVersions.length > 0 ? answerKeyVersions : undefined
                        }
                        initialKeys={answerKeys}
                        onSave={(keys, versions) => {
                          void handleSaveAnswerKeys(selectedExam.exam_id, keys, versions)
                        }}
                        onCancel={() => {}}
                      />
                    </TabsContent>

                    <TabsContent value="scanner" className="mt-4">
                      <ScannerPanel
                        examId={selectedExam.exam_id}
                        scannedPapers={[]}
                        examTitle={""}
                        answerKeyVersions={answerKeyVersions}
                        onCapture={handleScanCapture}
                      />
                    </TabsContent>

                    <TabsContent value="scores" className="mt-4">
                      <StudentScoresTable
                        results={scoreResults ?? []}
                        topics={topicDefinitions}
                        passingRate={selectedExam.passing_rate}
                        feedbackEntries={feedbackEntries}
                        onUpdateFeedback={handleUpdateFeedback}
                      />
                    </TabsContent>

                    <TabsContent value="analytics" className="mt-4">
                      <ExamAnalyticsPanel
                        results={displayResults}
                        topics={topicDefinitions}
                        passingRate={selectedExam.passing_rate}
                      />
                    </TabsContent>
                  </Tabs>
                </>
              ) : (
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
                      onClick={handleOpenCreate}
                    >
                      <Plus className="size-4" />
                      Create Exam
                    </Button>
                  </div>

                  {isLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-32" />
                      ))}
                    </div>
                  ) : !exams.length ? (
                    <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                      <p className="mb-4 text-gray-500">No exams created yet</p>
                      <Button
                        className="gap-1.5 bg-blue-600 hover:bg-blue-700"
                        onClick={handleOpenCreate}
                      >
                        <Plus className="size-4" />
                        Create Your First Exam
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
                      {exams.map((exam) => (
                        <ExamCard
                          key={exam.exam_id}
                          exam={exam}
                          onSelect={() => {
                            setSelectedExamID(exam.exam_id)
                            void loadAnswerKeys(exam.exam_id)
                            resetResults()
                          }}
                        />
                      ))}
                    </div>
                  )}

                </>
              )}
            </main>
          </ScrollArea>
        </div>

        <AddExamDialog
          createDialogOpen={dialogOpen}
          setCreateDialogOpen={setDialogOpen}
          editingExam={editingExam}
          formData={formData}
          onInputChange={handleInputChange}
          onSubmit={handleSaveExam}
          isSubmitting={isCreatePending || isUpdatePending}
          onCancel={closeExamDialog}
        />
      </TooltipProvider>
    </SidebarProvider>
  )
}

export default InstructorExamsPage
