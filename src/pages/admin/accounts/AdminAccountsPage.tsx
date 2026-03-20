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
import { UserProfile } from "@/model/user-profile"
import { adminSignUp } from "@/lib/supabase/authentication/auth"
import supabase from "@/lib/supabase/supabase"
import { toast } from "sonner"
import { useFetchUsers } from "@/lib/supabase/authentication/context/use-fetch-users"

const courses = ["BSCS", "BSIT", "BSN", "BSEd", "BSA", "BSCE"]


// ── Empty form state ───────────────────────────────────────────────────────────

const emptyForm = {
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  role: "Student" as "Student" | "Instructor" | "Admin",
}

// ── Component ──────────────────────────────────────────────────────────────────

const AdminAccountsPage = () => {
  const { users, isLoading } = useFetchUsers()

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
    return users.filter((a) => {
      const name = a.fullName.toLowerCase()
      const matchesSearch =
        name.includes(search.toLowerCase()) ||
        a.getEmailAddress.toLowerCase().includes(search.toLowerCase())
      const matchesRole = roleFilter === "All" || a.getUserRole === roleFilter
      return matchesSearch && matchesRole
    })
  }, [users, search, roleFilter])

  // ── Counts ──
  const studentCount = users.filter((a) => a.getUserRole === "Student").length
  const instructorCount = users.filter((a) => a.getUserRole === "Instructor").length


  // ── Handlers ──
  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(account: UserProfile) {
    setEditingId(account.getUserId)
    setForm({
      firstName: account.getFirstName,
      middleName: account.getMiddleName ?? "",
      lastName: account.getLastName,
      email: account.getEmailAddress,
      role: account.getUserRole ?? "Student",
      // course: account.getCourse ?? "",
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      toast.error("Please fill in all required fields.")
      return
    }

    try {
      // Create user in auth
      const { data, error } = await adminSignUp(
        form.email,
        "12345678",
      )

      if (error || !data.user) {
        toast.error(`Failed to create account: ${error?.message ?? "Unknown error"}`)
        return
      }

      // Update the profile with the rest of the data
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          user_id: data.user.id,
          first_name: form.firstName,
          middle_name: form.middleName,
          last_name: form.lastName,
          email: form.email,
          role: form.role,
          // course: form.course,
        })

      if (profileError) {
        toast.error(`Failed to update profile: ${profileError.message}`)
        return
      }

      toast.success("Account created successfully!")
      setDialogOpen(false)
      setForm(emptyForm)
      setEditingId(null)
    } catch (err) {
      toast.error("An unexpected error occurred.")
      console.error(err)
    }
  }

  function openDelete(user_id: string) {
    setDeletingId(user_id)
    setDeleteDialogOpen(true)
  }

  function handleDelete() {
    if (deletingId !== null) {
      // setAccounts((prev) => prev.filter((a) => a.getUserId !== deletingId))
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
            <span>{users.length} total</span>
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
        {isLoading ? (
          <p>Loading accounts...</p>
        ) : (
          <AccountTable
            users={filtered}
            onEdit={openEdit}
            onDelete={openDelete}
          />
        )}

        <DeleteConfirmationDialog handleDelete={handleDelete} open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} />
      </main>
    </ScrollArea>
  )
}

export default AdminAccountsPage
