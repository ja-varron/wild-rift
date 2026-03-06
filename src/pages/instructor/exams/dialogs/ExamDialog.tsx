import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const ExamDialog = () => {
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
            <Input
              id="exam-course"
              placeholder="e.g., BSN - Nursing"
              value={newCourse}
              onChange={(e) => setNewCourse(e.target.value)}
            />
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
            onClick={() => setCreateDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            className="bg-teal-700 hover:bg-teal-800"
            onClick={handleCreateExam}
            disabled={
              !newTitle ||
              !newCourse ||
              !newDate ||
              !newTotalItems ||
              !newTopics
            }
          >
            Create Exam
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ExamDialog }