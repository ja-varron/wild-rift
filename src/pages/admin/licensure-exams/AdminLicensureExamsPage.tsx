import { useEffect, useMemo, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  addLicensureExam,
  deleteLicensureExam,
  fetchLicensureExams,
  type LicensureExam,
  updateLicensureExam,
} from "@/lib/licensure-exams-api"
import { toast } from "sonner"

const AdminLicensureExamsPage = () => {
  const [exams, setExams] = useState<LicensureExam[]>([])
  const [fallbackMode, setFallbackMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [addValue, setAddValue] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState("")
  const [saving, setSaving] = useState(false)

  const activeCount = useMemo(() => exams.filter((exam) => exam.is_active).length, [exams])

  const loadExams = async () => {
    try {
      setLoading(true)
      const data = await fetchLicensureExams()
      setExams(data.exams)
      setFallbackMode(data.fallback)
    } catch (error) {
      console.error("Failed to fetch licensure exams", error)
      toast.error(error instanceof Error ? error.message : "Failed to load licensure exams")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadExams()
  }, [])

  const handleAdd = async () => {
    if (!addValue.trim()) {
      toast.error("Please enter an exam name")
      return
    }

    try {
      setSaving(true)
      await addLicensureExam(addValue.trim())
      setAddValue("")
      toast.success("Licensure exam added")
      await loadExams()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add licensure exam")
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (exam: LicensureExam) => {
    setEditingId(exam.id)
    setEditingValue(exam.exam_name)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingValue("")
  }

  const handleUpdate = async () => {
    if (!editingId) return
    if (!editingValue.trim()) {
      toast.error("Exam name cannot be empty")
      return
    }

    try {
      setSaving(true)
      await updateLicensureExam(editingId, editingValue.trim())
      toast.success("Licensure exam updated")
      cancelEdit()
      await loadExams()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update licensure exam")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (examId: number) => {
    try {
      setSaving(true)
      await deleteLicensureExam(examId)
      toast.success("Licensure exam deleted")
      await loadExams()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete licensure exam")
    } finally {
      setSaving(false)
    }
  }

  return (
    <ScrollArea className="flex-1">
      <main className="p-6 space-y-6 max-w-5xl mx-auto w-full">
        <div>
          <h1 className="text-2xl font-bold">PRC Licensure Exams</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            List of PRC licensure examinations offered by VSU Review Center.
          </p>
        </div>

        <Card>
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Offered Exams</CardTitle>
              <Badge variant="secondary">{activeCount} active</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {fallbackMode ? (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                Running in fallback mode. Create the <span className="font-semibold">prc_licensure_exams</span> table
                using the new SQL migration to enable add/edit/delete.
              </div>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={addValue}
                onChange={(event) => setAddValue(event.target.value)}
                placeholder="Add new licensure exam"
                disabled={saving || fallbackMode}
              />
              <Button onClick={handleAdd} disabled={saving || fallbackMode || !addValue.trim()}>
                Add Exam
              </Button>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading exams...</p>
            ) : (
              <ul className="space-y-2">
                {exams.map((exam) => (
                  <li key={exam.id} className="rounded-md border px-3 py-2 text-sm">
                    {editingId === exam.id ? (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Input
                          value={editingValue}
                          onChange={(event) => setEditingValue(event.target.value)}
                          disabled={saving || fallbackMode}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleUpdate} disabled={saving || fallbackMode}>
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit} disabled={saving}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <span>{exam.exam_name}</span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(exam)}
                            disabled={saving || fallbackMode}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(exam.id)}
                            disabled={saving || fallbackMode}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </ScrollArea>
  )
}

export default AdminLicensureExamsPage
