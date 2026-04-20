// ── Add Students Dialog Component ──────────────────────────────────────────────
// Dialog component for instructors to search, select, and add students to courses.

import { useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertCircle,
  Check,
  Loader2,
  Search,
  Users,
} from "lucide-react"
import { useFetchAvailableStudents } from "@/lib/supabase/student/use-fetch-students"
import { useAddStudentsToCourse } from "@/lib/supabase/student/use-student-mutations"

interface AddStudentsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId: string
  courseName: string
  enrolledStudentIds?: Set<string>
}

export function AddStudentsDialog({
  open,
  onOpenChange,
  courseId,
  courseName,
  enrolledStudentIds = new Set(),
}: AddStudentsDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())

  // Fetch available students
  const { data: allStudents = [], isLoading, error } = useFetchAvailableStudents(searchQuery || undefined)

  // Mutation to add students
  const addStudentsMutation = useAddStudentsToCourse()

  // Filter out already enrolled students
  const availableStudents = useMemo(() => {
    return allStudents.filter((student) => !enrolledStudentIds.has(student.user_id))
  }, [allStudents, enrolledStudentIds])

  // Calculate selected count
  const selectedCount = selectedStudents.size
  const queryErrorMessage =
    error instanceof Error
      ? error.message
      : error
        ? "Failed to load students"
        : null
  const mutationErrorMessage =
    addStudentsMutation.error instanceof Error
      ? addStudentsMutation.error.message
      : addStudentsMutation.error
        ? "Failed to add students"
        : null

  // Handle select/deselect all on current page
  const allPageSelected =
    availableStudents.length > 0 &&
    availableStudents.every((s) => selectedStudents.has(s.user_id))

  const somePageSelected = availableStudents.some((s) => selectedStudents.has(s.user_id))

  function toggleAll() {
    if (allPageSelected) {
      // Deselect all
      const newSelected = new Set(selectedStudents)
      availableStudents.forEach((s) => newSelected.delete(s.user_id))
      setSelectedStudents(newSelected)
    } else {
      // Select all
      const newSelected = new Set(selectedStudents)
      availableStudents.forEach((s) => newSelected.add(s.user_id))
      setSelectedStudents(newSelected)
    }
  }

  function toggleStudent(studentId: string) {
    const newSelected = new Set(selectedStudents)
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId)
    } else {
      newSelected.add(studentId)
    }
    setSelectedStudents(newSelected)
  }

  async function handleAddStudents() {
    if (selectedCount === 0) return

    const studentIdsArray = Array.from(selectedStudents)

    try {
      await addStudentsMutation.mutateAsync({
        studentIds: studentIdsArray,
        courseId,
      })

      // Reset on success
      setSelectedStudents(new Set())
      onOpenChange(false)
    } catch (err) {
      console.error("Error adding students:", err)
    }
  }

  function resetDialog() {
    onOpenChange(false)
    setSearchQuery("")
    setSelectedStudents(new Set())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Students to {courseName}</DialogTitle>
          <DialogDescription>
            Search for and select students to enroll in this course.
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <div className="flex items-center gap-2 px-1">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Error Alert */}
        {queryErrorMessage ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{queryErrorMessage}</AlertDescription>
          </Alert>
        ) : null}

        {/* Summary Card */}
        <Card className="bg-muted/50 border-border">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="size-4" />
                <span>
                  {availableStudents.length} available student{availableStudents.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="font-medium">
                {selectedCount} selected
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student List */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : availableStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Users className="size-8 mb-2" />
              <p className="text-sm">
                {searchQuery ? "No students found matching your search" : "No available students"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allPageSelected || somePageSelected}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold text-right">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableStudents.map((student) => (
                  <TableRow
                    key={student.user_id}
                    className={selectedStudents.has(student.user_id) ? "bg-blue-50 dark:bg-blue-950/20" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedStudents.has(student.user_id)}
                        onCheckedChange={() => toggleStudent(student.user_id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {student.first_name} {student.last_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {student.email}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {new Date(student.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={resetDialog}
            disabled={addStudentsMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddStudents}
            disabled={selectedCount === 0 || addStudentsMutation.isPending}
            className="gap-2"
          >
            {addStudentsMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Check className="size-4" />
                Add {selectedCount > 0 ? selectedCount : ""} Student{selectedCount !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </DialogFooter>

        {/* Error from mutation */}
        {mutationErrorMessage ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{mutationErrorMessage}</AlertDescription>
          </Alert>
        ) : null}

        {/* Success message */}
        {addStudentsMutation.isSuccess && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-400">
            <Check className="size-4" />
            <AlertDescription>
              {selectedCount} student{selectedCount !== 1 ? "s" : ""} added successfully!
            </AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  )
}
