import { createClient, FunctionsHttpError } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// supabase-js's default error.message for a failed function call is just
// "Edge Function returned a non-2xx status code" — the actual reason is in
// the response body, which this pulls out for display.
export async function describeFunctionError(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json()
      if (typeof body?.error === "string") return body.error
    } catch {
      // fall through to generic message below
    }
  }
  return error instanceof Error ? error.message : "Unknown error"
}