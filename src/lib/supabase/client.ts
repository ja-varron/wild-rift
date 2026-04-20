import { supabase } from "./supabase"

// Use the singleton Supabase client from supabase.ts
export const getSupabaseClient = () => supabase
