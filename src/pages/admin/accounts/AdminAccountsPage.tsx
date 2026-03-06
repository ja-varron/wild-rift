import { useState, useMemo } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CreateAccountDialog } from "./dialogs/CreateAccountDialog"
import { AccountTable } from "./components/AccountsTable"
import {
  Search,
  GraduationCap,
  UserCog,
  Users,
} from "lucide-react"
import { DeleteConfirmationDialog } from "./dialogs/DeleteConfirmationDialog"
import { User } from "@/model/user"

// ── Types ──────────────────────────────────────────────────────────────────────

// type Account = {
//   id: number
//   firstName: string
//   middleName: string
//   lastName: string
//   email: string
//   role: "Student" | "Instructor"
//   course: string
//   dateCreated: string
// }

// ── Mock data ──────────────────────────────────────────────────────────────────

const courses = ["BSCS", "BSIT", "BSN", "BSEd", "BSA", "BSCE"]

function generateAccounts(): User[] {
  const data: User[] = [
    new User("1", "Juan", "A.", "Dela Cruz", "juan.delacruz@vsu.edu.ph", "Student", "BSCS"),
    new User("2", "Maria", "", "Santos", "maria.santos@vsu.edu.ph", "Student", "BSN"),
    new User("3", "Carlos", "B.", "Reyes", "carlos.reyes@vsu.edu.ph", "Instructor", "BSCS"),
    new User("4", "Ana", "C.", "Flores", "ana.flores@vsu.edu.ph", "Student", "BSIT"),
    new User("5", "Mark", "", "Lim", "mark.lim@vsu.edu.ph", "Student", "BSCS"),
    new User("6", "Grace", "D.", "Tan", "grace.tan@vsu.edu.ph", "Instructor", "BSN"),
    new User("7", "Paulo", "", "Rivera", "paulo.rivera@vsu.edu.ph", "Student", "BSEd"),
    new User("8", "Lisa", "E.", "Cruz", "lisa.cruz@vsu.edu.ph", "Student", "BSA"),
    new User("9", "Ben", "", "Torres", "ben.torres@vsu.edu.ph", "Instructor", "BSIT"),
    new User("10", "Alex", "F.", "Gomez", "alex.gomez@vsu.edu.ph", "Student", "BSCS"),
  ]
  return data
}

// ── Empty form state ───────────────────────────────────────────────────────────

const emptyForm = {
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  role: "Student" as "Student" | "Instructor" | "Admin",
  course: "",
}

// ── Component ──────────────────────────────────────────────────────────────────

const AdminAccountsPage = () => {
  const [accounts, setAccounts] = useState<User[]>(generateAccounts())
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<"All" | "Student" | "Instructor">("All")

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ── Filtering & pagination ──
  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      const name = a.fullName.toLowerCase()
      const matchesSearch =
        name.includes(search.toLowerCase()) ||
        a.getEmailAddress.toLowerCase().includes(search.toLowerCase()) ||
        a.getExamReview.toLowerCase().includes(search.toLowerCase())
      const matchesRole = roleFilter === "All" || a.getUserRole === roleFilter
      return matchesSearch && matchesRole
    })
  }, [accounts, search, roleFilter])

  // ── Counts ──
  const studentCount = accounts.filter((a) => a.getUserRole === "Student").length
  const instructorCount = accounts.filter((a) => a.getUserRole === "Instructor").length

  // ── Handlers ──
  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(account: User) {
    setEditingId(account.getUserId)
    setForm({
      firstName: account.getFirstName,
      middleName: account.getMiddleName ?? "",
      lastName: account.getLastName,
      email: account.getEmailAddress,
      role: account.getUserRole ?? "Student",
      course: account.getExamReview,
    })
    setDialogOpen(true)
  }

  function handleSave() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) return

    if (editingId !== null) {
      setAccounts((prev) =>
        prev.map((a) => {
          if (a.getUserId !== editingId) return a
          // Create a new User with updated properties
          const updated = new User(
            a.getUserId,
            form.firstName,
            form.middleName,
            form.lastName,
            form.email,
            form.role,
            form.course
          )
          return updated
        })
      )
    } else {
      const newId = String(Math.max(...accounts.map((a) => parseInt(a.getUserId) || 0), 0) + 1)
      // const today = new Date()
      // const dateStr = today.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      const newUser = new User(newId, form.firstName, form.middleName, form.lastName, form.email, form.role, form.course)
      setAccounts((prev) => [...prev, newUser])
    }
    setDialogOpen(false)
    setForm(emptyForm)
    setEditingId(null)
  }

  function openDelete(user_id: string) {
    setDeletingId(user_id)
    setDeleteDialogOpen(true)
  }

  function handleDelete() {
    if (deletingId !== null) {
      setAccounts((prev) => prev.filter((a) => a.getUserId !== deletingId))
      setDeleteDialogOpen(false)
      setDeletingId(null)
    }
  }

  return (
    <ScrollArea className="flex-1">
      <main className="p-6 space-y-6 max-w-6xl mx-auto w-full">

        {/* Page title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Account Management</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Create and manage student and instructor accounts for the VSU Review Center.
            </p>
          </div>

          {/* Create Account Button */}
          <CreateAccountDialog
            dialogOpen={dialogOpen}
            setDialogOpen={setDialogOpen}
            editingId={editingId}
            form={form}
            setForm={setForm}
            courses={courses}
            handleSave={handleSave}
            openCreate={openCreate}
          />
        </div>

        {/* ── Summary badges ── */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="size-4" />
            <span>{accounts.length} total</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <GraduationCap className="size-4" />
            <span>{studentCount} students</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <UserCog className="size-4" />
            <span>{instructorCount} instructors</span>
          </div>
        </div>

        {/* ── Search & Filter bar ── */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or course..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value) }}
                />
              </div>
              <Select
                value={roleFilter}
                onValueChange={(v) => { setRoleFilter(v as typeof roleFilter) }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Roles</SelectItem>
                  <SelectItem value="Student">Students</SelectItem>
                  <SelectItem value="Instructor">Instructors</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ── Accounts Table ── */}
        <AccountTable
          users={filtered}
          onEdit={openEdit}
          onDelete={openDelete}
        />

        <DeleteConfirmationDialog handleDelete={handleDelete} open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} />
      </main>
    </ScrollArea>
  )
}

export default AdminAccountsPage
