
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Users } from "lucide-react"
import { AccountTable } from "./components/AccountsTable"
import { useState } from "react"

const AdminAccountsPage = () => {
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)

  return (
    <ScrollArea>
      <main className="flex flex-col p-5">
       <div className="flex flex-row items-center justify-between">
         <div className="flex flex-col gap-2">
          <h1 className="font-semibold text-2xl">Accounts Management</h1>
          <h2 className="text-md text-gray-700">List of all registered</h2>
        </div>

        <div>
          <Button
            size="lg"
            onClick={() => setDialogOpen(true)}
          >
            <Users />
            Add Account
          </Button>
        </div>
       </div>

       <AccountTable />
      </main>
    </ScrollArea>
  )
}

export default AdminAccountsPage