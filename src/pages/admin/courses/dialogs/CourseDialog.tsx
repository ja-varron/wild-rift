import { useEffect, useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"

export interface CourseForm {
  course_name: string
  description: string
}

interface CourseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** If provided, the dialog is in "edit" mode */
  initialData?: CourseForm
  onSave: (data: CourseForm) => void
}

const CourseDialog = ({ open, onOpenChange, initialData, onSave }: CourseDialogProps) => {
  const isEditing = !!initialData
  const [form, setForm] = useState<CourseForm>(
    initialData ?? { course_name: "", description: "" }
  )

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(initialData ?? { course_name: "", description: "" })
  }, [initialData])

  function handleSave() {
    if (!form.course_name.trim()) return
    onSave(form)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Examination" : "Add New Examination"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the examination details below."
              : "Fill in the details to add a new licensure examination to the review center."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="courseName">Examination Name *</Label>
              <Input
                id="courseName"
                value={form.course_name}
                onChange={(e) => setForm({ ...form, course_name: e.target.value })}
                placeholder="BS Computer Science Licensure Review"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="courseDesc">Description</Label>
              <Textarea
                id="courseDesc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Review program for the CS licensure board examination."
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>{isEditing ? "Save Changes" : "Add Examination"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CourseDialog
