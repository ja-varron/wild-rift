import { useMemo } from "react"
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
  GraduationCap,
  UserCog,
  Activity,
} from "lucide-react"
import { SummaryStatsCard } from "@/components/custom/SummaryStatsCard"
import { useFetchUsers } from "@/lib/supabase/authentication/context/use-fetch-users"

// ── Helpers ────────────────────────────────────────────────────────────────────

function roleBadge(role: string) {
  if (role === "Instructor")
    return "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300"
  return "bg-teal-100 text-teal-700 hover:bg-teal-100 dark:bg-teal-950 dark:text-teal-300"
}

// ── Component ──────────────────────────────────────────────────────────────────

const AdminDashboardPage = () => {
  const { users } = useFetchUsers()
  
  // ── Calculate stats from real data ──
  const studentCount = useMemo(() => users.filter(u => u.getUserRole === "Student").length, [users])
  const instructorCount = useMemo(() => users.filter(u => u.getUserRole === "Instructor").length, [users])
  const totalUsers = users.length
  
  const summaryStats = useMemo(() => [
    {
      label: "Total Users",
      value: totalUsers.toString(),
      sub: totalUsers > 0 ? "Active accounts" : "No users yet",
      icon: Users,
    },
    {
      label: "Students",
      value: studentCount.toString(),
      sub: studentCount > 0 ? `${((studentCount / totalUsers) * 100).toFixed(0)}% of total` : "No students",
      icon: GraduationCap,
    },
    {
      label: "Instructors",
      value: instructorCount.toString(),
      sub: instructorCount > 0 ? `${((instructorCount / totalUsers) * 100).toFixed(0)}% of total` : "No instructors",
      icon: UserCog,
    },
    {
      label: "System Status",
      value: "Active",
      sub: "All systems operational",
      icon: Activity,
    },
  ], [totalUsers, studentCount, instructorCount])
  
  // ── Get recent users (last 5) ──
  const recentAccounts = useMemo(() => {
    return users.slice(-5).reverse().map((user) => ({
      id: user.getUserId,
      name: `${user.getFirstName} ${user.getLastName}`,
      role: user.getUserRole,
      date: new Date(user.getDateCreated).toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric", 
        year: "numeric" 
      }),
    }))
  }, [users])

  return (
    <ScrollArea className="flex-1">
      <main className="p-6 space-y-6 max-w-6xl mx-auto w-full">

        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage the VSU Review Center system — accounts and platform overview.
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

          {/* System Information */}
          <Card>
            <CardHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">System Information</CardTitle>
                <Activity className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0">
                <div className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm">Total Accounts</span>
                  <Badge variant="secondary">{totalUsers}</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm">Student Accounts</span>
                  <Badge variant="outline">{studentCount}</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm">Instructor Accounts</span>
                  <Badge variant="outline">{instructorCount}</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm">System Status</span>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:text-green-300">Active</Badge>
                </div>
              </div>
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
              {recentAccounts.length === 0 ? (
                <div className="px-5 py-8 text-center text-muted-foreground text-sm">
                  No accounts created yet
                </div>
              ) : (
                <>
                  {recentAccounts.map((account, idx) => (
                    <div key={account.id}>
                      <div className="flex items-center justify-between px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                            {account.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{account.name}</p>
                            <p className="text-xs text-muted-foreground">{account.date}</p>
                          </div>
                        </div>
                        <Badge className={roleBadge(account.role)} variant="secondary">
                          {account.role}
                        </Badge>
                      </div>
                      {idx < recentAccounts.length - 1 && <Separator />}
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </ScrollArea>
  )
}

export default AdminDashboardPage
