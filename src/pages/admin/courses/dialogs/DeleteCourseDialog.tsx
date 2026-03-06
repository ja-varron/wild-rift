import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export interface DeleteTarget {
  type: "course" | "subject"
  id: number
  name: string
}

interface DeleteCourseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: DeleteTarget | null
  onConfirm: () => void
}

const DeleteCourseDialog = ({ open, onOpenChange, target, onConfirm }: DeleteCourseDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete {target?.type === "course" ? "Examination" : "Subject"}</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{target?.name}</strong>?
            {target?.type === "course" && " This will also delete all its subjects and enrollment data."}
            {target?.type === "subject" && " This will also remove it from the examination."}
            {" "}This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteCourseDialog
