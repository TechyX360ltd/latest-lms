import { serve } from 'https://deno.land/std@0.203.0/http/server.ts'
serve((_req) => new Response('Hello from Edge!'))