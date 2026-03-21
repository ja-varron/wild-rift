import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Search,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Users,
} from "lucide-react"
import type { Student } from "../types"
import { initials, scoreColor } from "../types"

interface StudentTableProps {
  search: string
  onSearchChange: (value: string) => void
  pageItems: Student[]
  selected: Set<number>
  allPageSelected: boolean
  somePageSelected: boolean
  onToggleAll: () => void
  onToggleOne: (id: number) => void
  onSelectStudent: (id: number) => void
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

function pageRange(current: number, total: number) {
  const delta = 1
  const range: number[] = []
  for (
    let i = Math.max(1, current - delta);
    i <= Math.min(total, current + delta);
    i++
  ) {
    range.push(i)
  }
  return range
}

const StudentTable = ({
  search,
  onSearchChange,
  pageItems,
  selected,
  allPageSelected,
  somePageSelected,
  onToggleAll,
  onToggleOne,
  onSelectStudent,
  page,
  totalPages,
  onPageChange,
}: StudentTableProps) => {
  const range = pageRange(page, totalPages)

  return (
    <Card className="overflow-hidden">

      {/* Search bar */}
      <div className="px-4 py-3 border-b">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or examinee no."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-10 pl-4">
              <Checkbox
                checked={allPageSelected}
                data-state={
                  somePageSelected && !allPageSelected
                    ? "indeterminate"
                    : undefined
                }
                onCheckedChange={onToggleAll}
              />
            </TableHead>
            <TableHead className="font-semibold text-foreground">Student</TableHead>
            <TableHead className="font-semibold text-foreground">Examinee No.</TableHead>
            <TableHead className="font-semibold text-foreground">Email</TableHead>
            <TableHead className="font-semibold text-foreground text-center">Exams</TableHead>
            <TableHead className="font-semibold text-foreground text-right">Avg. Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-16 text-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Users className="size-8" />
                  <p className="text-sm">No students found</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            pageItems.map((student, idx) => {
              const avg =
                student.examResults.length > 0
                  ? Math.round(
                      student.examResults.reduce(
                        (sum, r) => sum + Math.round((r.score / r.totalItems) * 100),
                        0,
                      ) / student.examResults.length,
                    )
                  : null

              return (
                <TableRow
                  key={student.id}
                  className={`cursor-pointer transition-colors ${
                    selected.has(student.id)
                      ? "bg-teal-50/60 dark:bg-teal-950/20"
                      : idx % 2 === 0
                        ? "bg-background hover:bg-muted/30"
                        : "bg-muted/20 hover:bg-muted/40"
                  }`}
                  onClick={() => onSelectStudent(student.id)}
                >
                  <TableCell
                    className="pl-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selected.has(student.id)}
                      onCheckedChange={() => onToggleOne(student.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8 shrink-0">
                        <AvatarFallback className="text-xs font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400">
                          {initials(student.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.course} · {student.yearLevel}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm tabular-nums">
                    {student.examineeNo}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {student.email}
                  </TableCell>
                  <TableCell className="text-center tabular-nums text-sm">
                    {student.examResults.length}
                  </TableCell>
                  <TableCell className="text-right">
                    {avg !== null ? (
                      <span className={`font-semibold tabular-nums ${scoreColor(avg)}`}>
                        {avg}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-1 border-t px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>

        {range[0] > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="size-8 p-0"
              onClick={() => onPageChange(1)}
            >
              1
            </Button>
            {range[0] > 2 && (
              <span className="px-1 text-muted-foreground text-sm">…</span>
            )}
          </>
        )}

        {range.map((p) => (
          <Button
            key={p}
            variant={p === page ? "default" : "ghost"}
            size="sm"
            className={`size-8 p-0 ${p === page ? "bg-teal-700 hover:bg-teal-800" : ""}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </Button>
        ))}

        {range.at(-1)! < totalPages && (
          <>
            {range.at(-1)! < totalPages - 1 && (
              <span className="px-1 text-muted-foreground text-sm">…</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="size-8 p-0"
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </Button>
          </>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRightIcon className="size-4" />
        </Button>
      </div>

    </Card>
  )
}

export default StudentTable
