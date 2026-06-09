import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import type { ExamFormData } from "../InstructorExamsPage"
import type { Exam } from "@/model/exam"

type ExamDialogProps = {
  createDialogOpen: boolean
  setCreateDialogOpen: (open: boolean) => void
  editingExam: Exam | null
  formData: ExamFormData
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (examForm: ExamFormData) => void
  isSubmitting: boolean
  onCancel: () => void
}

const AddExamDialog = ({
  createDialogOpen,
  setCreateDialogOpen,
  editingExam,
  formData,
  onInputChange,
  onSubmit,
  isSubmitting,
  onCancel,
}: ExamDialogProps) => {
  const isEditMode = editingExam !== null

  return (
    <Dialog
      open={createDialogOpen}
      onOpenChange={(open) => {
        if (!open) {
          onCancel()
          return
        }
        setCreateDialogOpen(open)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Exam" : "Create New Exam"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update your exam details and save changes."
              : "Set up a new exam with topics. You can configure answer keys after creation."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Exam Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g., Nursing Board Mock Exam 4"
              value={formData.title}
              onChange={onInputChange}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="examDate">Date</Label>
            <Input
              id="examDate"
              name="examDate"
              type="date"
              value={formData.examDate}
              onChange={onInputChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="totalItems">Total Items</Label>
              <Input
                id="totalItems"
                name="totalItems"
                type="number"
                placeholder="100"
                value={formData.totalItems}
                onChange={onInputChange}
                min="1"
                max="500"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="passingRate">Passing Rate (%)</Label>
              <Input
                id="passingRate"
                name="passingRate"
                type="number"
                placeholder="75"
                value={formData.passingRate}
                onChange={onInputChange}
                min="0"
                max="100"
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="topics">Topics (comma-separated)</Label>
            <Input
              id="topics"
              name="topics"
              placeholder="e.g., Fundamentals, Pharmacology, Med-Surg"
              value={formData.topics}
              onChange={onInputChange}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-teal-700 hover:bg-teal-800"
              disabled={
                isSubmitting ||
                !formData.title ||
                !formData.examDate
              }
            >
              {isSubmitting && <Loader2 className="mr-1 size-4 animate-spin" />}
              {isEditMode ? (isSubmitting ? "Saving..." : "Save Changes") : (isSubmitting ? "Creating..." : "Create Exam")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { AddExamDialog }