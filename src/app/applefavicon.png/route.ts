import { NextResponse } from 'next/server'

export function GET(request: Request) {
  const dest = new URL('/apple-icon.png', request.url)
  return NextResponse.redirect(dest, { status: 301 })
}
