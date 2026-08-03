import config from '@payload-config'
import {
  REST_DELETE, REST_GET, REST_OPTIONS, REST_PATCH, REST_PUT,
} from '@payloadcms/next/routes'
import { REST_POST } from '@payloadcms/next/routes'
import { checkRateLimit, getClientIp, LIMITS, rateLimitResponse } from '@/lib/rate-limit'

// Auth-ruter vi rate-limiter (brute force-vern)
const AUTH_PATHS = new Set([
  '/api/members',
  '/api/members/login',
  '/api/members/forgot-password',
  '/api/members/reset-password',
])

const payloadPost = REST_POST(config)

export async function POST(req: Request, ctx: { params: Promise<{ slug: string[] }> }) {
  const { pathname } = new URL(req.url)
  if (AUTH_PATHS.has(pathname)) {
    const ip = getClientIp(req)
    const rl = checkRateLimit(`auth:${ip}`, LIMITS.AUTH)
    if (!rl.ok) return rateLimitResponse('auth', ip, rl.retryAfter!)
  }
  return payloadPost(req, ctx)
}

export const GET     = REST_GET(config)
export const DELETE  = REST_DELETE(config)
export const PATCH   = REST_PATCH(config)
export const PUT     = REST_PUT(config)
export const OPTIONS = REST_OPTIONS(config)
