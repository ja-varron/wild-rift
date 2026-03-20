import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  ClipboardList,
  BarChart3,
  MessageSquare,
} from "lucide-react"
import type { ExamResult } from "../types"
import { scoreColor } from "../types"

interface ExamAccordionListProps {
  results: ExamResult[]
}

const ExamAccordionList = ({ results }: ExamAccordionListProps) => {
  return (
    <div className="space-y-2">
      <h2 className="text-base font-semibold">Exams</h2>
      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList className="size-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium">No exam records yet</p>
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {results.map((r) => {
            const pct = Math.round((r.score / r.totalItems) * 100)
            return (
              <Card key={r.id} className="overflow-hidden py-0">
                <AccordionItem value={String(r.id)} className="border-0">
                  {/* Trigger row */}
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 [&>svg]:shrink-0">
                    <div className="flex items-center justify-between gap-3 flex-1 min-w-0 mr-2">
                      <div className="min-w-0 text-left">
                        <p className="text-sm font-semibold truncate">{r.examTitle}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {r.course} · {r.date}
                        </p>
                      </div>
                      <Badge
                        variant={r.passed ? "default" : "destructive"}
                        className={r.passed ? "bg-green-500 hover:bg-green-500 shrink-0" : "shrink-0"}
                      >
                        {r.passed ? "Passed" : "Failed"}
                      </Badge>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="pb-0">
                    <Separator />
                    <div className="p-4">
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
                              <p className="text-xl font-bold tabular-nums">{r.score}/{r.totalItems}</p>
                            </div>
                            <div className="rounded-lg bg-muted/50 p-3 text-center space-y-0.5">
                              <p className="text-xs text-muted-foreground">Percentage</p>
                              <p className={`text-xl font-bold tabular-nums ${scoreColor(pct)}`}>{pct}%</p>
                            </div>
                            <div className="rounded-lg bg-muted/50 p-3 text-center space-y-0.5">
                              <p className="text-xs text-muted-foreground">Passing Mark</p>
                              <p className="text-xl font-bold tabular-nums">75%</p>
                            </div>
                          </div>
                        </TabsContent>

                        {/* Analytics */}
                        <TabsContent value="analytics" className="mt-4 space-y-3">
                          <p className="text-xs text-muted-foreground font-medium">Topic Breakdown</p>
                          {r.topicScores.map((ts) => {
                            const tPct = Math.round((ts.score / ts.maxScore) * 100)
                            return (
                              <div key={ts.topicId} className="space-y-1.5">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground truncate">{ts.topicName}</span>
                                  <span className={`font-semibold ${scoreColor(tPct)}`}>
                                    {ts.score}/{ts.maxScore} ({tPct}%)
                                  </span>
                                </div>
                                <div className="relative h-4 rounded bg-muted overflow-hidden">
                                  <div className="absolute inset-y-0 left-[75%] w-px bg-border z-10" />
                                  <div
                                    className={`h-full rounded transition-all ${
                                      tPct >= 75 ? "bg-teal-600" : tPct >= 60 ? "bg-yellow-500" : "bg-red-500"
                                    }`}
                                    style={{ width: `${tPct}%` }}
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </TabsContent>

                        {/* Feedback */}
                        <TabsContent value="feedback" className="mt-4">
                          {r.feedback ? (
                            <div className="flex gap-3">
                              <div className="flex size-8 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950 shrink-0 mt-0.5">
                                <MessageSquare className="size-4 text-teal-700" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs text-muted-foreground mb-1 font-medium">Instructor Feedback</p>
                                <p className="text-sm leading-relaxed">{r.feedback}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                              <MessageSquare className="size-6 text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground">No feedback for this exam yet.</p>
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Card>
            )
          })}
        </Accordion>
      )}
    </div>
  )
}

export default ExamAccordionList
