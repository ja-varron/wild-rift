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
import type { UserProfile } from "@/model/user-profile"
import { adminSignUp } from "@/lib/supabase/authentication/auth"
import { supabase } from "@/lib/supabase/supabase"
import { toast } from "sonner"
import { useFetchUsers } from "@/lib/supabase/authentication/context/use-fetch-users"
import { useFetchCourses } from "@/lib/supabase/course/context/use-fetch-courses"


// ── Empty form state ───────────────────────────────────────────────────────────

const emptyForm = {
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  password: "",
  role: "Student" as "Student" | "Instructor" | "Admin",
  prcExamType: ""
}

// ── Component ──────────────────────────────────────────────────────────────────

const AdminAccountsPage = ({ userProfile }: { userProfile: UserProfile | null | undefined }) => {
  const { users, isLoading, refetch } = useFetchUsers(userProfile?.institution_id!)
  const { courses } = useFetchCourses(userProfile?.institution_id!)

  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<"All" | "Student" | "Instructor">("All")

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [isSaving, setIsSaving] = useState(false)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ── Filtering & pagination ──
  const filtered = useMemo(() => {
    return users.filter((a) => {
      const name = a.first_name.toLowerCase()
      const matchesSearch =
        name.includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase())
      const matchesRole = roleFilter === "All" || a.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [users, search, roleFilter])

  // ── Counts ──
  const studentCount = users.filter((a) => a.role === "Student").length
  const instructorCount = users.filter((a) => a.role === "Instructor").length


  // ── Handlers ──
  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(account: UserProfile) {
    setEditingId(account.user_id!)
    setForm({
      firstName: account.first_name,
      middleName: account.middle_name ?? "",
      lastName: account.last_name,
      email: account.email,
      password: "", // Password is not edited here, but required to satisfy the state type
      role: account.role ?? "Student",
      prcExamType: account.course?.course_name ?? "",
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      toast.error("Please fill in all required fields.")
      return
    }

    setIsSaving(true)
    try {
      // Create user directly via the supabaseAdmin client (service role key).
      // This skips email confirmation and does not affect the admin's own session.
      const { data, error } = await adminSignUp(
        form.email,
        "12345678",
        {
          firstName: form.firstName,
          middleName: form.middleName,
          lastName: form.lastName,
          role: form.role,
        },
      )

      if (error || !data?.user) {
        toast.error(`Failed to create account: ${error?.message ?? "Unknown error"}`)
        return
      }

      const newUserId = data.user.id

      // Insert the profile row for the newly created auth user.
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          user_id: newUserId,
          first_name: form.firstName,
          middle_name: form.middleName,
          last_name: form.lastName,
          email: form.email,
          role: form.role,
          institution_id: userProfile?.institution_id,
        })

      if (profileError) {
        toast.error(`Failed to update profile: ${profileError.message}`)
        return
      }

      // Enroll the user in the selected course
      const selectedCourse = courses.find((c) => c.course_name === form.prcExamType)
      if (selectedCourse) {
        const { error: enrollmentError } = await supabase
          .from("course_enrollment")
          .insert({
            user_id: newUserId,
            course_id: selectedCourse.course_id,
          })

        if (enrollmentError) {
          toast.error(`Failed to enroll user in course: ${enrollmentError.message}`)
        }
      }

      toast.success("Account created successfully!")
      setDialogOpen(false)
      setForm(emptyForm)
      setEditingId(null)
    } catch (err) {
      toast.error("An unexpected error occurred.")
      console.error(err)
    } finally {
      setIsSaving(false)
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
            licensureExams={courses.map((c) => c.course_name)}
            isSaving={isSaving}
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