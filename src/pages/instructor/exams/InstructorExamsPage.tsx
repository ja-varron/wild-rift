import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Plus,
  ArrowLeft,
  ChevronRight,
  Calendar,
  BookOpen,
  Loader2,
  AlertCircle,
  KeyRound,
  ScanLine,
  Users,
  BarChart3,
  MapPin,
  FileText,
  Pencil,
  Trash2,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useFetchInstructorExams } from "@/lib/supabase/exam/context/use-fetch-instructor-exams"
import {
  useCreateExam,
  useUpdateExam,
  useDeleteExam,
  useSaveExamResults,
  useSaveAnswerKey,
  useSaveScannedPaper,
  useUpdateStudentFeedback,
} from "@/lib/supabase/exam/use-exam-mutations"
import { supabase } from "@/lib/supabase/supabase"
import { AnswerKeyEditor } from "./components/AnswerKeyEditor"
import { ScannerPanel } from "./components/ScannerPanel"
import { StudentScoresTable } from "./components/StudentScoresTable"
import { ExamAnalyticsPanel } from "./components/ExamAnalyticsPanel"
import { LearningMaterialsPanel } from "./components/LearningMaterialsPanel"
import type { Exam, AnswerKeyItem, ScannedPaper, StudentResult, ExamTopic } from "./types"
import { toast } from "sonner"

const defaultFormData = {
  title: "",
  course: "",
  location: "",
  examDate: "",
  totalItems: 50,
  passingRate: 60,
  topics: "",
}

