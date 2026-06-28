import AdminAccountsPage from "./accounts/AdminAccountsPage"
import { AdminHeader } from "./components/AdminHeader"
import { useState } from "react"

type AdminTab = "accounts" | "courses"

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>("accounts")

  return (
    <>
      <AdminHeader activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === "accounts" && <AdminAccountsPage />}
      {/* {activeTab === "courses" && <AdminLicensureExamsPage />} */}
    </>
  )
}

export default AdminPage