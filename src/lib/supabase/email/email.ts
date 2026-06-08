import { supabase, supabaseAdmin } from "../supabase";
import { toast } from "sonner";

export async function sendWelcomeEmail(email: string, password: string) {
  // Send welcome email using the Edge Function
  // We use the service_role key (if available) via headers to avoid strict session 401 issues.
  const functionOptions = supabaseAdmin ? {
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({ email: email, password: password })
  } : {
    body: JSON.stringify({ email: email, password: password })
  };

  const { error: emailError } = await supabase.functions.invoke('send-welcome-email', functionOptions)

  if (emailError) {
    toast.error(`Account created, but failed to send email: ${emailError.message}`)
    console.log("Email failed to send!")
  } else {
    toast.success("Account created and welcome email sent successfully!")
    console.log("Email sent successfully!")
  }
}

/**
 * Send exam updates once the scanner and validation of exam paper is complete
 * 
 */
export async function sendExamUpdate(
  email: string,
  studentName: string,
  examTitle: string,
  score: number,
  totalItems: number,
  passed: boolean
) {
  const functionOptions = supabaseAdmin ? {
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({ email, studentName, examTitle, score, totalItems, passed })
  } : {
    body: JSON.stringify({ email, studentName, examTitle, score, totalItems, passed })
  };

  const { error: emailError } = await supabase.functions.invoke('send-exam-updates', functionOptions)

  if (emailError) {
    toast.error(`Exam updated, but failed to send email: ${emailError.message}`)
    console.log("Exam update email failed to send!")
  } else {
    toast.success("Exam update email sent successfully!")
    console.log("Exam update email sent successfully!")
  }
}