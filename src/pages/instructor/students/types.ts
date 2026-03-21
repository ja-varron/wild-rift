export type TopicScore = {
  topicId: number
  topicName: string
  score: number
  maxScore: number
}

export type ExamResult = {
  id: number
  examTitle: string
  course: string
  date: string
  score: number
  totalItems: number
  passed: boolean
  topicScores: TopicScore[]
  feedback?: string
}

export type Student = {
  id: number
  examineeNo: string
  name: string
  email: string
  mobileNumber: string
  role: string
  course: string
  yearLevel: string
  dateAdded: string
  examResults: ExamResult[]
}

export type StudentAnalytics = {
  avgScore: number
  passRate: number
  highest: number
  lowest: number
  topicAvgs: { topic: string; avg: number }[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────

export function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function scoreColor(pct: number) {
  return pct >= 75 ? "text-green-600" : "text-red-500"
}

export function getStudentAnalytics(student: Student): StudentAnalytics | null {
  const results = student.examResults
  if (results.length === 0) return null

  const avgScore = Math.round(
    results.reduce((sum, r) => sum + Math.round((r.score / r.totalItems) * 100), 0) / results.length,
  )
  const passRate = Math.round(
    (results.filter((r) => r.passed).length / results.length) * 100,
  )
  const highest = Math.max(...results.map((r) => Math.round((r.score / r.totalItems) * 100)))
  const lowest = Math.min(...results.map((r) => Math.round((r.score / r.totalItems) * 100)))

  const topicMap = new Map<number, { name: string; totalPct: number; count: number }>()
  for (const r of results) {
    for (const ts of r.topicScores) {
      const existing = topicMap.get(ts.topicId)
      const pct = Math.round((ts.score / ts.maxScore) * 100)
      if (existing) {
        existing.totalPct += pct
        existing.count += 1
      } else {
        topicMap.set(ts.topicId, { name: ts.topicName, totalPct: pct, count: 1 })
      }
    }
  }
  const topicAvgs = Array.from(topicMap.values()).map((t) => ({
    topic: t.name,
    avg: Math.round(t.totalPct / t.count),
  }))

  return { avgScore, passRate, highest, lowest, topicAvgs }
}
