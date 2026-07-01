import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get the access token from cookie or header for backend logout call
    const accessToken = request.cookies.get('accessToken')?.value

    // Call backend logout if token exists
    if (accessToken && accessToken !== 'null' && accessToken !== 'undefined') {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5010/api/v1'
        await fetch(`${apiBase}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        })
      } catch (error) {
        // Log but don't fail - frontend logout should still work
        console.error('Backend logout failed:', error)
      }
    }

    // Create response that redirects to sign-in
    const response = NextResponse.redirect(new URL('/auth/sign-in', request.url))

    // Clear auth-related cookies
    response.cookies.delete('accessToken')
    response.cookies.delete('refreshToken')
    response.cookies.delete('adminId')

    return response
  } catch (error) {
    console.error('Logout error:', error)
    // Fallback: redirect to sign-in anyway
    return NextResponse.redirect(new URL('/auth/sign-in', request.url))
  }
}
