import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    // Skapa redirect-svaret FÖRST så att cookies kan sättas direkt på det.
    // cookies() från next/headers flödar inte med i ett explicit NextResponse.redirect().
    const response = NextResponse.redirect(new URL(next, request.url))

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options))
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) console.error('[auth/callback] exchangeCodeForSession fel:', error.message)

    return response
  }

  return NextResponse.redirect(new URL(next, request.url))
}
