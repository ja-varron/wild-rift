import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconPlus, IconLoader2 } from "@tabler/icons-react"

type AccountForm = {
  firstName: string
  middleName: string
  lastName: string
  email: string
  password: string
  role: "Student" | "Instructor" | "Admin"
  prcExamType: string
}

type CreateAccountDialogProps = {
  dialogOpen: boolean
  setDialogOpen: (open: boolean) => void
  editingId: string | null
  form: AccountForm
  setForm: (form: AccountForm) => void
  licensureExams: string[]
  handleSave: () => void
  openCreate: () => void
  isSaving: boolean
}

const CreateAccountDialog = ({
  dialogOpen,
  setDialogOpen,
  editingId,
  form,
  setForm,
  licensureExams,
  handleSave,
  openCreate,
  isSaving,
}: CreateAccountDialogProps) => {
  const examOptions =
    form.prcExamType && !licensureExams.includes(form.prcExamType)
      ? [form.prcExamType, ...licensureExams]
      : licensureExams

  const canSave =
    !!form.firstName.trim() &&
    !!form.lastName.trim() &&
    !!form.email.trim() &&
    !!form.prcExamType.trim() &&
    (editingId ? true : true) // For new accounts, password is auto-generated, so always true

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5" onClick={openCreate}>
          <IconPlus className="size-4" />
          Create Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingId ? "Edit Account" : "Create New Account"}</DialogTitle>
          <DialogDescription>
            {editingId
              ? "Update the account details below. Password changes are disabled in the admin panel."
              : "Fill in the details to create a new student or instructor account. A secure password will be generated automatically and sent via email."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                disabled={isSaving}
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                placeholder="Juan"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="middleName">Middle Name</Label>
              <Input
                id="middleName"
                disabled={isSaving}
                value={form.middleName}
                onChange={(e) => setForm({ ...form, middleName: e.target.value })}
                placeholder="A."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                disabled={isSaving}
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Dela Cruz"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              disabled={isSaving}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="juan.delacruz@vsu.edu.ph"
            />
          </div>

          {editingId && (
            <p className="text-xs text-muted-foreground">
              Password changes are disabled for all accounts.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Role *</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v as "Student" | "Instructor" })}
                disabled={isSaving}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Student">Student</SelectItem>
                  <SelectItem value="Instructor">Instructor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>PRC Licensure Exam *</Label>
              <Select
                value={form.prcExamType}
                onValueChange={(v) => setForm({ ...form, prcExamType: v })}
                disabled={isSaving || examOptions.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select PRC exam" />
                </SelectTrigger>
                <SelectContent>
                  {examOptions.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      No exams available
                    </SelectItem>
                  ) : null}
                  {examOptions.map((exam) => (
                    <SelectItem key={exam} value={exam}>{exam}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave || isSaving}>
            {isSaving && <IconLoader2 className="size-4 mr-2 animate-spin" />}
            {isSaving ? "Saving..." : editingId ? "Save Changes" : "Create Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { CreateAccountDialog }