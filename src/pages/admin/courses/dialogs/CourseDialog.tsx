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

export interface CourseFormData {
  course_name: string
  course_code: string
  description: string
}

interface CourseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** If provided, the dialog is in "edit" mode */
  initialData?: CourseFormData
  onSave: (data: CourseFormData) => void
}

const CourseDialog = ({ open, onOpenChange, initialData, onSave }: CourseDialogProps) => {
  const isEditing = !!initialData
  const [form, setForm] = useState<CourseFormData>(
    initialData ?? { course_name: "", course_code: "", description: "" }
  )

  function handleSave() {
    if (!form.course_name.trim() || !form.course_code.trim()) return
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
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="courseName">Examination Name *</Label>
              <Input
                id="courseName"
                value={form.course_name}
                onChange={(e) => setForm({ ...form, course_name: e.target.value })}
                placeholder="BS Computer Science Licensure Review"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="courseCode">Code *</Label>
              <Input
                id="courseCode"
                value={form.course_code}
                onChange={(e) => setForm({ ...form, course_code: e.target.value })}
                placeholder="BSCS"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="courseDesc">Description</Label>
            <Input
              id="courseDesc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Review program for the CS licensure board examination."
            />
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
