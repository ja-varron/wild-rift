import { useMemo, useState, Fragment } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, Users, ChevronDown, ChevronUp, MessageSquare } from "lucide-react"
import type { ExamTopic, Feedback, ScoreResult } from "../types"

// ── Props ──────────────────────────────────────────────────────────────────────

interface StudentScoresTableProps {
  results: ScoreResult[]
  topics: ExamTopic[]
  passingRate: number
  feedbackEntries: Feedback[]
  onUpdateFeedback: (studentId: string, feedback: string) => void
}

type SortColumn = "name" | "score"

function SortIcon({
  col,
  sortBy,
  sortDir,
}: {
  col: SortColumn
  sortBy: SortColumn
  sortDir: "asc" | "desc"
}) {
  if (sortBy !== col) return null
  return sortDir === "asc" ? (
    <ChevronUp className="size-3" />
  ) : (
    <ChevronDown className="size-3" />
  )
}

function getStudentName(result: ScoreResult) {
  const firstName = result.student.first_name?.trim() || ""
  const lastName = result.student.last_name?.trim() || ""
  const name = [firstName, lastName].filter(Boolean).join(" ").trim()
  return name || "Unknown"
}

function getScorePercent(result: ScoreResult) {
  if (typeof result.scorePercent === "number" && Number.isFinite(result.scorePercent)) {
    return Math.round(result.scorePercent)
  }

  if (
    typeof result.totalScore === "number" &&
    Number.isFinite(result.totalScore) &&
    typeof result.totalItems === "number" &&
    Number.isFinite(result.totalItems) &&
    result.totalItems > 0
  ) {
    return Math.round((result.totalScore / result.totalItems) * 100)
  }

  return null
}

function getPassed(result: ScoreResult, passingRate: number) {
  if (typeof result.passed === "boolean") return result.passed
  const percent = getScorePercent(result)
  return percent !== null && percent >= passingRate
}

// ── Component ──────────────────────────────────────────────────────────────────

