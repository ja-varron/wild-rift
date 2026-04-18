export type ExamMaterial = {
  id: string
  storagePath: string
  name: string
  url: string
  uploadedAt?: string
  sizeBytes?: number
  instructorName?: string
}

type MaterialResponse = {
  materials?: Array<{
    id?: string
    storage_path?: string
    name?: string
    url?: string
    uploaded_at?: string | number
    size_bytes?: number
    instructor_name?: string
  }>
  error?: string
}

type UploadResponse = {
  success?: boolean
  material?: {
    id?: string
    storage_path?: string
    name?: string
    url?: string
    uploaded_at?: string | number
    size_bytes?: number
    instructor_name?: string
  }
  error?: string
}

const getBackendUrl = () => import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"

const toIsoString = (value: string | number | undefined): string | undefined => {
  if (value === undefined || value === null) return undefined
  if (typeof value === "number") {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString()
}

const normalizeMaterial = (row: {
  id?: string
  storage_path?: string
  name?: string
  url?: string
  uploaded_at?: string | number
  size_bytes?: number
  instructor_name?: string
}): ExamMaterial => {
  const storagePath = String(row.storage_path || row.id || "")
  return {
    id: String(row.id || storagePath),
    storagePath,
    name: String(row.name || "Material"),
    url: String(row.url || ""),
    uploadedAt: toIsoString(row.uploaded_at),
    sizeBytes: typeof row.size_bytes === "number" ? row.size_bytes : undefined,
    instructorName: row.instructor_name ? String(row.instructor_name) : undefined,
  }
}

export const fetchExamMaterials = async (examId: number): Promise<ExamMaterial[]> => {
  const response = await fetch(`${getBackendUrl()}/api/exams/${examId}/materials`)
  const payload = (await response.json()) as MaterialResponse

  if (!response.ok) {
    if (response.status === 404) {
      return []
    }
    throw new Error(payload?.error || "Failed to fetch learning materials")
  }

  const rows = Array.isArray(payload?.materials) ? payload.materials : []
  return rows.map(normalizeMaterial)
}

export const uploadExamMaterial = async (
  examId: number,
  instructorId: string,
  file: File,
): Promise<ExamMaterial> => {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("instructorId", instructorId)

  const response = await fetch(`${getBackendUrl()}/api/exams/${examId}/materials`, {
    method: "POST",
    body: formData,
  })

  const payload = (await response.json()) as UploadResponse
  if (!response.ok || !payload?.material) {
    throw new Error(payload?.error || "Failed to upload learning material")
  }

  return normalizeMaterial(payload.material)
}

export const deleteExamMaterial = async (
  examId: number,
  instructorId: string,
  storagePath: string,
): Promise<void> => {
  const query = new URLSearchParams({
    instructorId,
    storagePath,
  })
  const response = await fetch(
    `${getBackendUrl()}/api/exams/${examId}/materials/delete?${query.toString()}`,
    {
      method: "POST",
    },
  )

  let payload: { error?: string } = {}
  try {
    payload = (await response.json()) as { error?: string }
  } catch {
    payload = {}
  }

  if (!response.ok) {
    throw new Error(payload?.error || "Failed to delete learning material")
  }
}
