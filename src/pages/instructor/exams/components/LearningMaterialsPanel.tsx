import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, Link2, Loader2, Trash2, Upload } from "lucide-react"
import {
  deleteExamMaterial,
  fetchExamMaterials,
  uploadExamMaterial,
  type ExamMaterial,
} from "@/lib/supabase/exam/material-service"
import { toast } from "sonner"

type LearningMaterialsPanelProps = {
  examId: number
  instructorId?: string
}

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024
const ALLOWED_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "txt",
  "csv",
  "png",
  "jpg",
  "jpeg",
  "webp",
]
const ACCEPT_ATTRIBUTE = ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(",")

const validateMaterialFile = (file: File): string | null => {
  const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() || "" : ""
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return `Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File is too large. Maximum size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.`
  }

  return null
}

const formatDateTime = (value?: string) => {
  if (!value) return "Unknown date"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Unknown date"
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

const formatFileSize = (bytes?: number) => {
  if (!bytes || bytes <= 0) return "Unknown size"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round((bytes / 1024) * 10) / 10} KB`
  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`
}

export const LearningMaterialsPanel = ({ examId, instructorId }: LearningMaterialsPanelProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [fileInputKey, setFileInputKey] = useState(0)
  const queryClient = useQueryClient()

  const {
    data: materials = [],
    isLoading,
  } = useQuery({
    queryKey: ["examMaterials", examId],
    queryFn: () => fetchExamMaterials(examId),
  })

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error("Please choose a file")
      if (!instructorId) throw new Error("Instructor not authenticated")
      if (validationError) throw new Error(validationError)
      return uploadExamMaterial(examId, instructorId, selectedFile)
    },
    onSuccess: () => {
      setSelectedFile(null)
      setValidationError(null)
      setFileInputKey((prev) => prev + 1)
      queryClient.invalidateQueries({ queryKey: ["examMaterials", examId] })
      toast.success("Learning material uploaded")
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (material: ExamMaterial) => {
      if (!instructorId) throw new Error("Instructor not authenticated")
      await deleteExamMaterial(examId, instructorId, material.storagePath)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["examMaterials", examId] })
      toast.success("Material removed")
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Delete failed")
    },
  })

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Learning Materials</h3>
        <p className="text-xs text-muted-foreground">
          Upload review files for students (max 15 MB, allowed: PDF, DOCX, PPTX, XLSX, TXT, CSV, PNG, JPG, WEBP).
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Input
          key={fileInputKey}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          onChange={(event) => {
            const file = event.target.files?.[0] || null
            if (!file) {
              setSelectedFile(null)
              setValidationError(null)
              return
            }

            const validationMessage = validateMaterialFile(file)
            if (validationMessage) {
              setSelectedFile(null)
              setValidationError(validationMessage)
              setFileInputKey((prev) => prev + 1)
              return
            }

            setSelectedFile(file)
            setValidationError(null)
          }}
        />
        <Button
          className="gap-1.5"
          onClick={() => uploadMutation.mutate()}
          disabled={!selectedFile || !!validationError || uploadMutation.isPending || !instructorId}
        >
          {uploadMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          Upload
        </Button>
      </div>

      {selectedFile && !validationError && (
        <p className="text-xs text-muted-foreground">
          Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
        </p>
      )}

      {validationError && (
        <p className="text-xs text-red-600">{validationError}</p>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(2)].map((_, idx) => (
            <Skeleton key={idx} className="h-14" />
          ))}
        </div>
      ) : materials.length === 0 ? (
        <div className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
          No learning materials uploaded yet.
        </div>
      ) : (
        <div className="space-y-2">
          {materials.map((material) => (
            <div
              key={material.id}
              className="flex flex-col gap-2 rounded-md border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{material.name}</p>
                <p className="text-xs text-muted-foreground">
                  {material.instructorName || "Instructor"} · {formatDateTime(material.uploadedAt)} · {formatFileSize(material.sizeBytes)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1.5" asChild>
                  <a href={material.url} target="_blank" rel="noreferrer">
                    <Link2 className="size-3.5" />
                    Open
                  </a>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    const confirmed = window.confirm(`Delete material "${material.name}"?`)
                    if (!confirmed) return
                    deleteMutation.mutate(material)
                  }}
                >
                  {deleteMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        <FileText className="size-3.5" />
        Students can access these materials in their exam details page for review.
      </div>

      {!instructorId && (
        <Badge variant="secondary" className="w-fit">
          Sign in as instructor to manage materials.
        </Badge>
      )}
    </div>
  )
}
