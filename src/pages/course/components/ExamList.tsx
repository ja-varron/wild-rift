import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EllipsisVertical, Plus } from "lucide-react"

const ExamLinks = ({ title, date, time, createdBy, totalPoints }: { title: string, date: string, time: string, createdBy: string, totalPoints: number }) => {
  return (
    <div className="bg-[#F2F2F2] flex flex-row justify-between items-center w-full p-4 rounded-lg">
      <div className="flex flex-col">
        <h3 className="font-semibold text-2xl hover:text-[#2DC653] cursor-pointer">{title}</h3>
        <p className="font-medium text-muted-foreground">{date} | {time}</p>
        <p className="font-medium text-muted-foreground">Created by: {createdBy}</p>
        <p className="font-medium text-muted-foreground">Total Points: {totalPoints}</p>
      </div>

      <Button size="icon-sm" variant="ghost">
        <EllipsisVertical className="text-[#2DC653] hover:text-white hover:bg-[#2DC653]"/>
      </Button>
    </div>
  )
}

const ExamSection = () => {
  return (
    <div className="flex flex-col gap-3 border-2 border-[#E6E6E7] p-2">
      <div className="flex items-center justify-between px-2 gap-2">
        <h2 className="text-xl font-semibold">General Agriculture and Related Topics</h2>
        <Button size="icon-lg" variant="ghost" className="rounded-full">
          <EllipsisVertical className="text-[#2DC653] hover:text-white hover:bg-[#2DC653]" />
        </Button>
      </div>

      <div className="p-4 bg-[#F5F7FA] flex items-center justify-between">
        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Inventore hic iure natus. Repellat dignissimos atque quasi sit odit, id minus maxime ducimus neque officiis placeat doloribus consectetur dicta, laboriosam dolore!</p>
      </div>

      <div className="flex">
        <div className="flex flex-wrap gap-2 p-4">
          <p className="font-semibold">Topics:</p>
          <Badge variant="outline">Engineering Design and Practices</Badge>
          <Badge variant="outline">Soil and Water Engineering</Badge>
          <Badge variant="outline">Farm Machinery and Equipment</Badge>
          <Badge variant="outline">Agricultural Structures and Facilities</Badge>
          <Badge variant="outline">Agricultural Economics and Management</Badge>
          <Badge variant="outline">Agricultural Extension and Rural Sociology</Badge>
          <Badge variant="outline">Agricultural Physics and Surveying</Badge>
        </div>
      </div>

      <div className="flex flex-col gap-2 p-4">
        <ExamLinks title="Pre-Test" date="July 06, 2026" time="2:00PM - 4:00PM" createdBy="John Doe" totalPoints={100} />
        <ExamLinks title="Unit Test" date="July 16, 2026" time="10:00AM - 12:00PM" createdBy="John Doe" totalPoints={100} />
      </div>
    </div>
  )
}

const ExamList = () => {
  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="flex justify-end w-full">
        <Button size="lg" className="bg-[#2DC653] cursor-pointer">
          <Plus />
          Add Exam Section  
        </Button>
      </div>

      <ExamSection />
    </div>
  )
}

export { ExamList }