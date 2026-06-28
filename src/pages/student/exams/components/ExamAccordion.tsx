import { Accordion, AccordionContent, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { scoreColor, type ExamResult } from "@/pages/instructor/students/types"
import { BarChart3, ClipboardList, Clock, MessageSquare } from "lucide-react"

const ExamAccordion = ({ exam_results }: { exam_results: ExamResult }) => {
  const pct = exam_results.attempted && exam_results.totalItems > 0
    ? Math.round((exam_results.score / exam_results.totalItems) * 100)
    : 0
  
  return (
    <Accordion type="multiple" className="space-y-2">
      
      <Card key={exam_results.id} className="overflow-hidden py-0">
        {/* Trigger row */}
        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 [&>svg]:shrink-0">
          <div className="flex item-center justify-between gap-3 flex-1 min-w-0 mr-2">
            <div className="min-w-0 text-left">
              <p className="text-sm font-semibold truncate">{exam_results.examTitle}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {exam_results.course} · {exam_results.date}
              </p>
            </div>
            {exam_results.attempted ? (
              <Badge
                variant={exam_results.passed ? "default" : "destructive"}
                className={exam_results.passed ? "bg-green-500 hover:bg-green-500 shrink-0" : "shrink-0"}
              >
                {exam_results.passed ? "Passed" : "Failed"}
              </Badge>
            ) : (
              <Badge variant="outline" className="shrink-0 text-muted-foreground gap-1">
                <Clock className="size-3" />
                Pending
              </Badge>
            )}
          </div>

        </AccordionTrigger>

        <AccordionContent className="pb-0">
          <Separator />
          <div className="p-4">
            {!exam_results.attempted ? (
              /* ── Unattempted state ── */
              <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                <Clock className="size-6 text-muted-foreground" />
                <p className="text-sm font-medium">Not yet scanned</p>
                <p className="text-xs text-muted-foreground">
                  Score will appear after the exam paper is scanned and submitted.
                </p>
              </div>
            ) : (
              /* ── Attempted state: tabs ── */
              <Tabs defaultValue="result">
                <TabsList className="h-8">
                  <TabsTrigger value="result" className="gap-1 text-xs h-7">
                    <ClipboardList className="size-3" /> Result
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="gap-1 text-xs h-7">
                    <BarChart3 className="size-3" /> Analytics
                  </TabsTrigger>
                  <TabsTrigger value="feedback" className="gap-1 text-xs h-7">
                    <MessageSquare className="size-3" /> Feedback
                  </TabsTrigger>
                </TabsList>

                {/* Result */}
                <TabsContent value="result" className="mt-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-lg bg-muted/50 p-3 text-center space-y-0.5">
                      <p className="text-xs text-muted-foreground">Score</p>
                      <p className="text-xl font-bold tabular-nums">
                        {exam_results.score}/{exam_results.totalItems}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-center space-y-0.5">
                      <p className="text-xs text-muted-foreground">Percentage</p>
                      <p className={`text-xl font-bold tabular-nums ${scoreColor(pct)}`}>
                        {pct}%
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-center space-y-0.5">
                      <p className="text-xs text-muted-foreground">Passing Mark</p>
                      <p className="text-xl font-bold tabular-nums">{exam_results.passingRate}%</p>
                    </div>
                  </div>
                </TabsContent>

                {/* Analytics */}
                <TabsContent value="analytics" className="mt-4 space-y-3">
                  <p className="text-xs text-muted-foreground font-medium">Topic Breakdown</p>
                  {exam_results.topicScores.length === 0 ? (
                    <div className="rounded-lg border border-dashed px-3 py-2.5 text-sm text-muted-foreground">
                      No topic breakdown available for this exam.
                    </div>
                  ) : (
                    exam_results.topicScores.map((ts) => {
                      const tPct = ts.maxScore > 0 ? Math.round((ts.score / ts.maxScore) * 100) : 0
                      return (
                        <div key={ts.topicId} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground truncate">{ts.topicName}</span>
                            <span className={`font-semibold ${scoreColor(tPct)}`}>
                              {ts.score}/{ts.maxScore} ({tPct}%)
                            </span>
                          </div>
                          <div className="relative h-4 rounded bg-muted overflow-hidden">
                            <div
                              className="absolute inset-y-0 w-px bg-border z-10"
                              style={{ left: `${exam_results.passingRate}%` }}
                            />
                            <div
                              className={`h-full rounded transition-all ${
                                tPct >= exam_results.passingRate
                                  ? "bg-teal-600"
                                  : tPct >= 60
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${tPct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })
                  )}
                </TabsContent>

                {/* Feedback */}
                <TabsContent value="feedback" className="mt-4">
                  {exam_results.feedback ? (
                    <div className="flex gap-3">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950 shrink-0 mt-0.5">
                        <MessageSquare className="size-4 text-teal-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">
                          Instructor Feedback
                        </p>
                        <p className="text-sm leading-relaxed">{exam_results.feedback}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <MessageSquare className="size-6 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No feedback for this exam yet.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </AccordionContent>
      </Card>
    </Accordion>
  )
}

export { ExamAccordion }