import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Users,
  BookOpen,
  GraduationCap,
  UserCog,
  Activity,
  UserPlus,
  FolderPlus,
} from "lucide-react"
import { SummaryStatsCard } from "@/components/custom/SummaryStatsCard"

// ── Static data ────────────────────────────────────────────────────────────────

const summaryStats = [
  {
    label: "Total Users",
    value: "182",
    sub: "+18 this month",
    icon: Users,
  },
  {
    label: "Students",
    value: "156",
    sub: "+14 new",
    icon: GraduationCap,
  },
  {
    label: "Instructors",
    value: "26",
    sub: "+4 new",
    icon: UserCog,
  },
  {
    label: "Courses",
    value: "8",
    sub: "24 subjects",
    icon: BookOpen,
  },
]

const recentActivity = [
  {
    id: 1,
    description: "Created student account for Maria Santos",
    type: "account",
    time: "1 hour ago",
  },
  {
    id: 2,
    description: "Added new course: BS Civil Engineering Review",
    type: "course",
    time: "3 hours ago",
  },
  {
    id: 3,
    description: "Created instructor account for Dr. Reyes",
    type: "account",
    time: "Yesterday",
  },
  {
    id: 4,
    description: "Updated subjects for BSCS Licensure Review",
    type: "course",
    time: "Yesterday",
  },
  {
    id: 5,
    description: "Created 12 student accounts via bulk import",
    type: "account",
    time: "2 days ago",
  },
  {
    id: 6,
    description: "Added topic 'Pharmacology' to Nursing Review",
    type: "course",
    time: "3 days ago",
  },
]

const recentAccounts = [
  { id: 1, name: "Maria Santos", role: "Student", course: "BSCS", date: "Mar 3, 2026" },
  { id: 2, name: "Dr. Ana Reyes", role: "Instructor", course: "—", date: "Mar 2, 2026" },
  { id: 3, name: "Carlos Tan", role: "Student", course: "BSN", date: "Mar 1, 2026" },
  { id: 4, name: "Grace Lim", role: "Student", course: "BSIT", date: "Feb 28, 2026" },
  { id: 5, name: "Ben Rivera", role: "Student", course: "BSCS", date: "Feb 27, 2026" },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function activityIcon(type: string) {
  if (type === "account") return UserPlus
  return FolderPlus
}

function roleBadge(role: string) {
  if (role === "Instructor")
    return "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300"
  return "bg-teal-100 text-teal-700 hover:bg-teal-100 dark:bg-teal-950 dark:text-teal-300"
}

// ── Component ──────────────────────────────────────────────────────────────────

const AdminDashboardPage = () => {
  return (
    <ScrollArea className="flex-1">
      <main className="p-6 space-y-6 max-w-6xl mx-auto w-full">

        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage the VSU Review Center system — accounts, courses, and platform overview.
          </p>
        </div>

        {/* ── Summary stat cards ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {summaryStats.map((stat) => (
            <SummaryStatsCard key={stat.label} stats={stat} />
          ))}
        </div>

        {/* ── Two-column section ── */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Recent Activity */}
          <Card>
            <CardHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                <Activity className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentActivity.map((item, idx) => {
                const Icon = activityIcon(item.type)
                return (
                  <div key={item.id}>
                    <div className="flex items-start gap-3 px-5 py-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted mt-0.5">
                        <Icon className="size-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{item.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                      </div>
                    </div>
                    {idx < recentActivity.length - 1 && <Separator />}
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Recently Created Accounts */}
          <Card>
            <CardHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Recently Created Accounts</CardTitle>
                <Badge variant="secondary">{recentAccounts.length} recent</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentAccounts.map((account, idx) => (
                <div key={account.id}>
                  <div className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {account.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{account.name}</p>
                        <p className="text-xs text-muted-foreground">{account.course} · {account.date}</p>
                      </div>
                    </div>
                    <Badge className={roleBadge(account.role)} variant="secondary">
                      {account.role}
                    </Badge>
                  </div>
                  {idx < recentAccounts.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </ScrollArea>
  )
}

export default AdminDashboardPage
