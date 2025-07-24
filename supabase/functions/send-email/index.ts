import { serve } from "https://deno.land/std/http/server.ts";

function corsResponse(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Content-Type": "application/json"
    }
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return corsResponse("", 204);
  }

  try {
    const { to, subject, html } = await req.json();
    const postmarkToken = Deno.env.get('POSTMARK_TOKEN');
    const fromEmail = Deno.env.get('SMTP_FROM');

    const response = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': postmarkToken,
      },
      body: JSON.stringify({
        From: fromEmail,
        To: to,
        Subject: subject,
        HtmlBody: html,
        MessageStream: 'outbound'
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return corsResponse(JSON.stringify({ success: true }), 200);
    } else {
      return corsResponse(JSON.stringify({ error: data.Message || data }), 500);
    }
  } catch (e) {
    return corsResponse(JSON.stringify({ error: e.message || e.toString() }), 500);
  }
});