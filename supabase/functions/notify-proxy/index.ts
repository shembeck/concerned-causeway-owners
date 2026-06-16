import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const NOTIFY_EMAIL = Deno.env.get("NOTIFY_EMAIL") || "info@causewayongullowners.com";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "onboarding@resend.dev";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const body = await req.json();
    const {
      submissionId,
      ownerName1,
      ownerName2,
      units,
      signedDate,
      printedName,
      phone,
      email,
      deedNote,
      signaturePath,
    } = body;

    const ownerLine = ownerName2 ? `${ownerName1} / ${ownerName2}` : ownerName1;
    const unitsText = (units || [])
      .map((u: { unit: string; week: string; schedule: string }) =>
        `Unit ${u.unit}, Week ${u.week}, ${u.schedule}`
      )
      .join("\n");

    let signatureLink = "";
    if (signaturePath && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data } = await supabase.storage
        .from("proxy-signatures")
        .createSignedUrl(signaturePath, 60 * 60 * 24 * 7);
      if (data?.signedUrl) {
        signatureLink = data.signedUrl;
      }
    }

    const text = [
      "New proxy submission received",
      "",
      `Submission ID: ${submissionId}`,
      `Owner(s): ${ownerLine}`,
      `Printed name: ${printedName}`,
      `Date signed: ${signedDate}`,
      `Phone: ${phone}`,
      `Email: ${email}`,
      "",
      "Unit(s):",
      unitsText,
      deedNote ? `\nNote: ${deedNote}` : "",
      signatureLink ? `\nView signature (7-day link): ${signatureLink}` : "",
      "\nView all submissions in the Supabase dashboard.",
    ].join("\n");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [NOTIFY_EMAIL],
        subject: `New Causeway Proxy — ${printedName}`,
        text,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend error: ${err}`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
