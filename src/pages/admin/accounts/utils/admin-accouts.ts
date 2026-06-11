import { supabase } from "@/lib/supabase/supabase"
import type { UserProfile } from "@/model/user-profile"

/**
 * Generates a random 6-digit examinee ID number that is unique within the institution.
 * Format: XXXXXX eg. 123456
 * @param userProfile The user profile of the admin
 * @returns A unique examinee ID number
 */
export const generateExamineeIDNumber = async (userProfile: UserProfile | null | undefined): Promise<string> => {

  if (!userProfile?.institution_id) {
    throw new Error("Institution ID is required")
  }

  // Get all examinee ID numbers from the same institution
  const { data, error } = await supabase.from("profiles")
    .select("examinee_id_number")
    .eq("institution_id", userProfile.institution_id)
    .not("examinee_id_number", "eq", "N/A")

  if (error) {
    throw error
  }

  // Normalize all existing IDs to strings for safe comparison
  const existingIDs = new Set(
    (data ?? []).map((row) => String(row.examinee_id_number))
  )

  // Keep generating until a unique ID is found
  let newID: string
  do {
    newID = Math.floor(100000 + Math.random() * 900000).toString()
  } while (existingIDs.has(newID))

  return newID
}