const InstructorExamsPage = () => {
  const [instructorId, setInstructorId] = useState<string>()
  const [localExams, setLocalExams] = useState<Exam[]>([])
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null)
  const [editingExamId, setEditingExamId] = useState<number | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [formData, setFormData] = useState(defaultFormData)
  const [error, setError] = useState<string | null>(null)

  const createMutation = useCreateExam()
  const updateMutation = useUpdateExam()
  const deleteMutation = useDeleteExam()
  const saveExamResultsMutation = useSaveExamResults()
  const saveAnswerKeyMutation = useSaveAnswerKey()
  const saveScannedPaperMutation = useSaveScannedPaper()
  const updateStudentFeedbackMutation = useUpdateStudentFeedback()

  useEffect(() => {
    const getInstructor = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setInstructorId(user.id)
      }
    }
    getInstructor()
  }, [])

  const { data: fetchedExams, isLoading } = useFetchInstructorExams(instructorId)

  useEffect(() => {
    if (fetchedExams) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalExams(fetchedExams)
    }
  }, [fetchedExams])

  const selectedExam = localExams.find((exam) => exam.id === selectedExamId) ?? null

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

  function formatDateForInput(value: string): string {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return ""
    const yyyy = parsed.getFullYear()
    const mm = String(parsed.getMonth() + 1).padStart(2, "0")
    const dd = String(parsed.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
  }

  function buildTopicObjects(names: string[]): ExamTopic[] {
    return names.map((name, index) => ({
      id: Date.now() + index,
      name,
    }))
  }

  function openCreateDialog() {
    setEditingExamId(null)
    setFormData(defaultFormData)
    setError(null)
    setOpenDialog(true)
  }

  function openEditDialog(exam: Exam) {
    setEditingExamId(exam.id)
    setFormData({
      title: exam.title,
      course: exam.course,
      location: exam.location || "",
      examDate: formatDateForInput(exam.date),
      totalItems: exam.totalItems,
      passingRate: exam.passingRate,
      topics: exam.topics.map((t) => t.name).join(", "),
    })
    setError(null)
    setOpenDialog(true)
  }

  function handleDeleteExam(exam: Exam) {
    const confirmed = window.confirm(`Delete exam "${exam.title}"? This action cannot be undone.`)
    if (!confirmed) return

    deleteMutation.mutate(exam.id, {
      onSuccess: (result) => {
        if (!result?.success) {
          toast.error(result?.error || "Failed to delete exam")
          return
        }

        setLocalExams((prev) => prev.filter((e) => e.id !== exam.id))
        if (selectedExamId === exam.id) {
          setSelectedExamId(null)
        }
        toast.success("Exam deleted")
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to delete exam")
      },
    })
  }

  function handleSaveAnswerKeys(examId: number, keys: AnswerKeyItem[]) {
    setLocalExams((prev) =>
      prev.map((exam) => (exam.id === examId ? { ...exam, answerKeys: keys } : exam)),
    )

    saveAnswerKeyMutation.mutate(
      { examId, answerKey: keys },
      {
        onSuccess: () => {
          toast.success("Answer keys saved")
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to save answer keys")
        },
      },
    )
  }

  function handleUpdateFeedback(examId: number, studentResultId: number, feedback: string) {
    const exam = localExams.find((e) => e.id === examId)
    const result = exam?.studentResults.find((r) => r.id === studentResultId)
    if (!result) {
      toast.error("Student result not found")
      return
    }

    setLocalExams((prev) =>
      prev.map((e) => {
        if (e.id !== examId) return e
        return {
          ...e,
          studentResults: e.studentResults.map((r) =>
            r.id === studentResultId ? { ...r, feedback } : r,
          ),
        }
      }),
    )

    updateStudentFeedbackMutation.mutate(
      {
        examId,
        studentId: result.studentId,
        feedback,
      },
      {
        onSuccess: () => {
          toast.success("Feedback saved")
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to save feedback")
        },
      },
    )
  }

  function getAnswerKeyForScan(exam: Exam): string[] {
    if (!exam.answerKeys || exam.answerKeys.length === 0) {
      return Array.from({ length: Math.max(1, exam.totalItems) }, () => "A")
    }

    const versionA = exam.answerKeys.filter((k) => k.keyVersion === "A")
    const fallback = versionA.length > 0 ? versionA : exam.answerKeys
    return [...fallback]
      .sort((a, b) => a.questionNumber - b.questionNumber)
      .slice(0, exam.totalItems)
      .map((k) => k.correctAnswer)
  }

  function handleCaptureScannedPaperWithResult(
    examId: number,
    paper: ScannedPaper,
    scanResult?: {
      resultId: string
      studentId?: string | null
      studentName?: string | null
      createdAt?: string
      grading?: {
        totalItems?: number
        scorePercent?: number
        passed?: boolean
      }
    },
  ) {
    const exam = localExams.find((e) => e.id === examId)
    if (!exam) return

    let newResult: StudentResult | null = null
    if (paper.status === "Graded") {
      const totalItems = Math.max(scanResult?.grading?.totalItems || exam.totalItems, 1)
      const scorePercent = Math.max(0, Math.min(100, scanResult?.grading?.scorePercent ?? exam.passingRate))
      const score = Math.round((scorePercent / 100) * totalItems)
      const passed =
        typeof scanResult?.grading?.passed === "boolean"
          ? scanResult.grading.passed
          : Math.round((score / totalItems) * 100) >= exam.passingRate

      newResult = {
        id: exam.studentResults.length + 1000,
        name: scanResult?.studentName || paper.studentName || `Student ${paper.id}`,
        studentId: scanResult?.studentId || paper.studentId || `UNKNOWN-${paper.id}`,
        score,
        totalItems,
        passed,
        topicScores: [],
        scannedAt: scanResult?.createdAt ? new Date(scanResult.createdAt).toLocaleString() : paper.scannedAt,
      }
    }

    setLocalExams((prev) =>
      prev.map((currentExam) => {
        if (currentExam.id !== examId) return currentExam
        const nextScanned = [paper, ...currentExam.scannedPapers]
        const gradedCount = nextScanned.filter((p) => p.status === "Graded").length

        let nextResults = currentExam.studentResults
        if (newResult) {
          const existingIdx = currentExam.studentResults.findIndex((r) => r.studentId === newResult!.studentId)
          if (existingIdx >= 0) {
            nextResults = [...currentExam.studentResults]
            nextResults[existingIdx] = { ...nextResults[existingIdx], ...newResult }
          } else {
            nextResults = [newResult, ...currentExam.studentResults]
          }
        }

        return {
          ...currentExam,
          scannedPapers: nextScanned,
          papersScanned: gradedCount,
          studentResults: nextResults,
          studentsEnrolled: Math.max(currentExam.studentsEnrolled, nextResults.length),
        }
      }),
    )

    if (newResult) {
      saveExamResultsMutation.mutate(
        {
          examId,
          studentResults: [newResult],
        },
        {
          onError: (err) => {
            console.error("Failed to persist generated exam result:", err)
          },
        },
      )
    }

    saveScannedPaperMutation.mutate(
      { examId, scannedPaper: paper },
      {
        onError: (err) => {
          console.error("Failed to persist scanned paper:", err)
        },
      },
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value) || 0 : value,
    }))
  }

  const handleSubmitExam = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!instructorId) {
      setError("Instructor not authenticated")
      return
    }

    if (!formData.title || !formData.course || !formData.examDate) {
      setError("Please fill in all required fields")
      return
    }

    const topicsList = formData.topics
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    if (editingExamId !== null) {
      updateMutation.mutate(
        {
          examId: editingExamId,
          examData: {
            title: formData.title,
            course: formData.course,
            location: formData.location,
            examDate: formData.examDate,
            totalItems: formData.totalItems,
            passingRate: formData.passingRate,
            topics: buildTopicObjects(topicsList.length > 0 ? topicsList : ["General"]),
          },
        },
        {
          onSuccess: (result) => {
            if (!result?.success) {
              setError(result?.error || "Failed to update exam")
              return
            }

            setLocalExams((prev) =>
              prev.map((exam) =>
                exam.id === editingExamId
                  ? {
                      ...exam,
                      title: formData.title,
                      course: formData.course,
                      location: formData.location.trim() || "TBA",
                      date: new Date(formData.examDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }),
                      totalItems: formData.totalItems,
                      passingRate: formData.passingRate,
                      topics: buildTopicObjects(topicsList.length > 0 ? topicsList : ["General"]),
                    }
                  : exam,
              ),
            )

            toast.success("Exam updated")
            setOpenDialog(false)
            setEditingExamId(null)
          },
          onError: (err) => {
            const errorMsg = err instanceof Error ? err.message : "Failed to update exam"
            setError(errorMsg)
          },
        },
      )
      return
    }

    createMutation.mutate(
      {
        instructorId,
        examData: {
          title: formData.title,
          course: formData.course,
          location: formData.location,
          examDate: formData.examDate,
          totalItems: formData.totalItems,
          passingRate: formData.passingRate,
          topics: topicsList.length > 0 ? topicsList : ["General"],
        },
      },
      {
        onSuccess: (result) => {
          if (!result?.success) {
            setError(result?.error || "Failed to create exam")
            return
          }

          toast.success("Exam created")
          setFormData(defaultFormData)
          setOpenDialog(false)
        },
        onError: (err) => {
          const errorMsg = err instanceof Error ? err.message : "Failed to create exam"
          setError(errorMsg)
        },
      },
    )
  }

  return (
    <div className="min-h-screen w-full bg-white p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold">Exam Management</h1>
            <p className="text-gray-600">Create, configure, and manage your examinations.</p>
          </div>
          <Button
            className="gap-1.5 bg-blue-600 hover:bg-blue-700"
            onClick={openCreateDialog}
          >
            <Plus className="size-4" />
            Create Exam
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {selectedExam ? (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="mt-0.5 shrink-0"
                onClick={() => setSelectedExamId(null)}
              >
                <ArrowLeft className="size-4" />
              </Button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold">{selectedExam.title}</h1>
                  <Badge className={statusBadgeClass(selectedExam.status)}>
                    {selectedExam.status}
                  </Badge>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {selectedExam.course}
                  {selectedExam.location ? ` · ${selectedExam.location}` : ""}
                  {` · ${selectedExam.date} · ${selectedExam.totalItems} items · ${selectedExam.passingRate}% passing`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Total Items", value: selectedExam.totalItems, icon: BookOpen },
                { label: "Students", value: selectedExam.studentsEnrolled, icon: Users },
                { label: "Papers Scanned", value: selectedExam.papersScanned, icon: ScanLine },
                { label: "Topics", value: selectedExam.topics.length, icon: BarChart3 },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                    </div>
                    <div className="flex size-8 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
                      <stat.icon className="size-4 text-teal-700" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Tabs defaultValue="answer-key">
              <TabsList>
                <TabsTrigger value="answer-key" className="gap-1.5">
                  <KeyRound className="size-3.5" /> Answer Key
                </TabsTrigger>
                <TabsTrigger value="scanner" className="gap-1.5">
                  <ScanLine className="size-3.5" /> Scan Papers
                </TabsTrigger>
                <TabsTrigger value="scores" className="gap-1.5">
                  <Users className="size-3.5" /> Feedback & Scores
                </TabsTrigger>
                <TabsTrigger value="materials" className="gap-1.5">
                  <FileText className="size-3.5" /> Materials
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
                  onSave={(keys) => handleSaveAnswerKeys(selectedExam.id, keys)}
                  onCancel={() => {
                    toast.info("Answer key editing canceled")
                  }}
                />
              </TabsContent>

              <TabsContent value="scanner" className="mt-4">
                <ScannerPanel
                  examId={selectedExam.id}
                  answerKey={getAnswerKeyForScan(selectedExam)}
                  scannedPapers={selectedExam.scannedPapers}
                  examTitle={selectedExam.title}
                  onCapture={(paper, scanResult) =>
                    handleCaptureScannedPaperWithResult(selectedExam.id, paper, scanResult)
                  }
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

              <TabsContent value="materials" className="mt-4">
                <LearningMaterialsPanel
                  examId={selectedExam.id}
                  instructorId={instructorId}
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
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : localExams.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <p className="mb-4 text-gray-500">No exams created yet</p>
            <Button
              className="gap-1.5 bg-blue-600 hover:bg-blue-700"
              onClick={openCreateDialog}
            >
              <Plus className="size-4" />
              Create Your First Exam
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {localExams.map((exam) => (
              <div key={exam.id} className="rounded-lg border p-4">
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="text-lg font-semibold">{exam.title}</h3>
                  <Badge>{exam.status}</Badge>
                </div>

                <div className="mb-4 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <BookOpen className="size-4" />
                    <span>{exam.course}</span>
                  </div>
                  {exam.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4" />
                      <span>{exam.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4" />
                    <span>{exam.date}</span>
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded bg-gray-100 p-2">
                    <p className="font-medium text-gray-600">Items</p>
                    <p className="font-semibold">{exam.totalItems}</p>
                  </div>
                  <div className="rounded bg-gray-100 p-2">
                    <p className="font-medium text-gray-600">Students</p>
                    <p className="font-semibold">{exam.studentsEnrolled}</p>
                  </div>
                  <div className="rounded bg-gray-100 p-2">
                    <p className="font-medium text-gray-600">Scanned</p>
                    <p className="font-semibold">{exam.papersScanned}</p>
                  </div>
                  <div className="rounded bg-gray-100 p-2">
                    <p className="font-medium text-gray-600">Passing</p>
                    <p className="font-semibold">{exam.passingRate}%</p>
                  </div>
                </div>

                {exam.topics.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {exam.topics.slice(0, 2).map((t) => (
                      <Badge key={t.id} variant="outline" className="text-xs">
                        {t.name}
                      </Badge>
                    ))}
                    {exam.topics.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{exam.topics.length - 2} more
                      </Badge>
                    )}
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  onClick={() => setSelectedExamId(exam.id)}
                >
                  View Details <ChevronRight className="ml-1 size-4" />
                </Button>

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => openEditDialog(exam)}
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => handleDeleteExam(exam)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingExamId !== null ? "Edit Exam" : "Create New Exam"}</DialogTitle>
              <DialogDescription>
                {editingExamId !== null
                  ? "Update exam details and save your changes."
                  : "Set up a new examination for your course."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmitExam} className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium">
                  Exam Title *
                </Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Midterm Exam"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="course" className="text-sm font-medium">
                  Course *
                </Label>
                <Input
                  id="course"
                  name="course"
                  placeholder="e.g., Biology 101"
                  value={formData.course}
                  onChange={handleInputChange}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="location" className="text-sm font-medium">
                  Location
                </Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="e.g., Room 204, Main Building"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="examDate" className="text-sm font-medium">
                  Exam Date *
                </Label>
                <Input
                  id="examDate"
                  name="examDate"
                  type="date"
                  value={formData.examDate}
                  onChange={handleInputChange}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="totalItems" className="text-sm font-medium">
                  Total Items (Questions)
                </Label>
                <Input
                  id="totalItems"
                  name="totalItems"
                  type="number"
                  min="1"
                  max="500"
                  value={formData.totalItems}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="passingRate" className="text-sm font-medium">
                  Passing Rate (%)
                </Label>
                <Input
                  id="passingRate"
                  name="passingRate"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.passingRate}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="topics" className="text-sm font-medium">
                  Topics (comma-separated)
                </Label>
                <Input
                  id="topics"
                  name="topics"
                  placeholder="e.g., Genetics, Evolution, Ecology"
                  value={formData.topics}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpenDialog(false)
                    setEditingExamId(null)
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 gap-1.5 bg-blue-600 hover:bg-blue-700"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  {editingExamId !== null
                    ? (updateMutation.isPending ? "Saving..." : "Save Changes")
                    : (createMutation.isPending ? "Creating..." : "Create Exam")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default InstructorExamsPage