export function StudentScoresTable({
  results,
  topics,
  passingRate,
  feedbackEntries,
  onUpdateFeedback,
}: StudentScoresTableProps) {
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<SortColumn>("score")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [draftFeedback, setDraftFeedback] = useState<Record<string, string>>({})

  const feedbackByStudentId = useMemo(() => {
    const map = new Map<string, Feedback>()
    for (const entry of feedbackEntries) {
      const studentId = entry.student?.student_id?.trim()
      if (!studentId) continue
      const existing = map.get(studentId)
      if (!existing || entry.message_at > existing.message_at) {
        map.set(studentId, entry)
      }
    }
    return map
  }, [feedbackEntries])

  const filtered = results
    .filter((result) => {
      const term = search.trim().toLowerCase()
      if (!term) return true

      const name = getStudentName(result).toLowerCase()
      const examinee = result.student.examinee_id_number?.toLowerCase() || ""
      const studentId = result.student.student_id?.toLowerCase() || ""
      return (
        name.includes(term) ||
        examinee.includes(term) ||
        studentId.includes(term)
      )
    })
    .sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1
      if (sortBy === "name") {
        return mul * getStudentName(a).localeCompare(getStudentName(b))
      }

      const aScore = getScorePercent(a) ?? -1
      const bScore = getScorePercent(b) ?? -1
      return mul * (aScore - bScore)
    })

  const passedCount = results.filter((r) => getPassed(r, passingRate)).length

  function toggleSort(col: SortColumn) {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(col)
      setSortDir(col === "score" ? "desc" : "asc")
    }
  }

  // Empty state
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Users className="size-8 text-muted-foreground mb-2" />
        <p className="text-sm font-medium">No scores available</p>
        <p className="text-xs text-muted-foreground mt-1">
          Scan and grade student papers to see scores here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm">
            <Users className="size-4 text-muted-foreground" />
            <span className="font-medium">{results.length}</span>
            <span className="text-muted-foreground">students</span>
          </div>
          <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
            {passedCount} passed
          </Badge>
          <Badge className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
            {results.length - passedCount} failed
          </Badge>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => toggleSort("name")}
                >
                  <span className="flex items-center gap-1">
                    Student <SortIcon col="name" sortBy={sortBy} sortDir={sortDir} />
                  </span>
                </TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead
                  className="cursor-pointer select-none text-right"
                  onClick={() => toggleSort("score")}
                >
                  <span className="flex items-center gap-1 justify-end">
                    Score <SortIcon col="score" sortBy={sortBy} sortDir={sortDir} />
                  </span>
                </TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right hidden sm:table-cell">
                  Scanned
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No students found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((res, index) => {
                  const pct = getScorePercent(res)
                  const rowKey =
                    res.student.student_id ||
                    res.student.examinee_id_number ||
                    `${res.exam_id}-${index}`
                  const isExpanded = expandedId === rowKey
                  const studentId = res.student.student_id?.trim() || ""
                  const feedbackKey = studentId || rowKey
                  const savedFeedback = studentId
                    ? feedbackByStudentId.get(studentId)?.comment
                    : ""
                  const totalScore =
                    typeof res.totalScore === "number" && Number.isFinite(res.totalScore)
                      ? res.totalScore
                      : null
                  const totalItems =
                    typeof res.totalItems === "number" && Number.isFinite(res.totalItems)
                      ? res.totalItems
                      : null
                  const isPassed = getPassed(res, passingRate)
                  return (
                    <Fragment key={rowKey}>
                      <TableRow
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : rowKey)
                        }
                      >
                        <TableCell className="font-medium">
                          {getStudentName(res)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {res.student.examinee_id_number}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {totalScore !== null && totalItems !== null
                            ? `${totalScore}/${totalItems}`
                            : "--"}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold tabular-nums ${
                            pct !== null && pct >= passingRate
                              ? "text-green-600"
                              : "text-red-500"
                          }`}
                        >
                          {pct !== null ? `${pct}%` : "--"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={isPassed ? "default" : "destructive"}
                            className={
                              isPassed
                                ? "bg-green-500 hover:bg-green-500"
                                : ""
                            }
                          >
                            {isPassed ? "Passed" : "Failed"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm hidden sm:table-cell">
                          {res.scanned_at || "--"}
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="bg-muted/30 px-6 py-4"
                          >
                            {/* Topic Breakdown */}
                            <p className="text-xs text-muted-foreground mb-2 font-medium">
                              Topic Breakdown
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                              {res.topicScores.map((ts, topicIndex) => {
                                const topic =
                                  ts.topic ||
                                  topics.find(
                                    (t) => t.topic_idx === ts.topic?.topic_idx,
                                  )
                                const tPct = Math.round(
                                  (ts.score / Math.max(1, ts.total)) * 100,
                                )
                                return (
                                  <div
                                    key={topic?.topic_idx ?? topicIndex}
                                    className="space-y-1"
                                  >
                                    <p className="text-xs text-muted-foreground truncate">
                                      {topic?.name || `Topic ${topicIndex + 1}`}
                                    </p>
                                    <p
                                      className={`text-sm font-semibold ${
                                        tPct >= passingRate
                                          ? "text-green-600"
                                          : "text-red-500"
                                      }`}
                                    >
                                      {ts.score}/{ts.total} ({tPct}%)
                                    </p>
                                  </div>
                                )
                              })}
                            </div>

                            {/* Feedback */}
                            <div className="border-t pt-3 space-y-2">
                              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                                <MessageSquare className="size-3.5" />
                                Personalized Feedback
                              </p>
                              <Textarea
                                placeholder="Write feedback for this student..."
                                className="text-sm min-h-20 resize-none"
                                value={
                                  draftFeedback[feedbackKey] !== undefined
                                    ? draftFeedback[feedbackKey]
                                    : (savedFeedback ?? "")
                                }
                                onChange={(e) =>
                                  setDraftFeedback((prev) => ({
                                    ...prev,
                                    [feedbackKey]: e.target.value,
                                  }))
                                }
                              />
                              <div className="flex items-center justify-between">
                                {savedFeedback && draftFeedback[feedbackKey] === undefined && (
                                  <p className="text-xs text-muted-foreground italic">
                                    Feedback saved.
                                  </p>
                                )}
                                <div className="flex gap-2 ml-auto">
                                  {draftFeedback[feedbackKey] !== undefined && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        setDraftFeedback((prev) => {
                                          const next = { ...prev }
                                          delete next[feedbackKey]
                                          return next
                                        })
                                      }
                                    >
                                      Discard
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    className="bg-teal-700 hover:bg-teal-800"
                                    disabled={
                                      !studentId ||
                                      draftFeedback[feedbackKey] === undefined
                                    }
                                    onClick={() => {
                                      onUpdateFeedback(studentId, draftFeedback[feedbackKey])
                                      setDraftFeedback((prev) => {
                                        const next = { ...prev }
                                        delete next[feedbackKey]
                                        return next
                                      })
                                    }}
                                  >
                                    Save Feedback
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
