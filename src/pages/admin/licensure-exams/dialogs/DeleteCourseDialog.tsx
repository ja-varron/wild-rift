import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export type DeleteCourseDialogProps = {
  handleDelete: () => void | Promise<void>
  open: boolean
  onOpenChange: (open: boolean) => void
  isDeleting?: boolean
  courseName?: string
}

const DeleteCourseDialog = ({ handleDelete, open, onOpenChange, isDeleting = false, courseName }: DeleteCourseDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Examination</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the exam "{courseName}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={isDeleting}
            onClick={() => {
              void handleDelete()
            }}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteCourseDialog