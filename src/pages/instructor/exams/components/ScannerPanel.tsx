import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import type { ScannedPaper } from "../types"

// ── Props ──────────────────────────────────────────────────────────────────────

interface ScannerPanelProps {
  scannedPapers: ScannedPaper[]
  examTitle: string
  onCapture?: (paper: ScannedPaper) => void
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
  scannedPapers,
  examTitle,
  onCapture,
}: ScannerPanelProps) {
  const [isMobile] = useState<boolean>(detectMobile)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [localPapers, setLocalPapers] = useState<ScannedPaper[]>([])
  const [captureFlash, setCaptureFlash] = useState(false)

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

  // ── Capture photo ──
  async function capturePhoto() {
    if (!videoRef.current || !canvasRef.current || isCapturing) return

    setIsCapturing(true)
    setCaptureFlash(true)
    setTimeout(() => setCaptureFlash(false), 150)

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext("2d")?.drawImage(video, 0, 0)

    // Simulate OMR processing delay
    const newId = nextIdRef.current++
    const processingPaper: ScannedPaper = {
      id: newId,
      studentName: "Processing...",
      studentId: "—",
      scannedAt: nowLabel(),
      status: "Processing",
    }

    setLocalPapers((prev) => [processingPaper, ...prev])

    await new Promise((r) => setTimeout(r, 2200))

    // 90 % chance graded, 10 % error (simulated OMR result)
    const success = Math.random() > 0.1
    const gradedPaper: ScannedPaper = {
      ...processingPaper,
      studentName: success ? `Student #${newId - 999}` : processingPaper.studentName,
      studentId: success ? `ID-${String(newId).padStart(5, "0")}` : "—",
      status: success ? "Graded" : "Error",
    }

    setLocalPapers((prev) =>
      prev.map((p) => (p.id === newId ? gradedPaper : p))
    )
    onCapture?.(gradedPaper)
    setIsCapturing(false)
  }

  // ── Merged papers list ──
  const allPapers = [...localPapers, ...scannedPapers]
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
              <button
                onClick={capturePhoto}
                disabled={!cameraActive || isCapturing}
                className="flex size-14 items-center justify-center rounded-full border-4 border-teal-700 bg-background disabled:opacity-40 disabled:cursor-not-allowed transition-opacity active:scale-95"
                title="Capture answer sheet"
              >
                <Circle className="size-8 fill-teal-700 text-teal-700" />
              </button>

              {/* Spacer to balance layout */}
              <div className="w-20" />
            </div>
          </CardContent>
        </Card>
      )}

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
