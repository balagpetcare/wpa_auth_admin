import { NextRequest, NextResponse } from 'next/server'

function proxy(request: NextRequest) {
  const response = NextResponse.next()

  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  return response
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/',
}

export default proxy
