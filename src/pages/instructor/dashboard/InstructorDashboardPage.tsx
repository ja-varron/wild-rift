import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  TooltipProvider,
} from "@/components/ui/tooltip"
import {
  ClipboardList,
  Users,
  Calendar,
  Clock,
  MapPin,
  TrendingUp,
  BookOpen,
  Activity,
} from "lucide-react"
import { SummaryStatsCard } from "@/components/custom/SummaryStatsCard"

// ── Static data ────────────────────────────────────────────────────────────────

const summaryStats = [
  {
    label: "Total Exams",
    value: "12",
    sub: "+2 this month",
    icon: ClipboardList,
  },
  {
    label: "Students Enrolled",
    value: "156",
    sub: "+14 new",
    icon: Users,
  },
  {
    label: "Avg. Score",
    value: "72.4%",
    sub: "+3.1% vs last exam",
    icon: TrendingUp,
  },
]

const upcomingExams = [
  {
    id: 1,
    title: "Nursing Board Mock Exam 4",
    date: "Mar 5, 2026",
    time: "9:00 AM – 12:00 PM",
    room: "Room 301, VSU Main Bldg",
    students: 48,
    topics: ["Fundamentals of Nursing", "Pharmacology", "Medical-Surgical Nursing"],
    daysLeft: 8,
  },
  {
    id: 2,
    title: "Engineering Licensure Review 2",
    date: "Mar 10, 2026",
    time: "1:00 PM – 4:00 PM",
    room: "Room 102, Engineering Bldg",
    students: 35,
    topics: ["Mathematics", "General Engineering", "Technical Sciences"],
    daysLeft: 13,
  },
  {
    id: 3,
    title: "Education Board Mock Exam 2",
    date: "Mar 18, 2026",
    time: "8:00 AM – 11:00 AM",
    room: "Auditorium A, VSU Main Bldg",
    students: 62,
    topics: ["General Education", "Professional Education", "Field of Specialization"],
    daysLeft: 21,
  },
]

const recentExams = [
  {
    id: 1,
    title: "Nursing Board Mock Exam 3",
    date: "Feb 15, 2026",
    students: 42,
    status: "Graded",
  },
  {
    id: 2,
    title: "Engineering Licensure Practice",
    date: "Feb 12, 2026",
    students: 38,
    status: "Graded",
  },
  {
    id: 3,
    title: "Education Board Review",
    date: "Feb 10, 2026",
    students: 51,
    status: "Pending",
  },
  {
    id: 4,
    title: "Accountancy Mock Board Exam",
    date: "Feb 8, 2026",
    students: 29,
    status: "Graded",
  },
]

const recentActivity = [
  {
    id: 1,
    description: "Scanned 42 papers for Nursing Board Mock Exam 3",
    time: "2 hours ago",
  },
  {
    id: 2,
    description: "Published results for Engineering Licensure Practice",
    time: "Yesterday",
  },
  {
    id: 3,
    description: "Sent feedback to 15 students",
    time: "2 days ago",
  },
  {
    id: 4,
    description: "Created new exam: Education Board Review",
    time: "3 days ago",
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function daysLabel(days: number) {
  if (days <= 7)
    return { label: `In ${days} days`, className: "bg-teal-700 text-white" }
  if (days <= 14)
    return { label: `In ${days} days`, className: "bg-teal-700 text-white" }
  return { label: `In ${days} days`, className: "bg-muted text-muted-foreground" }
}

function statusVariant(status: string) {
  if (status === "Graded")
    return "bg-teal-700 text-white hover:bg-teal-700"
  return "bg-muted text-muted-foreground hover:bg-muted"
}

// ── Component ──────────────────────────────────────────────────────────────────

const InstructorDashboardPage = () => {
  return (
    <SidebarProvider>
      <TooltipProvider>
        <div className="flex min-h-screen w-full bg-background">
          {/* ── Main content ── */}
          <SidebarInset className="flex flex-col flex-1 min-w-0">

            {/* Page body */}
            <ScrollArea className="flex-1">
              <main className="p-6 space-y-6 max-w-6xl mx-auto w-full">

                {/* Page title */}
                <div>
                  <h1 className="text-2xl font-bold">Dashboard</h1>
                  <p className="text-muted-foreground text-sm mt-0.5">
                    Welcome back, Dr. Santos. Here is an overview of your exam center.
                  </p>
                </div>

                {/* ── Summary stat cards ── */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {summaryStats.map((stat) => (
                    <SummaryStatsCard key={stat.label} stats={stat} />
                  ))}
                </div>

                {/* ── Upcoming Exams ── */}
                <Card>
                  <CardHeader className="border-b pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold">Upcoming Exams</CardTitle>
                      <Badge variant="secondary">{upcomingExams.length} scheduled</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {upcomingExams.map((exam, idx) => {
                      const { label, className: badgeCls } = daysLabel(exam.daysLeft)
                      return (
                        <div key={exam.id}>
                          <div className="px-5 py-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-sm">{exam.title}</p>
                              <span
                                className={`shrink-0 rounded-full px-3 py-0.5 text-xs font-medium ${badgeCls}`}
                              >
                                {label}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="size-3 shrink-0" /> {exam.date}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="size-3 shrink-0" /> {exam.time}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <MapPin className="size-3 shrink-0" /> {exam.room}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Users className="size-3 shrink-0" /> {exam.students} students enrolled
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <BookOpen className="size-3 shrink-0" /> Topics:
                              </span>
                              {exam.topics.map((t) => (
                                <Badge key={t} variant="outline" className="text-xs font-normal">
                                  {t}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          {idx < upcomingExams.length - 1 && <Separator />}
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>

                {/* ── Recent Exams + Recent Activity ── */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                  {/* Recent Exams */}
                  <Card className="lg:col-span-3">
                    <CardHeader className="border-b pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold">Recent Exams</CardTitle>
                        <button className="text-sm text-teal-700 hover:underline font-medium">
                          View all
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {recentExams.map((exam, idx) => (
                        <div key={exam.id}>
                          <div className="flex items-center justify-between px-5 py-3.5 gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{exam.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {exam.date} · {exam.students} students
                              </p>
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-3 py-0.5 text-xs font-medium ${statusVariant(exam.status)}`}
                            >
                              {exam.status}
                            </span>
                          </div>
                          {idx < recentExams.length - 1 && <Separator />}
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card className="lg:col-span-2">
                    <CardHeader className="border-b pb-4">
                      <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      {recentActivity.map((item) => (
                        <div key={item.id} className="flex gap-3">
                          <div className="flex size-7 items-center justify-center rounded-full bg-muted shrink-0 mt-0.5">
                            <Activity className="size-3.5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <p className="text-sm leading-snug">{item.description}</p>
                            <p className="text-xs text-muted-foreground">{item.time}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

              </main>
            </ScrollArea>
          </SidebarInset>
        </div>
      </TooltipProvider>
    </SidebarProvider>
  )
}

export default InstructorDashboardPage
