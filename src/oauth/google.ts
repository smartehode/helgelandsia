import { OAuth2Plugin } from 'payload-oauth2'
import type { PayloadRequest } from 'payload'

const serverURL = process.env.DOMAIN ? `https://${process.env.DOMAIN}` : 'http://localhost:3000'

export const googleOAuth = OAuth2Plugin({
  enabled: true,
  strategyName: 'google',
  useEmailAsIdentity: true,
  serverURL,
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  authorizePath: '/oauth/google',
  callbackPath: '/oauth/google/callback',
  authCollection: 'members',
  onUserNotFoundBehavior: 'create',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  scopes: [
    'openid',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],
  providerAuthorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  getUserInfo: async (accessToken: string, _req: PayloadRequest) => {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const u = await res.json()
    return { email: u.email, sub: u.sub }
  },
  successRedirect: () => '/innlogget',
  failureRedirect: (req: PayloadRequest, err: unknown) => {
    req.payload.logger.error(err)
    return '/logg-inn?feil=google'
  },
})
