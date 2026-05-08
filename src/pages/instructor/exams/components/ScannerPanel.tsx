import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  FileImage,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Camera,
  CameraOff,
  Smartphone,
  RefreshCw,
  Circle,
} from "lucide-react"
import { supabase } from "@/lib/supabase/supabase"
import type { ScannedPaper } from "../types"

// ── Props ──────────────────────────────────────────────────────────────────────

interface ScannerPanelProps {
  examId?: string
  answerKey?: string[]
  answerKeyVersions?: string[]
  scannedPapers?: ScannedPaper[]
  examTitle?: string
  onCapture?: (
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
      answers?: Record<string, string> | string[]
      answerKeyVersion?: string
      examineeId?: string
      warnings?: string[]
      processingMs?: number | null
    },
  ) => void
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function detectMobile(): boolean {
  return (
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    window.matchMedia("(max-width: 768px) and (pointer: coarse)").matches
  )
}

function statusBadge(status: ScannedPaper["status"]) {
  switch (status) {
    case "Graded":
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 gap-1">
          <CheckCircle2 className="size-3" /> Graded
        </Badge>
      )
    case "Processing":
      return (
        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 gap-1">
          <Loader2 className="size-3 animate-spin" /> Processing
        </Badge>
      )
    case "Error":
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 gap-1">
          <AlertCircle className="size-3" /> Error
        </Badge>
      )
  }
}

