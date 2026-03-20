import { useState, Fragment } from "react"
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
import type { ExamTopic, StudentResult } from "../types"

// ── Props ──────────────────────────────────────────────────────────────────────

interface StudentScoresTableProps {
  results: StudentResult[]
  topics: ExamTopic[]
  passingRate: number
  onUpdateFeedback: (studentId: number, feedback: string) => void
}

// ── Component ──────────────────────────────────────────────────────────────────

export function StudentScoresTable({
  results,
  topics,
  passingRate,
  onUpdateFeedback,
}: StudentScoresTableProps) {
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "score">("score")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [draftFeedback, setDraftFeedback] = useState<Record<number, string>>({})

  const filtered = results
    .filter(
      (r) =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.studentId.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1
      if (sortBy === "name") return mul * a.name.localeCompare(b.name)
      return mul * (a.score - b.score)
    })

  const passedCount = results.filter((r) => r.passed).length

  function toggleSort(col: "name" | "score") {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(col)
      setSortDir(col === "score" ? "desc" : "asc")
    }
  }

  function SortIcon({ col }: { col: "name" | "score" }) {
    if (sortBy !== col) return null
    return sortDir === "asc" ? (
      <ChevronUp className="size-3" />
    ) : (
      <ChevronDown className="size-3" />
    )
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
                    Student <SortIcon col="name" />
                  </span>
                </TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead
                  className="cursor-pointer select-none text-right"
                  onClick={() => toggleSort("score")}
                >
                  <span className="flex items-center gap-1 justify-end">
                    Score <SortIcon col="score" />
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
                filtered.map((r) => {
                  const pct = Math.round((r.score / r.totalItems) * 100)
                  const isExpanded = expandedId === r.id
                  return (
                    <Fragment key={r.id}>
                      <TableRow
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : r.id)
                        }
                      >
                        <TableCell className="font-medium">
                          {r.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {r.studentId}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {r.score}/{r.totalItems}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold tabular-nums ${
                            pct >= passingRate
                              ? "text-green-600"
                              : "text-red-500"
                          }`}
                        >
                          {pct}%
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={r.passed ? "default" : "destructive"}
                            className={
                              r.passed
                                ? "bg-green-500 hover:bg-green-500"
                                : ""
                            }
                          >
                            {r.passed ? "Passed" : "Failed"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm hidden sm:table-cell">
                          {r.scannedAt}
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
                              {r.topicScores.map((ts) => {
                                const topic = topics.find(
                                  (t) => t.id === ts.topicId,
                                )
                                const tPct = Math.round(
                                  (ts.score / ts.maxScore) * 100,
                                )
                                return (
                                  <div key={ts.topicId} className="space-y-1">
                                    <p className="text-xs text-muted-foreground truncate">
                                      {topic?.name}
                                    </p>
                                    <p
                                      className={`text-sm font-semibold ${
                                        tPct >= passingRate
                                          ? "text-green-600"
                                          : "text-red-500"
                                      }`}
                                    >
                                      {ts.score}/{ts.maxScore} ({tPct}%)
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
                                  draftFeedback[r.id] !== undefined
                                    ? draftFeedback[r.id]
                                    : (r.feedback ?? "")
                                }
                                onChange={(e) =>
                                  setDraftFeedback((prev) => ({
                                    ...prev,
                                    [r.id]: e.target.value,
                                  }))
                                }
                              />
                              <div className="flex items-center justify-between">
                                {r.feedback && draftFeedback[r.id] === undefined && (
                                  <p className="text-xs text-muted-foreground italic">
                                    Feedback saved.
                                  </p>
                                )}
                                <div className="flex gap-2 ml-auto">
                                  {draftFeedback[r.id] !== undefined && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        setDraftFeedback((prev) => {
                                          const next = { ...prev }
                                          delete next[r.id]
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
                                    disabled={draftFeedback[r.id] === undefined}
                                    onClick={() => {
                                      onUpdateFeedback(r.id, draftFeedback[r.id])
                                      setDraftFeedback((prev) => {
                                        const next = { ...prev }
                                        delete next[r.id]
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
