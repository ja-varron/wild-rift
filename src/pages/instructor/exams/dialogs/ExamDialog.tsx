import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Course } from "@/model/course"

type ExamDialogProps = {
  createDialogOpen: boolean
  setCreateDialogOpen: (open: boolean) => void
  newTitle: string
  setNewTitle: (title: string) => void
  newCourseId: string
  setNewCourseId: (courseId: string) => void
  newDate: string
  setNewDate: (date: string) => void
  newTotalItems: string
  setNewTotalItems: (totalItems: string) => void
  newPassingRate: string
  setNewPassingRate: (passingRate: string) => void
  newTopics: string
  setNewTopics: (topics: string) => void
  handleCreateExam: () => void
  onCancel?: () => void
  courses?: Course[]
  isSaving?: boolean
  coursesLoading?: boolean
  coursesError?: string | null
}

const ExamDialog = ({ createDialogOpen, setCreateDialogOpen, newTitle, setNewTitle, newCourseId, setNewCourseId, newDate, setNewDate, newTotalItems, setNewTotalItems, newPassingRate, setNewPassingRate, newTopics, setNewTopics, handleCreateExam, onCancel, courses, isSaving, coursesLoading, coursesError }: ExamDialogProps) => {
  return (
    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Exam</DialogTitle>
          <DialogDescription>
            Set up a new exam with topics. You can configure answer keys
            after creation.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="exam-title">Exam Title</Label>
            <Input
              id="exam-title"
              placeholder="e.g., Nursing Board Mock Exam 4"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="exam-course">Course</Label>
            <select
              id="exam-course"
              className="rounded-md border bg-transparent px-3 py-2"
              value={newCourseId}
              onChange={(e) => setNewCourseId(e.target.value)}
            >
              {coursesLoading ? (
                <option value="">Loading courses...</option>
              ) : coursesError ? (
                <option value="">Failed to load courses</option>
              ) : courses && courses.length > 0 ? (
                <>
                  <option value="">Select a course</option>
                  {courses.map((c) => (
                    <option key={c.getCourseId} value={c.getCourseId}>
                      {c.getCourseName}
                    </option>
                  ))}
                </>
              ) : (
                <option value="">No courses found</option>
              )}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="exam-date">Date</Label>
            <Input
              id="exam-date"
              placeholder="e.g., Apr 1, 2026"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="exam-total">Total Items</Label>
              <Input
                id="exam-total"
                type="number"
                placeholder="100"
                value={newTotalItems}
                onChange={(e) => setNewTotalItems(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="exam-passing">Passing Rate (%)</Label>
              <Input
                id="exam-passing"
                type="number"
                placeholder="75"
                value={newPassingRate}
                onChange={(e) => setNewPassingRate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="exam-topics">
              Topics (comma-separated)
            </Label>
            <Input
              id="exam-topics"
              placeholder="e.g., Fundamentals, Pharmacology, Med‑Surg"
              value={newTopics}
              onChange={(e) => setNewTopics(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setCreateDialogOpen(false)
              onCancel?.()
            }}
          >
            Cancel
          </Button>
          <Button
            className="bg-teal-700 hover:bg-teal-800"
            onClick={() => {
              console.log('Create button clicked')
              handleCreateExam()
            }}
            disabled={!newTitle || !newCourseId || isSaving}
          >
            {isSaving ? "Creating..." : "Create Exam"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ExamDialog }