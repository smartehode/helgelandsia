export const SITE =
  (process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://helgelandsia.no').replace(/\/$/, '')

/** Gjør en relativ media-URL absolutt. Returnerer undefined hvis ingen URL. */
export const abs = (url: string | null | undefined): string | undefined => {
  if (!url) return undefined
  if (url.startsWith('http')) return url
  return `${SITE}${url.startsWith('/') ? '' : '/'}${url}`
}
