import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { bank_code, account_number } = body;
  if (!bank_code || !account_number) {
    return new Response(JSON.stringify({ error: "Missing bank_code or account_number" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Call Paystack API
  const paystackRes = await fetch(
    `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const paystackData = await paystackRes.json();

  if (paystackRes.ok && paystackData.status && paystackData.data?.account_name) {
    return new Response(JSON.stringify({ account_name: paystackData.data.account_name }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } else {
    return new Response(JSON.stringify({ error: paystackData.message || "Could not resolve account name" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}); 