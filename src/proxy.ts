import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          // Sätt uppdaterade cookies på request-objektet så att Server Components
          // ser dem via cookies() från next/headers (viktig för token-refresh).
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          // Sätt även på response så att webbläsaren får de nya cookies.
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const skyddadeRoutes = ['/dashboard', '/uppgift', '/admin', '/join']
  const skyddad = skyddadeRoutes.some(r => request.nextUrl.pathname.startsWith(r))

  if (!user && skyddad) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // VIKTIGT: returnera alltid supabaseResponse (inte ett nytt NextResponse.next())
  // så att de uppdaterade cookie-headrarna följer med.
  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/uppgift/:path*', '/admin/:path*', '/admin', '/join']
}
