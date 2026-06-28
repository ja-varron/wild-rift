import type { Course } from "@/model/course"
import { LicensureExamCourseCard } from "./components/LicensureExamCourseCard"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "@/components/ui/calendar"
import { UpcomingExamCard } from "./components/UpcomingExamCard"

const courses: Course[] = [
  {
    course_id: "1",
    institution_id: "1",
    course_name: "Agriculturist Licensure Examination",
    course_description: "A comprehensive review program designed to prepare aspiring agriculturists for the rigors of the licensure examination. This course covers core subjects, problem-solving strategies, and exam-taking techniques to ensure success.",
    course_profile_url: "/profiles/exam-profile-1.jpg",
    examination_date: new Date().toDateString(),
    created_at: new Date().toDateString(),
    updated_at: new Date().toDateString(),
  },

  {
    course_id: "2",
    institution_id: "1",
    course_name: "Agriculture and Biosystems Engineering Licensure Examination",
    course_description: "A comprehensive review program designed to prepare aspiring agriculturists for the rigors of the licensure examination. This course covers core subjects, problem-solving strategies, and exam-taking techniques to ensure success.",
    course_profile_url: "/profiles/exam-profile-2.jpeg",
    examination_date: new Date().toDateString(),
    created_at: new Date().toDateString(),
    updated_at: new Date().toDateString(),
  },

  {
    course_id: "3",
    institution_id: "1",
    course_name: "Electronics Engineer Licensure Examination",
    course_description: "A comprehensive review program designed to prepare aspiring electronics engineers for the rigors of the licensure examination. This course covers core subjects, problem-solving strategies, and exam-taking techniques to ensure success.",
    course_profile_url: "/profiles/exam-profile-1.jpg",
    examination_date: new Date().toDateString(),
    created_at: new Date().toDateString(),
    updated_at: new Date().toDateString(),
  },

  {
    course_id: "4",
    institution_id: "1",
    course_name: "Electronics Engineer Licensure Examination",
    course_description: "A comprehensive review program designed to prepare aspiring electronics engineers for the rigors of the licensure examination. This course covers core subjects, problem-solving strategies, and exam-taking techniques to ensure success.",
    course_profile_url: "/profiles/exam-profile-2.jpeg",
    examination_date: new Date().toDateString(),
    created_at: new Date().toDateString(),
    updated_at: new Date().toDateString(),
  }
]

const CourseOverview = () => {

  return (
    <>
      <div className="flex flex-col px-4 sm:px-6 lg:px-10 py-3 gap-2">
        <h1 className="text-2xl font-bold">Course Overview</h1>
        <Separator className="bg-[#F2F2F2]" />
      </div>

      <div className="px-4 sm:px-6 lg:px-10 py-3 flex flex-col lg:flex-row gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {courses.map((course) => (
            <LicensureExamCourseCard key={course.course_id} course={course} />
          ))}
        </div>

        {/* Make the calendar reactive to the examination_date */}
        <div className="flex flex-col lg:max-w-[340px] gap-3 sm:justify-center sm:flex-row lg:flex-col ">
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-base">Calendar</h3>
            <div className="flex bg-[#F2F2F2] p-2">
              <Calendar mode="single" className="w-full"/>
            </div>
          </div>

          {/* Upcoming exam schedules */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-base">Upcoming Exam Schedules</h3>
            <div className="flex flex-col gap-2 bg-[#F2F2F2] p-2">
              <UpcomingExamCard />
              <UpcomingExamCard />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default CourseOverview
