import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import nodemailer from "npm:nodemailer";

console.log("Hello from send-exam-updates!");

// Get SMTP credentials from the environment variables
const SMTP_HOST = Deno.env.get("SMTP_HOST") ?? "smtp.example.com";
const SMTP_PORT = Number(Deno.env.get("SMTP_PORT")) || 587;
const SMTP_USER = Deno.env.get("SMTP_USER") ?? "user@example.com";
const SMTP_PASS = Deno.env.get("SMTP_PASS") ?? "password";
const SMTP_FROM = Deno.env.get("SMTP_FROM") ?? "[EMAIL_ADDRESS]";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, studentName, examTitle, score, totalItems, passed } = await req.json();

    if (!email || !studentName || !examTitle || score === undefined || totalItems === undefined) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create a Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const statusText = passed ? "Passed" : "Failed";

    // Send the email
    const info = await transporter.sendMail({
      from: `"Exams Team" <${SMTP_FROM}>`,
      to: email, // list of receivers
      subject: `Exam Result: ${examTitle}`, // Subject line
      text: `Hello ${studentName},\n\nYour exam "${examTitle}" has been checked.\n\nScore: ${score}/${totalItems}\nStatus: ${statusText}\n\nBest regards,\nThe Exams Team`,
      html: `<p>Hello ${studentName},</p><p>Your exam <b>"${examTitle}"</b> has been checked.</p><ul><li><b>Score:</b> ${score} / ${totalItems}</li><li><b>Status:</b> ${statusText}</li></ul><p>Best regards,<br/>The Exams Team</p>`,
    });

    console.log("Message sent: %s", info.messageId);

    return new Response(
      JSON.stringify({ success: true, messageId: info.messageId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
