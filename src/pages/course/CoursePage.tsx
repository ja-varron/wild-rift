import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClipboardList, LineChart, User } from "lucide-react"
import { CourseHeader } from "./components/CourseHeader"
import { ExamList } from "./components/ExamList"

const CoursePage = () => {
  return (
    <>
      {/* Course header */}
      <CourseHeader />

      {/* Exam Navigation tabs */}
      <div className="px-4 md:px-8 lg:px-10 py-2">
        <Tabs defaultValue="exams" className="w-full">
          <TabsList>
            <TabsTrigger value="exams" className="gap-1.5">
              <ClipboardList className="mr-2 h-4 w-4" />
              Exams
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-1.5">
              <User className="mr-2 h-4 w-4" />
              Students
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5">
              <LineChart className="mr-2 h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <Separator className="w-full h-2 bg-[#F2F2F2] border-t-2" />

          {/* Exam Content */}
          <TabsContent value="exams" >
            <ExamList />
          </TabsContent>

          {/* Student Content */}
          <TabsContent value="students">
            
          </TabsContent>

          {/* Analytics Content */}
          <TabsContent value="analytics">
            
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}

export default CoursePage