import { useMemo } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { ArrowLeft, ScanLine } from "lucide-react"
import { toast } from "sonner"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { UserProfile } from "@/model/user-profile"
import type { AnswerKeyItem, ExamTopic, ScannedPaper } from "./types"
import { ScannerPanel } from "./components/ScannerPanel"
import { useFetchExams } from "@/lib/supabase/exam/context/use-fetch-exams"
import { useCreateScoreResults } from "@/lib/supabase/exam/context/use-create-score-results"
import { getAnswerKeyVersionsByExam, type AnswerKeyVersionRecord } from "@/lib/supabase/exam/answer-key-service"
import { useQuery } from "@tanstack/react-query"

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

const InstructorExamScannerPage = ({
  userProfile,
}: {
  userProfile: UserProfile | null | undefined
}) => {
  const { examId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
  const { exams, isLoading } = useFetchExams(userProfile?.course?.course_id!)
  const { mutateAsync: createScoreResults } = useCreateScoreResults()

  const { data: answerKeyRecords = [] } = useQuery<AnswerKeyVersionRecord[]>({
    queryKey: ["answerKeys", examId],
    queryFn: async () => {
      if (!examId) return []
      const result = await getAnswerKeyVersionsByExam(examId)
      if (!result.success) {
        toast.error(result.error || "Failed to load answer keys")
        return []
      }
      return result.data
    },
    enabled: !!examId,
    staleTime: 5 * 60 * 1000,
  })

  const answerKeyVersions = useMemo(
    () => answerKeyRecords.map((record) => record.key_version),
    [answerKeyRecords],
  )

  const answerKeys = useMemo<AnswerKeyItem[]>(
    () => answerKeyRecords.flatMap((record) => record.answer_key),
    [answerKeyRecords],
  )

  const selectedExam = useMemo(
    () => exams.find((exam) => exam.exam_id === examId),
    [exams, examId],
  )

  const topicDefinitions = useMemo<ExamTopic[]>(() => {
    const topics = selectedExam?.topics ?? []
    if (topics.length === 0) return [{ topic_idx: 1, name: "General" }]

    return topics.map((name, index) => ({
      topic_idx: index + 1,
      name: name.trim() || `Topic ${index + 1}`,
    }))
  }, [selectedExam])

  const initialExamineeId = searchParams.get("examineeId") ?? undefined
  const initialAnswerKeyVersion = searchParams.get("keyVersion") ?? undefined

  function handleBack() {
    const nextParams = new URLSearchParams()
    if (examId) {
      nextParams.set("examId", examId)
    }
    const search = nextParams.toString()
    navigate(`/instructor/exams${search ? `?${search}` : ""}`)
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

    void createScoreResults({
      examId: selectedExam.exam_id || "",
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

  const displayExamineeId = initialExamineeId?.trim() || "—"
  const displayKeyVersion = initialAnswerKeyVersion || answerKeyVersions[0] || "—"

  return (
    <SidebarProvider>
      <TooltipProvider>
        <div className="flex min-h-screen w-full bg-background">
          <ScrollArea className="flex-1">
            <main className="p-0 max-w-none w-full">
              {isLoading ? (
                <div className="p-6 space-y-3">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-64" />
                </div>
              ) : !selectedExam ? (
                <div className="p-6">
                  <Card>
                    <CardContent className="p-6 space-y-3">
                      <p className="text-sm font-medium">Exam not found</p>
                      <p className="text-xs text-muted-foreground">
                        Return to the exams page and select a valid exam to start scanning.
                      </p>
                      <Button variant="outline" onClick={handleBack}>
                        Back to Exams
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="relative">
                  <ScannerPanel
                    examId={selectedExam.exam_id}
                    examTitle={selectedExam.exam_title}
                    answerKeyVersions={answerKeyVersions}
                    initialExamineeId={initialExamineeId}
                    initialAnswerKeyVersion={initialAnswerKeyVersion}
                    fullScreenCamera
                    onCapture={handleScanCapture}
                  />

                  <div className="absolute inset-x-0 top-0 p-4 pointer-events-none">
                    <div className="pointer-events-auto inline-flex items-center gap-3 rounded-full bg-black/60 px-3 py-2 text-white shadow-sm">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                        onClick={handleBack}
                      >
                        <ArrowLeft className="size-4" />
                      </Button>
                      <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-wide text-white/70">Scanner</span>
                        <span className="text-sm font-semibold">
                          {selectedExam.exam_title}
                        </span>
                        <span className="text-xs text-white/80">
                          ID {displayExamineeId} · Key {displayKeyVersion}
                        </span>
                      </div>
                      <ScanLine className="ml-2 size-4 text-white/80" />
                    </div>
                  </div>
                </div>
              )}
            </main>
          </ScrollArea>
        </div>
      </TooltipProvider>
    </SidebarProvider>
  )
}

export default InstructorExamScannerPage
