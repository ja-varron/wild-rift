import { useState } from "react"
import { CourseHeader } from "../components/CourseHeader"
import { Check, ClipboardList, LineChart, User2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ActualAnswerEditor } from "./components/ActualAnswerEditor"
import { AnswerKeyEditor } from "./components/AnswerKeyEditor"

type ExamTab = "actual-answer" | "answer-key" | "student-statistics" | "analysis"

const ExamPage = () => {
  const [activeTab, setActiveTab] = useState<ExamTab>("actual-answer")

  return (
    <>
      {/* Course header */}
      <CourseHeader />

      {/* Exam Information */}
      <div className="px-4 md:px-8 lg:px-10 py-2">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Agriculture 1</h1>
        <h3 className="text-xl md:text-2xl lg:text-3xl font-bold">Pre-Test</h3>
        <h4 className="text-lg md:text-xl lg:text-2xl font-bold">Exam Date: <span className="font-normal">July 06, 2026 • 10:00 AM - 01:00 PM</span></h4>
        <p className="text-sm md:text-base lg:text-lg">100 items • 3 hours</p>
      </div>

      {/* Course navigation tabs */}
      <div className="flex flex-wrap gap-x-2 px-4 md:px-8 lg:px-10 py-2">
        <Button
          variant={activeTab === "actual-answer" ? "default" : "outline"}
          size="lg"
          onClick={() => setActiveTab("actual-answer")}
        >
          <Check />
          Actual Answer
        </Button>
        <Button
          variant={activeTab === "answer-key" ? "default" : "outline"}
          size="lg"
          onClick={() => setActiveTab("answer-key")}
        >
          <ClipboardList />
          Answer Key
        </Button>
        <Button
          variant={activeTab === "student-statistics" ? "default" : "outline"}
          size="lg"
          onClick={() => setActiveTab("student-statistics")}
        >
          <User2Icon />
          Student Statistics
        </Button>
        <Button
          variant={activeTab === "analysis" ? "default" : "outline"}
          size="lg"
          onClick={() => setActiveTab("analysis")}
        >
          <LineChart />
          Analysis
        </Button>
      </div>

      <Separator className="w-full h-2 bg-[#F2F2F2]" />

      {/* Tab content */}
      {activeTab === "actual-answer" && <ActualAnswerEditor />}
      {activeTab === "answer-key" && <AnswerKeyEditor />}
    </>
  )
}

export default ExamPage