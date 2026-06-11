import { useMemo, useRef, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft, AlertCircle, KeyRound, ScanLine, Users, BarChart3, BookOpen, ClipboardList } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import type { AnswerKeyItem, ExamTopic, StudentResult } from "./types"
import {
  deleteAnswerKeyVersion,
  getAnswerKeyVersionsByExam,
  saveAnswerKeysFromEditor,
  type AnswerKeyVersionRecord,
} from "@/lib/supabase/exam/answer-key-service"
import { useCreateFeedback } from "@/lib/supabase/feedback/context/use-create-feedback"
import { useFetchFeedback } from "@/lib/supabase/feedback/context/use-fetch-feedback"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { dateFormatter } from "@/utils/timestamp/timestamp"

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

const InstructorExamsPage = ({ userProfile }: { userProfile: UserProfile | null | undefined }) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
  const { exams, isLoading, refetch } = useFetchExams(userProfile?.course?.course_id!)
  const { mutateAsync: createExam, isPending: isCreatePending } = useCreateExam()
  const { mutateAsync: updateExam, isPending: isUpdatePending } = useUpdateExam()
  const { mutateAsync: saveFeedback } = useCreateFeedback()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [selectedExamID, setSelectedExamID] = useState<string | null>(null)
  const [editingExam, setEditingExam] = useState<Exam | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [studentResults, setStudentResults] = useState<StudentResult[]>([])
  const [scannerExamineeId, setScannerExamineeId] = useState("")
  const [scannerKeyVersion, setScannerKeyVersion] = useState("")
  const nextResultIdRef = useRef(1)
  const examIdParam = searchParams.get("examId")
  const activeExamId = selectedExamID || examIdParam || null

  const {
    data: answerKeyRecords = [],
    refetch: refetchAnswerKeys,
  } = useQuery<AnswerKeyVersionRecord[]>({
    queryKey: ["answerKeys", activeExamId],
    queryFn: async () => {
      if (!activeExamId) return []
      const result = await getAnswerKeyVersionsByExam(activeExamId)
      if (!result.success) {
        toast.error(result.error || "Failed to load answer keys")
        return []
      }
      return result.data
    },
    enabled: !!activeExamId,
    staleTime: 5 * 60 * 1000,
  })

  const answerKeyVersions = useMemo(
    () => answerKeyRecords.map((record) => record.key_version),
    [answerKeyRecords],
  )

  const answerKeys = useMemo(
    () => answerKeyRecords.flatMap((record) => record.answer_key),
    [answerKeyRecords],
  )

  const { scoreResults } = useFetchScoreResults(activeExamId ?? "")
  const { feedbackEntries } = useFetchFeedback(activeExamId ?? "")

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
    () => exams.find((exam) => exam.exam_id === activeExamId),
    [exams, activeExamId],
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
  // function handleOpenEdit(exam: Exam) {
  //   setEditingExam(exam)
    
  //   // Convert formatted date back to YYYY-MM-DD for the HTML date input
  //   const parsedDate = new Date(exam.exam_date)
  //   const formattedDateForInput = !isNaN(parsedDate.getTime()) 
  //     ? parsedDate.toISOString().split('T')[0] 
  //     : ""

  //   setFormData({
  //     title: exam.exam_title || "",
  //     course: exam.course?.course_name || "",
  //     examDate: formattedDateForInput,
  //     totalItems: exam.total_items || 100,
  //     passingRate: exam.passing_rate || 75,
  //     topics: exam.topics ? exam.topics.join(", ") : "",
  //   })
  //   setDialogOpen(true)
  // }

  // ADD / EDIT handlers
  async function handleSaveExam(form: ExamFormData) {
    try {
      if (editingExam) {
        await updateExam({
          exam_id: editingExam.exam_id || "",
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
          course_id: userProfile?.course?.course_id!,
          created_by: userProfile?.user_id!,
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

  const keyVersionOptions = useMemo(
    () => (answerKeyVersions.length > 0 ? answerKeyVersions : ["A", "B"]),
    [answerKeyVersions],
  )

  const effectiveScannerKeyVersion = useMemo(() => {
    if (scannerKeyVersion && keyVersionOptions.includes(scannerKeyVersion)) {
      return scannerKeyVersion
    }
    return keyVersionOptions[0] ?? ""
  }, [scannerKeyVersion, keyVersionOptions])


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

    await refetchAnswerKeys()
    toast.success("Answer keys saved successfully")
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
        exam_id: selectedExam.exam_id || "",
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
          <ScrollArea className="flex-1 bg-[#FFFFFF]">
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
                        resetResults()
                        setScannerExamineeId("")
                        setScannerKeyVersion("")
                        if (searchParams.has("examId")) {
                          const nextParams = new URLSearchParams(searchParams)
                          nextParams.delete("examId")
                          setSearchParams(nextParams, { replace: true })
                        }
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
                        {selectedExam.course?.course_name} · {dateFormatter(selectedExam.exam_date)} ·{" "}
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
                        value: selectedExam.topics?.length || 0,
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
                            <div className="flex size-8 items-center justify-center rounded-lg bg-[#2DC653]/10 dark:bg-[#2DC653]/20">
                              <stat.icon className="size-4 text-[#2DC653]" />
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
                        topics={selectedExam.topics || []}
                        totalItems={selectedExam.total_items}
                        keyVersions={
                          answerKeyVersions.length > 0 ? answerKeyVersions : undefined
                        }
                        initialKeys={answerKeys}
                        onSave={(keys, versions) => {
                          void handleSaveAnswerKeys(selectedExam.exam_id || "", keys, versions)
                        }}
                        onCancel={() => {}}
                      />
                    </TabsContent>

                    <TabsContent value="scanner" className="mt-4 space-y-4">
                      {answerKeyVersions.length === 0 && (
                        <Alert>
                          <AlertCircle className="size-4" />
                          <AlertDescription>
                            Add an answer key version before starting the scanner.
                          </AlertDescription>
                        </Alert>
                      )}
                      <Card>
                        <CardContent className="p-4 space-y-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                              <Label htmlFor="scannerExamineeId">Examinee ID Number</Label>
                              <Input
                                id="scannerExamineeId"
                                placeholder="e.g., 000000"
                                value={scannerExamineeId}
                                onChange={(event) => setScannerExamineeId(event.target.value)}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="scannerAnswerKey">Answer Key</Label>
                              <Select
                                value={effectiveScannerKeyVersion}
                                onValueChange={setScannerKeyVersion}
                              >
                                <SelectTrigger id="scannerAnswerKey">
                                  <SelectValue placeholder="Select version" />
                                </SelectTrigger>
                                <SelectContent>
                                  {keyVersionOptions.map((version) => (
                                    <SelectItem key={version} value={version}>
                                      Version {version}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs text-muted-foreground">
                              The scanner opens in a dedicated page for camera-only capture.
                            </p>
                            <Button
                              className="gap-1.5 bg-[#2DC653] hover:bg-[#25a244] text-white"
                              disabled={!scannerExamineeId.trim() || !effectiveScannerKeyVersion}
                              onClick={() => {
                                if (!selectedExam) return
                                const trimmedId = scannerExamineeId.trim()
                                if (!trimmedId) {
                                  toast.error("Enter an examinee ID number to continue.")
                                  return
                                }
                                const nextParams = new URLSearchParams()
                                nextParams.set("examineeId", trimmedId)
                                if (effectiveScannerKeyVersion) {
                                  nextParams.set("keyVersion", effectiveScannerKeyVersion)
                                }
                                navigate(`/instructor/exams/${selectedExam.exam_id}/scanner?${nextParams.toString()}`)
                              }}
                            >
                              <ScanLine className="size-4" /> Open Scanner
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
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
                      className="gap-1.5 bg-[#2DC653] hover:bg-[#25a244] text-white"
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
                        className="gap-1.5 bg-[#2DC653] hover:bg-[#25a244] text-white"
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
                            setSelectedExamID(exam.exam_id || "")
                            resetResults()
                            setScannerExamineeId("")
                            setScannerKeyVersion("")
                            const nextParams = new URLSearchParams(searchParams)
                            nextParams.set("examId", exam.exam_id || "")
                            setSearchParams(nextParams, { replace: true })
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
