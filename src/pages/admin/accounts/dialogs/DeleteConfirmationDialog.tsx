import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type DeleteConfirmationDialogProps = {
  handleDelete: () => void | Promise<void>
  open: boolean
  onOpenChange: (open: boolean) => void
  isDeleting?: boolean
}

const DeleteConfirmationDialog = ({ handleDelete, open, onOpenChange, isDeleting = false }: DeleteConfirmationDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Account</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this account? This action cannot be undone.
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

export { DeleteConfirmationDialog }