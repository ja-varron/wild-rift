import { useState, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Mail,
  Phone,
  BookOpen,
  Hash,
  Calendar,
  MapPin,
  Camera,
  Pencil,
  Check,
  X,
} from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────────

type ProfileInfo = {
  name: string
  email: string
  phone: string
  studentId: string
  course: string
  yearLevel: string
  section: string
  dateOfBirth: string
  address: string
  avatar: string
}

// ── Static data ────────────────────────────────────────────────────────────────

const initialProfile: ProfileInfo = {
  name: "Juan Dela Cruz",
  email: "juan.delacruz@vsu.edu.ph",
  phone: "+63 912 345 6789",
  studentId: "2022-0102",
  course: "Bachelor of Science in Nursing",
  yearLevel: "4th Year",
  section: "BSN 4-A",
  dateOfBirth: "March 12, 2001",
  address: "Visayas State University, Baybay City, Leyte",
  avatar: "",
}

const examStats = [
  { label: "Exams Taken", value: "3" },
  { label: "Average Score", value: "80%" },
  { label: "Exams Passed", value: "2" },
  { label: "Feedback Received", value: "2" },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

type InfoRowProps = {
  icon: React.ElementType
  label: string
  value: string
  editing: boolean
  field: keyof ProfileInfo
  onChange: (field: keyof ProfileInfo, value: string) => void
}

function InfoRow({ icon: Icon, label, value, editing, field, onChange }: InfoRowProps) {
  const isEditable =
    field !== "studentId" && field !== "course" && field !== "yearLevel" && field !== "section"

  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex size-8 items-center justify-center rounded-lg bg-muted shrink-0 mt-0.5">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        {editing && isEditable ? (
          <Input
            value={value}
            onChange={(e) => onChange(field, e.target.value)}
            className="h-8 text-sm"
          />
        ) : (
          <p className="text-sm font-medium wrap-break-word">{value}</p>
        )}
      </div>
      {!isEditable && editing && (
        <Badge variant="outline" className="shrink-0 text-xs self-center">
          Fixed
        </Badge>
      )}
    </div>
  )
}

// ── Component ──────────────────────────────────────────────────────────────────

const ProfilePage = () => {
  const [profile, setProfile] = useState<ProfileInfo>(initialProfile)
  const [draft, setDraft] = useState<ProfileInfo>(initialProfile)
  const [editing, setEditing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleEdit() {
    setDraft({ ...profile })
    setEditing(true)
  }

  function handleSave() {
    setProfile({ ...draft })
    setEditing(false)
  }

  function handleCancel() {
    setDraft({ ...profile })
    setEditing(false)
  }

  function handleFieldChange(field: keyof ProfileInfo, value: string) {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setDraft((prev) => ({ ...prev, avatar: result }))
      if (!editing) {
        setProfile((prev) => ({ ...prev, avatar: result }))
      }
    }
    reader.readAsDataURL(file)
  }

  const current = editing ? draft : profile

  return (
    <ScrollArea className="flex-1">
      <main className="p-6 space-y-6 max-w-4xl mx-auto w-full">

        {/* Page title */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">My Profile</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              View and manage your personal information.
            </p>
          </div>
          {!editing ? (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={handleEdit}
            >
              <Pencil className="size-4" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={handleCancel}
              >
                <X className="size-4" />
                Cancel
              </Button>
              <Button
                size="sm"
                className="gap-1.5 bg-teal-700 hover:bg-teal-800"
                onClick={handleSave}
              >
                <Check className="size-4" />
                Save Changes
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* ── Left: Avatar card ── */}
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6 pb-6 flex flex-col items-center gap-4">
                {/* Avatar with upload button */}
                <div className="relative">
                  <Avatar className="size-28 border-2 border-border">
                    <AvatarImage
                      src={current.avatar}
                      alt={current.name}
                    />
                    <AvatarFallback className="text-3xl font-bold bg-teal-50 text-teal-700 dark:bg-teal-950">
                      {initials(current.name)}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full bg-teal-700 text-white shadow-md hover:bg-teal-800 transition-colors"
                    title="Change profile picture"
                  >
                    <Camera className="size-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>

                {/* Name & role */}
                <div className="text-center space-y-1">
                  <p className="font-bold text-lg leading-tight">
                    {current.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {current.section}
                  </p>
                  <Badge className="bg-green-500 hover:bg-green-500">
                    Student
                  </Badge>
                </div>

                <Separator className="w-full" />

                {/* Caption */}
                <p className="text-xs text-muted-foreground text-center">
                  Click the camera icon to upload a new profile photo.
                </p>
              </CardContent>
            </Card>

            {/* Exam stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Exam Summary
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-3">
                  {examStats.map((s) => (
                    <div
                      key={s.label}
                      className="rounded-lg bg-muted/50 p-3 text-center space-y-0.5"
                    >
                      <p className="text-lg font-bold">{s.value}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Right: Info card ── */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Personal Information
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-2 space-y-1">

              {/* Name */}
              <div className="flex items-start gap-3 py-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-muted shrink-0 mt-0.5">
                  <User className="size-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-0.5">Full Name</p>
                  {editing ? (
                    <Input
                      value={draft.name}
                      onChange={(e) => handleFieldChange("name", e.target.value)}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium">{profile.name}</p>
                  )}
                </div>
              </div>

              <Separator />

              <InfoRow
                icon={Mail}
                label="Email Address"
                field="email"
                value={current.email}
                editing={editing}
                onChange={handleFieldChange}
              />
              <Separator />
              <InfoRow
                icon={Phone}
                label="Contact Number"
                field="phone"
                value={current.phone}
                editing={editing}
                onChange={handleFieldChange}
              />
              <Separator />
              <InfoRow
                icon={Hash}
                label="Student ID"
                field="studentId"
                value={current.studentId}
                editing={editing}
                onChange={handleFieldChange}
              />
              <Separator />
              <InfoRow
                icon={BookOpen}
                label="Course / Program"
                field="course"
                value={current.course}
                editing={editing}
                onChange={handleFieldChange}
              />
              <Separator />
              <InfoRow
                icon={BookOpen}
                label="Year Level & Section"
                field="yearLevel"
                value={`${current.yearLevel} — ${current.section}`}
                editing={editing}
                onChange={handleFieldChange}
              />
              <Separator />
              <InfoRow
                icon={Calendar}
                label="Date of Birth"
                field="dateOfBirth"
                value={current.dateOfBirth}
                editing={editing}
                onChange={handleFieldChange}
              />
              <Separator />
              <InfoRow
                icon={MapPin}
                label="Address"
                field="address"
                value={current.address}
                editing={editing}
                onChange={handleFieldChange}
              />

            </CardContent>
          </Card>

        </div>

        {/* ── Account section ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Account Settings
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Username
                </Label>
                <Input
                  defaultValue="juan.delacruz"
                  disabled={!editing}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  New Password
                </Label>
                <Input
                  type="password"
                  placeholder="Leave blank to keep current"
                  disabled={!editing}
                  className="h-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </ScrollArea>
  )
}

export default ProfilePage
