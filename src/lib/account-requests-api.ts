export type AccountRequestRole = "Student" | "Instructor"
export type AccountRequestStatus = "pending" | "approved" | "rejected"

export interface AccountRequestRecord {
  id: number
  first_name: string
  middle_name?: string | null
  last_name: string
  email: string
  role: AccountRequestRole
  prc_exam_type: string
  request_message?: string | null
  status: AccountRequestStatus
  review_notes?: string | null
  reviewed_by?: string | null
  reviewed_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface SubmitAccountRequestPayload {
  firstName: string
  middleName?: string
  lastName: string
  email: string
  role: AccountRequestRole
  prcExamType: string
  requestMessage?: string
  appUrl?: string
}

const getBackendUrl = (): string => import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"

export async function submitAccountRequest(payload: SubmitAccountRequestPayload): Promise<AccountRequestRecord> {
  const response = await fetch(`${getBackendUrl()}/api/account-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(result?.error || "Failed to submit account request")
  }

  return result?.request as AccountRequestRecord
}

export async function fetchAccountRequests(status: AccountRequestStatus | "all" = "pending"): Promise<AccountRequestRecord[]> {
  const response = await fetch(`${getBackendUrl()}/api/account-requests?status=${status}`)
  const result = await response.json().catch(() => ({}))

  const errorMessage = String(result?.error || result?.message || "")
  const schemaCacheMissingTable =
    errorMessage.toLowerCase().includes("account_requests")
    && (
      errorMessage.toLowerCase().includes("schema cache")
      || errorMessage.toLowerCase().includes("could not find the table")
      || errorMessage.toLowerCase().includes("does not exist")
    )

  if (schemaCacheMissingTable) {
    // Allow the admin page to render while backend migration is pending.
    return []
  }

  if (!response.ok) {
    throw new Error(errorMessage || "Failed to fetch account requests")
  }

  return Array.isArray(result?.requests) ? (result.requests as AccountRequestRecord[]) : []
}

export async function reviewAccountRequest(
  requestId: number | string,
  status: "approved" | "rejected",
  reviewNotes?: string,
  reviewedBy?: string,
): Promise<AccountRequestRecord> {
  const response = await fetch(`${getBackendUrl()}/api/account-requests/${requestId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status,
      reviewNotes,
      reviewedBy,
    }),
  })

  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(result?.error || "Failed to update account request")
  }

  return result?.request as AccountRequestRecord
}
