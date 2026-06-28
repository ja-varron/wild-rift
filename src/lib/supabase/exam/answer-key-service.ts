import type { AnswerKeyItem } from "@/pages/instructor/exams/types"
import { supabase } from "../supabase"

type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

type AnswerKeyRow = {
  key_id: string
  exam_id: string
  version: number
  answer_key: unknown
  created_at: string
  updated_at: string
}

export type AnswerKeyVersionRecord = {
  key_id: string
  exam_id: string
  version: number
  key_version: string
  answer_key: AnswerKeyItem[]
  created_at: string
  updated_at: string
}

const ANSWER_OPTIONS = new Set<AnswerKeyItem["correct_answer"]>([
  "A",
  "B",
  "C",
  "D",
  "E",
])

function versionNumberToLabel(version: number): string {
  if (version >= 1 && version <= 26) {
    return String.fromCharCode(64 + version)
  }
  return String(version)
}

function versionLabelToNumber(version: string | number): number {
  if (typeof version === "number") {
    const parsed = Math.trunc(version)
    if (parsed > 0) return parsed
    throw new Error("Version must be greater than 0")
  }

  const trimmed = version.trim().toUpperCase()
  if (!trimmed) throw new Error("Version is required")

  if (trimmed.length === 1 && trimmed >= "A" && trimmed <= "Z") {
    return trimmed.charCodeAt(0) - 64
  }

  const parsed = Number.parseInt(trimmed, 10)
  if (!Number.isNaN(parsed) && parsed > 0) {
    return parsed
  }

  throw new Error(`Invalid version value: ${version}`)
}

function normalizeAnswer(
  value: unknown,
): AnswerKeyItem["correct_answer"] {
  const upper = typeof value === "string" ? value.toUpperCase() : ""
  if (ANSWER_OPTIONS.has(upper as AnswerKeyItem["correct_answer"])) {
    return upper as AnswerKeyItem["correct_answer"]
  }
  return "A"
}

function normalizeAnswerKeyItems(
  keyVersion: string,
  items: Partial<AnswerKeyItem>[],
): AnswerKeyItem[] {
  return items
    .map((item, index) => {
      const questionNumber = Number(item.question_number)
      const normalizedQuestionNumber =
        Number.isFinite(questionNumber) && questionNumber > 0
          ? Math.trunc(questionNumber)
          : index + 1

      const points = Number(item.points)
      const normalizedPoints =
        Number.isFinite(points) && points >= 0 ? points : 1

      return {
        key_version: keyVersion,
        question_number: normalizedQuestionNumber,
        correct_answer: normalizeAnswer(item.correct_answer),
        points: normalizedPoints,
        topic: typeof item.topic === "string" ? item.topic : "",
      }
    })
    .sort((a, b) => a.question_number - b.question_number)
}

