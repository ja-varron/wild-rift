import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"


const AdminHeader = ({ activeTab, setActiveTab }: { activeTab: "accounts" | "courses", setActiveTab: (tab: "accounts" | "courses") => void }) => {

  return (
    <div className="flex flex-col justify-between p-5 gap-5">
      <div className="flex flex-col">
        <h1 className="font-semibold text-2xl">Admin Management</h1>
        <p className="text-md text-gray-700">Create and Manage Accounts and Courses</p>
      </div>

      <div className="flex gap-2">
        <Button size="lg" variant={activeTab === "accounts" ? "default" : "outline"} onClick={() => setActiveTab("accounts")}>Accounts</Button>
        <Button size="lg" variant={activeTab === "courses" ? "default" : "outline"} onClick={() => setActiveTab("courses")}>Courses</Button>
      </div>

      <Separator className="w-full h-4 bg-[#F2F2F2]" />
    </div>
  )
}

export { AdminHeader }