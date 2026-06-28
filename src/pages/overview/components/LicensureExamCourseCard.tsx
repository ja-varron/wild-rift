import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { Course } from "@/model/course"
import { Book } from "lucide-react"

const LicensureExamCourseCard = ({ course }: { course: Course }) => {
  return (
    <Card className="bg-[#F2F2F2] w-full md:max-w-[340px] h-fit cursor-pointer hover:shadow-lg transition-shadow duration-300 hover:border-[#2DC653] hover:border-2">
      <img className="aspect-3/2 w-full object-cover" src={course.course_profile_url} alt="" />

      <div className="p-2 flex flex-col gap-2">
        <div className="flex flex-row items-center gap-2">
          <Book />
          <p className="font-medium text-sm">Course Examination Review</p>
        </div>

        <CardTitle className="font-semibold text-base truncate hover:text-[#2DC653] hover:underline">
          {course.course_name}
        </CardTitle>

        <Separator className="bg-gray-500" />

        <CardDescription>
          Examination Date: {course.examination_date}
        </CardDescription>
      </div>
    </Card>
  )
}

export { LicensureExamCourseCard }