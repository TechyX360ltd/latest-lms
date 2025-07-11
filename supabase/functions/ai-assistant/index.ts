// Supabase Edge Function: AI Assistant (OpenAI)
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  let body: { message?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const userMessage = body.message;
  if (!userMessage) {
    return new Response(JSON.stringify({ error: 'Missing message' }), { status: 400 });
  }

  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: 'Missing OpenAI API key' }), { status: 500 });
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant for an LMS platform.' },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 256,
        temperature: 0.7,
      }),
    });
    const openaiData = await openaiRes.json();
    const reply = openaiData.choices?.[0]?.message?.content?.trim() || 'Sorry, I could not generate a response.';
    return new Response(JSON.stringify({ reply }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to contact OpenAI' }), { status: 500 });
  }
}); 