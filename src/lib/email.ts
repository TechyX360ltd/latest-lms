export async function sendEmail({ to, subject, html }) {
    const response = await fetch('https://rpexcrwcgdmlfxihdmny.functions.supabase.co/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html }),
    });
  
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send email');
    }
    return await response.json();
  }