import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface SubjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** If provided, the dialog is in "edit" mode */
  initialName?: string
  onSave: (subjectName: string) => void
}

const SubjectDialog = ({ open, onOpenChange, initialName, onSave }: SubjectDialogProps) => {
  const isEditing = !!initialName
  const [name, setName] = useState(initialName ?? "")

  function handleSave() {
    if (!name.trim()) return
    onSave(name)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Subject" : "Add New Subject"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the subject name." : "Enter the name of the new subject."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 py-2">
          <Label htmlFor="subjectName">Subject Name *</Label>
          <Input
            id="subjectName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Data Structures & Algorithms"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>{isEditing ? "Save Changes" : "Add Subject"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SubjectDialog
