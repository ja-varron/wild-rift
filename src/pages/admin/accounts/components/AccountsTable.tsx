import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useIsMobile } from "@/hooks/use-mobile"
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
  const isMobile = useIsMobile()

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
        {isMobile ? (
          <div className="space-y-3 p-4">
            {paginated.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No accounts found.</p>
            ) : (
              paginated.map((account) => (
                <div key={account.getUserId} className="rounded-lg border p-3 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium leading-tight">{account.fullName}</p>
                      <p className="text-xs text-muted-foreground break-all mt-1">{account.getEmailAddress}</p>
                    </div>
                    <Badge className={roleBadgeClass(account.getUserRole)} variant="secondary">
                      {account.getUserRole}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">PRC Exam:</span> {account.getPrcExamType ?? "Not set"}
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Date Created:</span> {account.getDateCreated}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => onEdit(account)}
                    >
                      <Pencil className="size-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-destructive hover:text-destructive"
                      onClick={() => onDelete(account.getUserId)}
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>PRC Exam</TableHead>
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
                    <TableCell className="text-muted-foreground text-sm">
                      {account.getPrcExamType ?? "Not set"}
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
        )}

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