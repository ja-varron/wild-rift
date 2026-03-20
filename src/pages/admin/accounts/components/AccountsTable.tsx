import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react"
import type { UserProfile } from "@/model/user-profile"

const PAGE_SIZE = 10

function roleBadgeClass(role: string) {
  if (role === "Instructor")
    return "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300"
  return "bg-teal-100 text-teal-700 hover:bg-teal-100 dark:bg-teal-950 dark:text-teal-300"
}

type AccountTableProps = {
  users: UserProfile[]
  onEdit: (account: UserProfile) => void
  onDelete: (userId: string) => void
}

const AccountTable = ({ users, onEdit, onDelete }: AccountTableProps) => {
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE))
  // Clamp page to valid range without an effect (avoids cascade renders)
  const safePage = Math.min(Math.max(1, page), totalPages)
  const paginated = users.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Accounts</CardTitle>
          <Badge variant="secondary">{users.length} result{users.length !== 1 ? "s" : ""}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Date Created</TableHead>
              <TableHead className="text-right pr-5">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No accounts found.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((account) => (
                <TableRow key={account.getUserId}>
                  <TableCell className="pl-5 font-medium">{account.fullName}</TableCell>
                  <TableCell className="text-muted-foreground">{account.getEmailAddress}</TableCell>
                  <TableCell>
                    <Badge className={roleBadgeClass(account.getUserRole)} variant="secondary">
                      {account.getUserRole}
                    </Badge>
                  </TableCell>
                  {/* <TableCell>{account.getExamReview || "—"}</TableCell> */}
                  <TableCell className="text-muted-foreground">{account.getDateCreated}</TableCell>
                  <TableCell className="text-right pr-5">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => onEdit(account)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => onDelete(account.getUserId)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <>
            <Separator />
            <div className="flex items-center justify-between px-5 py-3">
              <p className="text-sm text-muted-foreground">
                Page {safePage} of {totalPages} · {users.length} account{users.length !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export { AccountTable }