function nowLabel(): string {
  return new Date().toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

// ── Component ──────────────────────────────────────────────────────────────────

export function ScannerPanel({
  scannedPapers = [],
  examTitle = "this exam",
  answerKeyVersions = [],
  onCapture,
}: ScannerPanelProps = {}) {
  const [isMobile] = useState<boolean>(detectMobile)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [localPapers, setLocalPapers] = useState<ScannedPaper[]>([])
  const [captureFlash, setCaptureFlash] = useState(false)
  const [lastAnswers, setLastAnswers] = useState<Record<string, string> | null>(null)
  const [lastWarnings, setLastWarnings] = useState<string[]>([])
  const [processingMs, setProcessingMs] = useState<number | null>(null)
  const [lastGrading, setLastGrading] = useState<{
    totalItems?: number
    totalScore?: number
    scorePercent?: number
    passed?: boolean
  } | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [examineeId, setExamineeId] = useState("")
  const [isCheckingExaminee, setIsCheckingExaminee] = useState(false)
  const [examineeNotFound, setExamineeNotFound] = useState(false)
  const [examineeLookupError, setExamineeLookupError] = useState<string | null>(null)
  const keyVersionOptions = useMemo(
    () => (answerKeyVersions.length > 0 ? answerKeyVersions : ["A", "B"]),
    [answerKeyVersions],
  )
  const [selectedKeyVersion, setSelectedKeyVersion] = useState(
    keyVersionOptions[0] ?? "",
  )
  const OMR_API_URL = import.meta.env.VITE_OMR_API_URL || "http://localhost:8000"

  const allPapers = useMemo(
    () => [...localPapers, ...scannedPapers],
    [localPapers, scannedPapers],
  )
  const isDuplicateExaminee = useMemo(() => {
    const trimmed = examineeId.trim().toLowerCase()
    if (!trimmed) return false
    return allPapers.some(
      (paper) => paper.studentId.trim().toLowerCase() === trimmed,
    )
  }, [allPapers, examineeId])
  const isCaptureDisabled = useMemo(() => {
    return !examineeId.trim() || isDuplicateExaminee
  }, [examineeId, isDuplicateExaminee])

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const nextIdRef = useRef(1000)

  // ── Camera lifecycle ──
  const startCamera = useCallback(async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraActive(true)
    } catch {
      setCameraError("Could not access the camera. Please allow camera permission and try again.")
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraActive(false)
  }, [])

  // Stop camera when component unmounts
  useEffect(() => () => { stopCamera() }, [stopCamera])

  useEffect(() => {
    if (keyVersionOptions.length === 0) return
    if (!keyVersionOptions.includes(selectedKeyVersion)) {
      setSelectedKeyVersion(keyVersionOptions[0])
    }
  }, [keyVersionOptions, selectedKeyVersion])

  useEffect(() => {
    const trimmed = examineeId.trim()
    if (!trimmed) {
      setIsCheckingExaminee(false)
      setExamineeNotFound(false)
      setExamineeLookupError(null)
      return
    }

    let active = true
    const timer = window.setTimeout(async () => {
      setIsCheckingExaminee(true)
      setExamineeNotFound(false)
      setExamineeLookupError(null)

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("examinee_id_number", trimmed)
          .eq("role", "Student")
          .maybeSingle()

        if (!active) return
        if (error) {
          setExamineeLookupError("Could not verify examinee ID right now.")
          return
        }

        setExamineeNotFound(!data)
      } catch (err) {
        if (!active) return
        setExamineeLookupError("Could not verify examinee ID right now.")
        console.error("Examinee lookup failed:", err)
      } finally {
        if (active) setIsCheckingExaminee(false)
      }
    }, 450)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [examineeId])

  // ── Capture photo ──
  async function capturePhoto() {
    if (!videoRef.current || !canvasRef.current || isCapturing) return

    const trimmedExamineeId = examineeId.trim()
    if (!trimmedExamineeId) {
      setScanError("Enter the examinee ID number before scanning.")
      return
    }
    if (!selectedKeyVersion) {
      setScanError("Select an answer key version before scanning.")
      return
    }

    setIsCapturing(true)
    setCaptureFlash(true)
    setScanError(null)
    setTimeout(() => setCaptureFlash(false), 150)

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext("2d")?.drawImage(video, 0, 0)

    const newId = nextIdRef.current++
    const processingPaper: ScannedPaper = {
      id: newId,
      studentName: `Examinee ${trimmedExamineeId}`,
      studentId: trimmedExamineeId,
      scannedAt: nowLabel(),
      status: "Processing",
    }

    setLocalPapers((prev) => [processingPaper, ...prev])

    try {
      const canvasBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
          else reject(new Error("Failed to capture image from camera"))
        }, "image/jpeg", 0.92)
      })

      const formData = new FormData()
      formData.append("file", canvasBlob, `scan-${Date.now()}.jpg`)
      formData.append("examinee_id", trimmedExamineeId)
      formData.append("answer_key_version", selectedKeyVersion)

      const response = await fetch(`${OMR_API_URL}/scan`, {
        method: "POST",
        body: formData,
      })

      const payload = await response.json().catch(() => ({}))

      console.log("Scan response:", { status: response.status, payload })
      if (!response.ok) {
        throw new Error(payload?.detail || "Scan request failed")
      }

      setLastAnswers(payload?.answers || null)
      setLastWarnings(Array.isArray(payload?.warnings) ? payload.warnings : [])
      setProcessingMs(typeof payload?.processing_ms === "number" ? payload.processing_ms : null)
      setLastGrading(payload?.grading ?? null)

      const gradedPaper: ScannedPaper = {
        ...processingPaper,
        studentName: `Examinee ${trimmedExamineeId}`,
        studentId: trimmedExamineeId,
        status: "Graded",
      }

      setLocalPapers((prev) => prev.map((p) => (p.id === newId ? gradedPaper : p)))
      onCapture?.(gradedPaper, {
        resultId: String(payload?.result_id ?? payload?.resultId ?? newId),
        studentId: payload?.student_id ?? payload?.studentId ?? trimmedExamineeId,
        studentName: payload?.student_name ?? payload?.studentName ?? gradedPaper.studentName,
        createdAt: payload?.created_at ?? payload?.createdAt,
        grading: payload?.grading,
        answers: payload?.answers,
        answerKeyVersion: selectedKeyVersion,
        examineeId: trimmedExamineeId,
        warnings: Array.isArray(payload?.warnings) ? payload.warnings : [],
        processingMs: typeof payload?.processing_ms === "number" ? payload.processing_ms : null,
      })
    } catch (error) {
      const errorPaper: ScannedPaper = {
        ...processingPaper,
        studentName: "Scan failed",
        studentId: "—",
        status: "Error",
      }
      setLocalPapers((prev) => prev.map((p) => (p.id === newId ? errorPaper : p)))
      setScanError(error instanceof Error ? error.message : "Scan failed")
      console.error("Scanner capture failed:", error)
    } finally {
      setIsCapturing(false)
    }
  }

  // ── Merged papers list ──
  const gradedCount = allPapers.filter((p) => p.status === "Graded").length

  return (
    <div className="space-y-5">
      {/* ── Camera section ── */}
      {!isMobile ? (
        /* Desktop – mobile-only notice */
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-14 px-6 text-center space-y-3">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <Smartphone className="size-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-sm">Mobile Device Required</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Real-time answer sheet scanning is only available on a mobile phone.
                Open this page on your phone to use the camera scanner.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Mobile – camera viewfinder */
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {/* Viewfinder */}
            <div className="relative w-full bg-black" style={{ aspectRatio: "4/3" }}>
              <video
                ref={videoRef}
                className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
                playsInline
                muted
              />
              {/* Hidden canvas for capture */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Scanning overlay grid */}
              {cameraActive && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Corner brackets */}
                  <div className="absolute inset-8 border-2 border-teal-400/60 rounded-sm" />
                  <div className="absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 border-teal-400 rounded-tl" />
                  <div className="absolute top-8 right-8 w-6 h-6 border-t-2 border-r-2 border-teal-400 rounded-tr" />
                  <div className="absolute bottom-8 left-8 w-6 h-6 border-b-2 border-l-2 border-teal-400 rounded-bl" />
                  <div className="absolute bottom-8 right-8 w-6 h-6 border-b-2 border-r-2 border-teal-400 rounded-br" />
                  {/* Scan line */}
                  <div className="absolute inset-x-8 top-1/2 h-px bg-teal-400/50" />
                </div>
              )}

              {/* Capture flash */}
              {captureFlash && (
                <div className="absolute inset-0 bg-white/70 pointer-events-none" />
              )}

              {/* Idle / error state */}
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                  {cameraError ? (
                    <>
                      <CameraOff className="size-8 text-red-400" />
                      <p className="text-xs text-red-400">{cameraError}</p>
                      <Button size="sm" variant="outline" onClick={startCamera} className="gap-1.5">
                        <RefreshCw className="size-3.5" /> Retry
                      </Button>
                    </>
                  ) : (
                    <>
                      <Camera className="size-8 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Camera is off</p>
                    </>
                  )}
                </div>
              )}

              {/* Processing overlay */}
              {isCapturing && (
                <div className="absolute bottom-4 inset-x-0 flex justify-center">
                  <Badge className="bg-teal-700 text-white gap-1.5 px-3 py-1 text-xs">
                    <Loader2 className="size-3 animate-spin" /> Processing answer sheet…
                  </Badge>
                </div>
              )}
            </div>

            {/* Camera controls */}
            <div className="flex items-center justify-between px-5 py-4 bg-background">
              {/* Toggle camera */}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={cameraActive ? stopCamera : startCamera}
              >
                {cameraActive ? (
                  <><CameraOff className="size-4" /> Stop</>
                ) : (
                  <><Camera className="size-4" /> Start Camera</>
                )}
              </Button>

              {/* Capture button */}
              <Button
                onClick={capturePhoto}
                disabled={!cameraActive || isCapturing || isCaptureDisabled}
                className="flex size-14 items-center justify-center rounded-full border-4 border-teal-700 bg-background disabled:opacity-40 disabled:cursor-not-allowed transition-opacity active:scale-95"
                title="Capture answer sheet"
              >
                <Circle className="size-8 fill-teal-700 text-teal-700" />
              </Button>

              {/* Spacer to balance layout */}
              <div className="w-20" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Examinee details ── */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-medium">Examinee Details</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="examineeId">Examinee ID Number</Label>
              <Input
                id="examineeId"
                placeholder="e.g., 000000"
                value={examineeId}
                onChange={(e) => {
                  setExamineeId(e.target.value)
                  if (scanError) setScanError(null)
                  if (examineeNotFound) setExamineeNotFound(false)
                  if (examineeLookupError) setExamineeLookupError(null)
                }}
              />
              {isCheckingExaminee && (
                <p className="text-xs text-muted-foreground">
                  Checking examinee ID...
                </p>
              )}
              {isDuplicateExaminee && (
                <p className="text-xs text-amber-600">
                  This examinee ID was already scanned.
                </p>
              )}
              {examineeNotFound && (
                <p className="text-xs text-red-500">
                  No student found for this examinee ID.
                </p>
              )}
              {examineeLookupError && (
                <p className="text-xs text-red-500">{examineeLookupError}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="answerKeyVersion">Answer Key</Label>
              <Select
                value={selectedKeyVersion}
                onValueChange={(val) => {
                  setSelectedKeyVersion(val)
                  if (scanError) setScanError(null)
                }}
              >
                <SelectTrigger id="answerKeyVersion">
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
        </CardContent>
      </Card>

      {/* ── Latest answers ── */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Latest Answers</p>
            {processingMs !== null && (
              <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                {processingMs} ms
              </Badge>
            )}
          </div>
          {lastGrading && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {typeof lastGrading.scorePercent === "number" && (
                <Badge className="bg-teal-700 text-white">
                  {Math.round(lastGrading.scorePercent)}%
                </Badge>
              )}
              {typeof lastGrading.totalScore === "number" &&
                typeof lastGrading.totalItems === "number" && (
                  <span className="text-xs text-muted-foreground">
                    {lastGrading.totalScore}/{lastGrading.totalItems}
                  </span>
                )}
              {typeof lastGrading.passed === "boolean" && (
                <Badge
                  className={
                    lastGrading.passed
                      ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                      : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                  }
                >
                  {lastGrading.passed ? "Passed" : "Failed"}
                </Badge>
              )}
            </div>
          )}
          {scanError && <p className="text-xs text-red-500">{scanError}</p>}
          {lastWarnings.length > 0 && (
            <p className="text-xs text-amber-600">Warnings: {lastWarnings.join(", ")}</p>
          )}
          {!lastAnswers ? (
            <p className="text-xs text-muted-foreground">Capture a scan to view answers.</p>
          ) : (
            <div className="max-h-64 overflow-auto rounded-md border">
              <table className="w-full text-xs">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="text-left font-medium px-3 py-2">Question</th>
                    <th className="text-left font-medium px-3 py-2">Answer</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(lastAnswers)
                    .sort((a, b) => Number(a[0]) - Number(b[0]))
                    .map(([q, ans]) => (
                      <tr key={q} className="border-t">
                        <td className="px-3 py-1.5">Q{q}</td>
                        <td className="px-3 py-1.5 font-medium">{ans}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Summary bar ── */}
      <div>
        <p className="text-sm font-medium">Scanned Papers</p>
        <p className="text-xs text-muted-foreground">
          {gradedCount} of {allPapers.length} papers graded for {examTitle}
        </p>
      </div>

      {/* ── Papers list ── */}
      <Card>
        <CardContent className="p-0">
          {allPapers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FileImage className="size-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No papers scanned yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Use the camera to scan answer sheets and begin automated grading
              </p>
            </div>
          ) : (
            allPapers.map((paper, idx) => (
              <div key={paper.id}>
                <div className="flex items-center justify-between px-4 py-3 gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted shrink-0">
                      <FileImage className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{paper.studentName}</p>
                      <p className="text-xs text-muted-foreground">
                        {paper.studentId} · {paper.scannedAt}
                      </p>
                    </div>
                  </div>
                  {statusBadge(paper.status)}
                </div>
                {idx < allPapers.length - 1 && <Separator />}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
