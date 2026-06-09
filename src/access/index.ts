import type { Access, FieldAccess } from 'payload'

// Hjelpere for rollebasert tilgangsstyring.
// User-typen har feltet `roles: ('admin' | 'editor' | 'author')[]`

export const isAdmin: Access = ({ req: { user } }) =>
  Boolean(user?.roles?.includes('admin'))

export const isAdminField: FieldAccess = ({ req: { user } }) =>
  Boolean(user?.roles?.includes('admin'))

// Redaktører og admin kan publisere/endre alt innhold
export const isEditor: Access = ({ req: { user } }) =>
  Boolean(user?.roles?.some((r) => r === 'admin' || r === 'editor'))

// Innlogget bruker (alle roller)
export const isLoggedIn: Access = ({ req: { user } }) => Boolean(user)

// Offentlig lesing: kun publisert innhold for ikke-innloggede.
// Innloggede redaktører ser også utkast (for forhåndsvisning).
export const isPublishedOrLoggedIn: Access = ({ req: { user } }) => {
  if (user) return true
  return {
    _status: { equals: 'published' },
  }
}
