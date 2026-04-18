import { useState, useMemo, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
} from "lucide-react"
import { DeleteConfirmationDialog } from "./dialogs/DeleteConfirmationDialog"
import { UserProfile } from "@/model/user-profile"
import { adminSignUp } from "@/lib/supabase/authentication/auth"
import { toast } from "sonner"
import { useFetchUsers } from "@/lib/supabase/authentication/context/use-fetch-users"
import { generateRandomPassword } from "@/lib/password-generator"
import { fetchActiveLicensureExamNames } from "@/lib/licensure-exams-api"
import {
  fetchAccountRequests,
  reviewAccountRequest,
  type AccountRequestRecord,
} from "@/lib/account-requests-api"

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"

// ── Empty form state ───────────────────────────────────────────────────────────

const emptyForm = {
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  password: "",
  role: "Student" as "Student" | "Instructor" | "Admin",
  prcExamType: "",
}

// ── Component ──────────────────────────────────────────────────────────────────

const AdminAccountsPage = () => {
  const { users, isLoading, refetch } = useFetchUsers()
  const [licensureExams, setLicensureExams] = useState<string[]>([])

  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<"All" | "Student" | "Instructor">("All")

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingRequests, setIsLoadingRequests] = useState(false)
  const [accountRequests, setAccountRequests] = useState<AccountRequestRecord[]>([])
  const [requestActionId, setRequestActionId] = useState<number | null>(null)
  const [emailStatus, setEmailStatus] = useState<{
    show: boolean
    status: 'success' | 'warning' | 'error'
    message: string
  }>({ show: false, status: 'success', message: '' })

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // ── Filtering & pagination ──
  const filtered = useMemo(() => {
    return users.filter((a) => {
      const name = a.fullName.toLowerCase()
      const prcExamType = (a.getPrcExamType ?? "").toLowerCase()
      const matchesSearch =
        name.includes(search.toLowerCase()) ||
        a.getEmailAddress.toLowerCase().includes(search.toLowerCase()) ||
        prcExamType.includes(search.toLowerCase())
      const matchesRole = roleFilter === "All" || a.getUserRole === roleFilter
      return matchesSearch && matchesRole
    })
  }, [users, search, roleFilter])

  // ── Counts ──
  const studentCount = users.filter((a) => a.getUserRole === "Student").length
  const instructorCount = users.filter((a) => a.getUserRole === "Instructor").length


  // ── Handlers ──
  const loadAccountRequests = async () => {
    setIsLoadingRequests(true)
    try {
      const requests = await fetchAccountRequests("pending")
      setAccountRequests(requests)
    } catch (error) {
      console.error("Failed to load account requests", error)
      toast.error("Failed to load account requests")
    } finally {
      setIsLoadingRequests(false)
    }
  }

  useEffect(() => {
    const loadLicensureExams = async () => {
      try {
        const exams = await fetchActiveLicensureExamNames()
        setLicensureExams(exams)
      } catch (error) {
        console.error("Failed to load licensure exams", error)
        toast.error("Failed to load PRC licensure exams")
      }
    }

    void loadLicensureExams()
    void loadAccountRequests()
  }, [])

  const sendAccountCreationNotificationEmail = async (payload: {
    email: string
    firstName: string
    role: "Student" | "Instructor" | "Admin"
    temporaryPassword: string
  }) => {
    try {
      const emailResponse = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/accounts/notify-creation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: payload.email,
            firstName: payload.firstName,
            role: payload.role,
            temporaryPassword: payload.temporaryPassword,
            appUrl: window.location.origin,
          }),
        },
      )

      const emailData = await emailResponse.json().catch(() => ({}))

      if (emailData.emailSent) {
        setEmailStatus({
          show: true,
          status: "success",
          message: `✓ Email successfully sent to ${payload.email}. Welcome email with temporary password has been delivered.`,
        })
        toast.success("✓ Account created and welcome email sent successfully!", {
          duration: 10000,
          closeButton: true,
        })
        setTimeout(() => {
          setEmailStatus((prev) => ({ ...prev, show: false }))
        }, 8000)
        return
      }

      if (emailResponse.status === 503) {
        setEmailStatus({
          show: true,
          status: "warning",
          message: "⚠ Account created but email was NOT sent. SMTP is not configured. User must reset password or contact support.",
        })
        toast.warning("⚠ Account created. Email not sent - SMTP not configured.", {
          duration: 15000,
          closeButton: true,
        })
        return
      }

      setEmailStatus({
        show: true,
        status: "error",
        message: `❌ Account created but welcome email could not be sent to ${payload.email}. Contact support to resend.`,
      })
      toast.error("❌ Account created but welcome email could not be sent.", {
        duration: 15000,
        closeButton: true,
      })
      console.warn("[AccountCreation] Email sending failed:", emailData)
    } catch (emailErr) {
      console.warn("[AccountCreation] Failed to send notification email:", emailErr)
      setEmailStatus({
        show: true,
        status: "error",
        message: "❌ Account created but an error occurred while sending the welcome email. Please retry.",
      })
      toast.error("⚠ Account created but welcome email could not be sent.", {
        duration: 15000,
        closeButton: true,
      })
    }
  }

  function openCreate() {
    setEditingId(null)
    // Generate a random password for new accounts
    const generatedPassword = generateRandomPassword(12)
    setForm({
      ...emptyForm,
      password: generatedPassword,
      prcExamType: licensureExams[0] ?? "",
    })
    setEmailStatus({ show: false, status: 'success', message: '' })
    setDialogOpen(true)
  }

  function openEdit(account: UserProfile) {
    setEditingId(account.getUserId)
    setForm({
      firstName: account.getFirstName,
      middleName: account.getMiddleName ?? "",
      lastName: account.getLastName,
      email: account.getEmailAddress,
      password: "",
      role: account.getUserRole ?? "Student",
      prcExamType: account.getPrcExamType ?? licensureExams[0] ?? "",
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.prcExamType.trim()) {
      toast.error("Please fill in all required fields (First Name, Last Name, Email, PRC Licensure Exam)")
      return
    }

    // Validate email format
    if (!EMAIL_REGEX.test(form.email)) {
      toast.error("Please enter a valid email address")
      return
    }

    // Check if email already exists - strong validation
    const emailLower = form.email.toLowerCase().trim()
    const emailExists = users.some(u => {
      const userEmailLower = u.getEmailAddress.toLowerCase().trim()
      return userEmailLower === emailLower && u.getUserId !== editingId
    })
    if (emailExists) {
      toast.error("❌ This email is already registered. Each email can only be used once.")
      return
    }

    setIsSaving(true)

    try {
      if (editingId) {
        const response = await fetch(`${BACKEND_URL}/api/accounts/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: form.firstName,
            middleName: form.middleName,
            lastName: form.lastName,
            email: form.email,
            role: form.role,
            prcExamType: form.prcExamType,
          }),
        })

        const payload = await response.json().catch(() => ({}))

        if (!response.ok) {
          toast.error(`Failed to update account: ${payload?.error ?? "Unknown error"}`)
          setIsSaving(false)
          return
        }

        await refetch()

        toast.success("Account updated successfully!")
        setDialogOpen(false)
        setForm(emptyForm)
        setEditingId(null)
      } else {
        // Create new account
        const { data, error } = await adminSignUp(
          form.email,
          form.password,
          {
            firstName: form.firstName,
            middleName: form.middleName,
            lastName: form.lastName,
            role: form.role,
            prcExamType: form.prcExamType,
          },
        )

        if (error || !data.user) {
          toast.error(`Failed to create account: ${error?.message ?? "Unknown error"}`)
          setIsSaving(false)
          return
        }

        if (data.profileCreated === false) {
          toast.warning("Account created, but profile setup did not complete.")
        }

        await sendAccountCreationNotificationEmail({
          email: form.email,
          firstName: form.firstName,
          role: form.role,
          temporaryPassword: form.password,
        })

        // Close dialog after account creation (both edit and create)
        setDialogOpen(false)
        await refetch()

        // Focus the newly created account in the table regardless of sort order.
        setSearch(form.email.trim())
        setRoleFilter("All")
        
        setForm(emptyForm)
        setEditingId(null)
      }
    } catch (err) {
      console.error("[AccountCreation] Error saving account:", err)
      toast.error("An unexpected error occurred while saving the account.")
    } finally {
      setIsSaving(false)
    }
  }

  function openDelete(user_id: string) {
    setDeletingId(user_id)
    setDeleteDialogOpen(true)
  }

  async function handleDelete() {
    if (!deletingId || isDeleting) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`${BACKEND_URL}/api/accounts/${deletingId}`, {
        method: "DELETE",
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        toast.error(`Failed to delete account: ${payload?.error ?? "Unknown error"}`)
        return
      }

      await refetch()
      toast.success("Account deleted successfully!")
      setDeleteDialogOpen(false)
      setDeletingId(null)
    } catch (error) {
      console.error("Failed to delete account", error)
      toast.error("An unexpected error occurred while deleting the account.")
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleApproveRequest(requestItem: AccountRequestRecord) {
    setRequestActionId(requestItem.id)

    const role = requestItem.role === "Instructor" ? "Instructor" : "Student"
    const prcExamType = (requestItem.prc_exam_type ?? "").trim()

    if (!prcExamType) {
      toast.error("Cannot approve request without PRC Licensure Exam.")
      setRequestActionId(null)
      return
    }

    try {
      const temporaryPassword = generateRandomPassword(12)
      const { data, error } = await adminSignUp(
        requestItem.email,
        temporaryPassword,
        {
          firstName: requestItem.first_name,
          middleName: requestItem.middle_name ?? "",
          lastName: requestItem.last_name,
          role,
          prcExamType,
        },
      )

      if (error || !data?.user) {
        toast.error(`Failed to approve request: ${error?.message ?? "Unknown error"}`)
        return
      }

      await sendAccountCreationNotificationEmail({
        email: requestItem.email,
        firstName: requestItem.first_name,
        role,
        temporaryPassword,
      })

      await reviewAccountRequest(
        requestItem.id,
        "approved",
        "Approved and account created.",
        "Admin",
      )

      await Promise.all([refetch(), loadAccountRequests()])
      toast.success(`Approved request for ${requestItem.email}`)
    } catch (error) {
      console.error("Failed to approve account request", error)
      const message = error instanceof Error ? error.message : "Failed to approve account request"
      toast.error(message)
    } finally {
      setRequestActionId(null)
    }
  }

  async function handleRejectRequest(requestItem: AccountRequestRecord) {
    const notes = window.prompt("Optional reason for rejection:", "")
    if (notes === null) {
      return
    }

    setRequestActionId(requestItem.id)
    try {
      await reviewAccountRequest(
        requestItem.id,
        "rejected",
        notes.trim() || "Rejected by admin.",
        "Admin",
      )
      await loadAccountRequests()
      toast.success(`Rejected request for ${requestItem.email}`)
    } catch (error) {
      console.error("Failed to reject account request", error)
      const message = error instanceof Error ? error.message : "Failed to reject account request"
      toast.error(message)
    } finally {
      setRequestActionId(null)
    }
  }

  return (
    <ScrollArea className="flex-1">
      <main className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto w-full">

        {/* Page title */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            licensureExams={licensureExams}
            handleSave={handleSave}
            openCreate={openCreate}
            isSaving={isSaving}
          />
        </div>

        {/* ── Email Status Alert ── */}
        {emailStatus.show && (
          <Alert className={`border-2 ${
            emailStatus.status === 'success' 
              ? 'border-green-500 bg-green-50 dark:bg-opacity-10' 
              : emailStatus.status === 'warning'
              ? 'border-amber-500 bg-amber-50 dark:bg-opacity-10'
              : 'border-red-500 bg-red-50 dark:bg-opacity-10'
          }`}>
            <div className="flex items-start gap-3">
              {emailStatus.status === 'success' && (
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              )}
              {emailStatus.status === 'warning' && (
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              )}
              {emailStatus.status === 'error' && (
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <AlertDescription className={`${
                emailStatus.status === 'success'
                  ? 'text-green-800 dark:text-green-200'
                  : emailStatus.status === 'warning'
                  ? 'text-amber-800 dark:text-amber-200'
                  : 'text-red-800 dark:text-red-200'
              }`}>
                {emailStatus.message}
              </AlertDescription>
              <button
                onClick={() => setEmailStatus({ ...emailStatus, show: false })}
                className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
          </Alert>
        )}

        {/* ── Summary badges ── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="size-4" />
            <span>{users.length} total</span>
          </div>
          <Separator orientation="vertical" className="h-4 hidden sm:block" />
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <GraduationCap className="size-4" />
            <span>{studentCount} students</span>
          </div>
          <Separator orientation="vertical" className="h-4 hidden sm:block" />
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <UserCog className="size-4" />
            <span>{instructorCount} instructors</span>
          </div>
        </div>

        {/* ── Pending account requests ── */}
        <Card>
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base font-semibold">Account Requests</CardTitle>
              <Badge variant="secondary">{accountRequests.length} pending</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {isLoadingRequests ? (
              <p className="text-sm text-muted-foreground">Loading account requests...</p>
            ) : accountRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending account requests.</p>
            ) : (
              accountRequests.map((requestItem) => (
                <div key={requestItem.id} className="rounded-lg border p-3 space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium">
                        {requestItem.first_name} {requestItem.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground break-all">{requestItem.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{requestItem.role}</Badge>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>
                      <span className="font-medium text-foreground">PRC Exam:</span>{" "}
                      {requestItem.prc_exam_type || "Not specified"}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Submitted:</span>{" "}
                      {requestItem.created_at
                        ? new Date(requestItem.created_at).toLocaleString()
                        : "Unknown"}
                    </p>
                    {requestItem.request_message ? (
                      <p className="break-words">
                        <span className="font-medium text-foreground">Message:</span>{" "}
                        {requestItem.request_message}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      disabled={requestActionId === requestItem.id}
                      onClick={() => void handleRejectRequest(requestItem)}
                    >
                      Reject
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={requestActionId === requestItem.id}
                      onClick={() => void handleApproveRequest(requestItem)}
                    >
                      {requestActionId === requestItem.id ? "Processing..." : "Approve"}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* ── Search & Filter bar ── */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
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
                <SelectTrigger className="w-full sm:w-40">
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

        <DeleteConfirmationDialog
          handleDelete={handleDelete}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          isDeleting={isDeleting}
        />
      </main>
    </ScrollArea>
  )
}

export default AdminAccountsPage
