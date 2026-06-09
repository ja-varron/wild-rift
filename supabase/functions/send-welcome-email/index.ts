import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import nodemailer from "npm:nodemailer";

console.log("Hello from send-welcome-email!");

// Get SMTP credentials from the environment variables
const SMTP_HOST = Deno.env.get("SMTP_HOST") ?? "smtp.example.com";
const SMTP_PORT = Number(Deno.env.get("SMTP_PORT")) || 587;
const SMTP_USER = Deno.env.get("SMTP_USER") ?? "user@example.com";
const SMTP_PASS = Deno.env.get("SMTP_PASS") ?? "password";
const SMTP_FROM = Deno.env.get("SMTP_FROM") ?? "no-reply@example.com";

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
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Missing email or password" }), {
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

    // Send the email
    const info = await transporter.sendMail({
      from: `"Support" <${SMTP_FROM}>`,
      to: email, // list of receivers
      subject: "Your Account Details", // Subject line
      text: `Hello,\n\nYour account has been created successfully!\n\nEmail: ${email}\nPassword: ${password}\n\nPlease keep these credentials safe.\n\nBest regards,\nThe Team`,
      html: `<p>Hello,</p><p>Your account has been created successfully!</p><ul><li><b>Email:</b> ${email}</li><li><b>Password:</b> ${password}</li></ul><p>Please keep these credentials safe.</p><p>Best regards,<br/>The Team</p>`,
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