function mapRowToVersionRecord(row: AnswerKeyRow): AnswerKeyVersionRecord {
  const keyVersion = versionNumberToLabel(row.version)
  const rawItems = Array.isArray(row.answer_key)
    ? (row.answer_key as Partial<AnswerKeyItem>[])
    : []

  return {
    key_id: row.key_id,
    exam_id: row.exam_id,
    version: row.version,
    key_version: keyVersion,
    answer_key: normalizeAnswerKeyItems(keyVersion, rawItems),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function createAnswerKeyVersion(
  examId: string,
  keyVersion: string | number,
  items: AnswerKeyItem[],
): Promise<ServiceResult<AnswerKeyVersionRecord>> {
  try {
    const version = versionLabelToNumber(keyVersion)
    const label = versionNumberToLabel(version)
    const payload = normalizeAnswerKeyItems(label, items)

    const { data, error } = await supabase
      .from("answer_keys")
      .insert({
        exam_id: examId,
        version,
        answer_key: payload,
      })
      .select("key_id, exam_id, version, answer_key, created_at, updated_at")
      .single()

    if (error) throw error
    return { success: true, data: mapRowToVersionRecord(data as AnswerKeyRow) }
  } catch (error) {
    console.error("Error creating answer key version:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create answer key version",
    }
  }
}

export async function getAnswerKeyVersionsByExam(
  examId: string,
): Promise<ServiceResult<AnswerKeyVersionRecord[]>> {
  try {
    const { data, error } = await supabase
      .from("answer_keys")
      .select("key_id, exam_id, version, answer_key, created_at, updated_at")
      .eq("exam_id", examId)
      .order("version", { ascending: true })

    if (error) throw error

    const records = (data ?? []).map((row) =>
      mapRowToVersionRecord(row as AnswerKeyRow),
    )

    return { success: true, data: records }
  } catch (error) {
    console.error("Error fetching answer key versions:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch answer key versions",
    }
  }
}

export async function getAnswerKeyVersion(
  examId: string,
  keyVersion: string | number,
): Promise<ServiceResult<AnswerKeyVersionRecord | null>> {
  try {
    const version = versionLabelToNumber(keyVersion)

    const { data, error } = await supabase
      .from("answer_keys")
      .select("key_id, exam_id, version, answer_key, created_at, updated_at")
      .eq("exam_id", examId)
      .eq("version", version)
      .maybeSingle()

    if (error) throw error
    if (!data) return { success: true, data: null }

    return {
      success: true,
      data: mapRowToVersionRecord(data as AnswerKeyRow),
    }
  } catch (error) {
    console.error("Error fetching answer key version:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch answer key version",
    }
  }
}

export async function updateAnswerKeyVersion(
  examId: string,
  keyVersion: string | number,
  items: AnswerKeyItem[],
): Promise<ServiceResult<AnswerKeyVersionRecord>> {
  try {
    const version = versionLabelToNumber(keyVersion)
    const label = versionNumberToLabel(version)
    const payload = normalizeAnswerKeyItems(label, items)

    const { data, error } = await supabase
      .from("answer_keys")
      .update({
        answer_key: payload,
        updated_at: new Date().toISOString(),
      })
      .eq("exam_id", examId)
      .eq("version", version)
      .select("key_id, exam_id, version, answer_key, created_at, updated_at")
      .maybeSingle()

    if (error) throw error
    if (!data) {
      return {
        success: false,
        error: `Answer key version ${label} does not exist for this exam`,
      }
    }

    return {
      success: true,
      data: mapRowToVersionRecord(data as AnswerKeyRow),
    }
  } catch (error) {
    console.error("Error updating answer key version:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update answer key version",
    }
  }
}

export async function deleteAnswerKeyVersion(
  examId: string,
  keyVersion: string | number,
): Promise<ServiceResult<null>> {
  try {
    const version = versionLabelToNumber(keyVersion)

    const { error } = await supabase
      .from("answer_keys")
      .delete()
      .eq("exam_id", examId)
      .eq("version", version)

    if (error) throw error
    return { success: true, data: null }
  } catch (error) {
    console.error("Error deleting answer key version:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete answer key version",
    }
  }
}

export async function saveAnswerKeysFromEditor(
  examId: string,
  keys: AnswerKeyItem[],
): Promise<ServiceResult<AnswerKeyVersionRecord[]>> {
  try {
    const groupedByVersion = new Map<number, AnswerKeyItem[]>()

    for (const key of keys) {
      const version = versionLabelToNumber(key.key_version || "A")
      const grouped = groupedByVersion.get(version) ?? []
      grouped.push(key)
      groupedByVersion.set(version, grouped)
    }

    if (groupedByVersion.size === 0) {
      return { success: true, data: [] }
    }

    const { data: existing, error: existingError } = await supabase
      .from("answer_keys")
      .select("version")
      .eq("exam_id", examId)

    if (existingError) throw existingError

    const existingVersions = new Set((existing ?? []).map((row) => row.version))
    const saved: AnswerKeyVersionRecord[] = []

    for (const [version, versionItems] of groupedByVersion) {
      if (existingVersions.has(version)) {
        const updateResult = await updateAnswerKeyVersion(examId, version, versionItems)
        if (!updateResult.success) return updateResult
        saved.push(updateResult.data)
      } else {
        const createResult = await createAnswerKeyVersion(examId, version, versionItems)
        if (!createResult.success) return createResult
        saved.push(createResult.data)
      }
    }

    saved.sort((a, b) => a.version - b.version)
    return { success: true, data: saved }
  } catch (error) {
    console.error("Error saving editor answer keys:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save answer keys",
    }
  }
}

export async function getAnswerKeysForEditor(
  examId: string,
): Promise<ServiceResult<AnswerKeyItem[]>> {
  const result = await getAnswerKeyVersionsByExam(examId)
  if (!result.success) return result

  const flattened = result.data.flatMap((record) =>
    record.answer_key.map((item) => ({
      ...item,
      key_version: record.key_version,
    })),
  )

  return { success: true, data: flattened }
}
