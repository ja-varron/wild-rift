import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { KeyRound, Plus, X } from "lucide-react"
import type { ExamTopic, AnswerKeyItem } from "../types"

// ── Props ──────────────────────────────────────────────────────────────────────

interface AnswerKeyEditorProps {
  topics: ExamTopic[]
  answerKeys: AnswerKeyItem[]
  totalItems: number
  keyVersions?: string[]
  onSave?: (keys: AnswerKeyItem[]) => void
  onCancel?: () => void
}

// ── Constants ──────────────────────────────────────────────────────────────────

const ANSWER_OPTIONS: ("A" | "B" | "C" | "D" | "E")[] = ["A", "B", "C", "D", "E"]
const DEFAULT_VERSIONS = ["A", "B", "C", "D"]
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

// ── Component ──────────────────────────────────────────────────────────────────

export function AnswerKeyEditor({
  topics,
  answerKeys,
  totalItems,
  keyVersions = DEFAULT_VERSIONS,
  onSave,
  onCancel,
}: AnswerKeyEditorProps) {
  const [versions, setVersions] = useState<string[]>(keyVersions)
  const [activeVersion, setActiveVersion] = useState(keyVersions[0] ?? "A")
  const [draft, setDraft] = useState<AnswerKeyItem[]>(answerKeys)

  useEffect(() => {
    setDraft(answerKeys)
  }, [answerKeys])

  // ── Version management ─────────────────────────────────────────────────────

  function addVersion() {
    const next = ALPHABET.split("").find((letter) => !versions.includes(letter))
    if (!next) return
    setVersions((prev) => [...prev, next])
    setActiveVersion(next)
  }

  function removeVersion(version: string) {
    if (versions.length <= 1) return
    setVersions((prev) => prev.filter((v) => v !== version))
    setDraft((prev) => prev.filter((k) => k.keyVersion !== version))
    if (activeVersion === version) {
      setActiveVersion((prev) => {
        const remaining = versions.filter((v) => v !== version)
        const idx = versions.indexOf(prev)
        return remaining[Math.max(0, idx - 1)] ?? remaining[0]
      })
    }
  }

  // Build the complete list of rows for the active version,
  // filling in defaults for any question not yet in the draft.
  const rows: AnswerKeyItem[] = Array.from({ length: totalItems }, (_, i) => {
    const qn = i + 1
    return (
      draft.find(
        (k) => k.questionNumber === qn && k.keyVersion === activeVersion,
      ) ?? {
        questionNumber: qn,
        topicId: topics[0]?.id ?? 0,
        correctAnswer: undefined as unknown as "A",
        points: 1,
        keyVersion: activeVersion,
      }
    )
  })

  function updateRow(qn: number, patch: Partial<AnswerKeyItem>) {
    setDraft((prev) => {
      const exists = prev.find(
        (k) => k.questionNumber === qn && k.keyVersion === activeVersion,
      )
      if (exists) {
        return prev.map((k) =>
          k.questionNumber === qn && k.keyVersion === activeVersion
            ? { ...k, ...patch }
            : k,
        )
      }
      return [
        ...prev,
        {
          questionNumber: qn,
          topicId: topics[0]?.id ?? 0,
          correctAnswer: "A" as const,
          points: 1,
          keyVersion: activeVersion,
          ...patch,
        },
      ]
    })
  }

  return (
    <div className="space-y-4">
      {/* Version switcher */}
      <div className="flex items-center gap-2 flex-wrap">
        <KeyRound className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          Key Version:
        </span>
        <div className="flex gap-1 flex-wrap">
          {versions.map((v) => (
            <div
              key={v}
              className={`flex items-center rounded text-xs font-semibold transition-colors ${
                activeVersion === v
                  ? "bg-teal-700 text-white"
                  : "border border-input bg-background text-foreground"
              }`}
            >
              <button
                onClick={() => setActiveVersion(v)}
                className="h-7 px-2.5 cursor-pointer"
              >
                {v}
              </button>
              {versions.length > 1 && (
                <button
                  onClick={() => removeVersion(v)}
                  className={`h-7 pr-1.5 flex items-center cursor-pointer transition-opacity opacity-60 hover:opacity-100`}
                  title={`Remove key ${v}`}
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          ))}

          {/* Add version button */}
          {versions.length < ALPHABET.length && (
            <button
              onClick={addVersion}
              className="flex size-7 items-center justify-center rounded border border-dashed border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title="Add key version"
            >
              <Plus className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Editor card */}
      <Card className="overflow-hidden">
        {/* Card title */}
        <CardContent className="px-4 py-3 text-center">
          <h3 className="text-base font-semibold">
            Key Version: {activeVersion}
          </h3>
        </CardContent>
        <Separator />

        {totalItems === 0 ? (
          /* Empty state */
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <KeyRound className="size-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">No questions configured</p>
            <p className="text-xs text-muted-foreground mt-1">
              Set the total number of items when creating the exam.
            </p>
          </CardContent>
        ) : (
          /* Question rows */
          <div>
            {rows.map((row, idx) => (
              <div key={`${activeVersion}-${row.questionNumber}`}>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3">
                  {/* Question number */}
                  <span className="w-5 shrink-0 text-sm font-semibold">
                    {row.questionNumber}.
                  </span>

                  {/* Correct Answer */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                      Correct Answer:
                    </span>
                    <div className="flex gap-1.5">
                      {ANSWER_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          onClick={() =>
                            updateRow(row.questionNumber, { correctAnswer: opt })
                          }
                          className={`flex size-7 items-center justify-center rounded-full border text-xs font-semibold transition-colors cursor-pointer ${
                            row.correctAnswer === opt
                              ? "border-teal-700 bg-teal-700 text-white"
                              : "border-border bg-background text-foreground hover:bg-muted"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Points */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Points
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step={0.5}
                      value={row.points}
                      onChange={(e) =>
                        updateRow(row.questionNumber, {
                          points: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="h-8 w-16 text-center text-sm"
                    />
                  </div>

                  {/* Topic / Tag */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                      Topic/Tag
                    </span>
                    <Select
                      value={row.topicId ? String(row.topicId) : ""}
                      onValueChange={(val) =>
                        updateRow(row.questionNumber, {
                          topicId: parseInt(val),
                        })
                      }
                    >
                      <SelectTrigger className="h-8 w-44 text-sm">
                        <SelectValue placeholder="Select topic…" />
                      </SelectTrigger>
                      <SelectContent>
                        {topics.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {idx < rows.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Save / Cancel */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          className="bg-teal-700 hover:bg-teal-800"
          onClick={() => onSave?.(draft)}
        >
          Save
        </Button>
      </div>
    </div>
  )
}
