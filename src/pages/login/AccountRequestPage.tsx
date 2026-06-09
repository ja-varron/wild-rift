import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { fetchActiveLicensureExamNames } from "@/lib/licensure-exams-api"
import {
  type AccountRequestRole,
  submitAccountRequest,
} from "@/lib/account-requests-api"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const AccountRequestPage = () => {
  const [licensureExams, setLicensureExams] = useState<string[]>([])
  const [isLoadingExams, setIsLoadingExams] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)

  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    role: "Student" as AccountRequestRole,
    prcExamType: "",
    requestMessage: "",
  })

  useEffect(() => {
    const loadLicensureExams = async () => {
      try {
        const exams = await fetchActiveLicensureExamNames()
        setLicensureExams(exams)
        if (exams.length > 0) {
          setForm((prev) => ({ ...prev, prcExamType: prev.prcExamType || exams[0] }))
        }
      } catch (error) {
        console.error("Failed to load PRC exams:", error)
        toast.warning("Could not load PRC exam options. Please enter it manually.")
      } finally {
        setIsLoadingExams(false)
      }
    }

    void loadLicensureExams()
  }, [])

  const canSubmit = useMemo(() => {
    return (
      form.firstName.trim().length > 0
      && form.lastName.trim().length > 0
      && form.email.trim().length > 0
      && form.prcExamType.trim().length > 0
    )
  }, [form])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!canSubmit) {
      toast.error("Please fill in all required fields.")
      return
    }

    if (!EMAIL_REGEX.test(form.email.trim())) {
      toast.error("Please provide a valid email address.")
      return
    }

    setIsSubmitting(true)
    try {
      await submitAccountRequest({
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        role: form.role,
        prcExamType: form.prcExamType.trim(),
        requestMessage: form.requestMessage.trim(),
        appUrl: window.location.origin,
      })

      setSubmittedEmail(form.email.trim())
      setForm((prev) => ({
        ...prev,
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        requestMessage: "",
      }))

      toast.success("Account request submitted. Please wait for admin approval.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit account request"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-teal-50 dark:bg-background min-h-svh w-full p-6 md:p-10">
      <div className="mx-auto w-full max-w-xl">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Request an Account</CardTitle>
            <CardDescription>
              Submit your details and an administrator will review your request.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submittedEmail && (
              <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                Request submitted for <strong>{submittedEmail}</strong>. You will be notified once approved.
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="request-first-name">First Name *</Label>
                  <Input
                    id="request-first-name"
                    value={form.firstName}
                    onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="request-middle-name">Middle Name</Label>
                  <Input
                    id="request-middle-name"
                    value={form.middleName}
                    onChange={(e) => setForm((prev) => ({ ...prev, middleName: e.target.value }))}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="request-last-name">Last Name *</Label>
                <Input
                  id="request-last-name"
                  value={form.lastName}
                  onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="request-email">Email *</Label>
                <Input
                  id="request-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Requested Role *</Label>
                  <Select
                    value={form.role}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, role: value as AccountRequestRole }))}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Student">Student</SelectItem>
                      <SelectItem value="Instructor">Instructor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>PRC Licensure Exam *</Label>
                  {licensureExams.length > 0 ? (
                    <Select
                      value={form.prcExamType}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, prcExamType: value }))}
                      disabled={isSubmitting || isLoadingExams}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an exam" />
                      </SelectTrigger>
                      <SelectContent>
                        {licensureExams.map((exam) => (
                          <SelectItem key={exam} value={exam}>{exam}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder="Enter PRC Licensure Exam"
                      value={form.prcExamType}
                      onChange={(e) => setForm((prev) => ({ ...prev, prcExamType: e.target.value }))}
                      disabled={isSubmitting}
                    />
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="request-message">Message (optional)</Label>
                <Textarea
                  id="request-message"
                  placeholder="Tell the admin anything relevant about your account request."
                  value={form.requestMessage}
                  onChange={(e) => setForm((prev) => ({ ...prev, requestMessage: e.target.value }))}
                  disabled={isSubmitting}
                  rows={4}
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Link className="text-sm text-teal-700 hover:underline" to="/login">
                  Back to login
                </Link>
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AccountRequestPage
