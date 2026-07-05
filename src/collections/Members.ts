import type { CollectionConfig } from 'payload'
import { isEditor } from '../access'
import { verifyEmailHtml, forgotPasswordHtml } from '../lib/email/templates'

export const Members: CollectionConfig = {
  slug: 'members',
  labels: { singular: 'Medlem', plural: 'Medlemmer' },
  auth: {
    tokenExpiration: 7 * 24 * 3600,
    verify: {
      generateEmailHTML: ({ token }: any) => verifyEmailHtml(token),
      generateEmailSubject: () => 'Velkommen til Helgelandsia — bekreft e-posten din',
    },
    forgotPassword: {
      generateEmailHTML: ({ token }: any) => forgotPasswordHtml(token),
      generateEmailSubject: () => 'Tilbakestill passordet ditt på Helgelandsia',
    },
  },
  hooks: {
    beforeChange: [
      ({ data, operation }: any) => {
        // Google OAuth-brukere (har sub-felt) er allerede verifisert av Google
        if (operation === 'create' && data.sub) {
          return { ...data, _verified: true }
        }
        return data
      },
    ],
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'approved', 'createdAt'],
    group: 'Medlemmer',
  },
  access: {
    create: () => true,
    admin: () => false,
    read: ({ req: { user } }) => {
      if (!user) return false
      return user.collection === 'users' ? true : { id: { equals: user.id } }
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      return user.collection === 'users' ? true : { id: { equals: user.id } }
    },
    delete: ({ req: { user } }) => user?.collection === 'users',
  },
  fields: [
    { name: 'name', type: 'text', label: 'Navn' },
    { name: 'avatar', type: 'upload', relationTo: 'media' },
    { name: 'bio', type: 'textarea', label: 'Om meg' },
    {
      name: 'memberType', type: 'select', defaultValue: 'person', label: 'Type',
      options: [{ label: 'Privatperson', value: 'person' }, { label: 'Bedrift/organisasjon', value: 'org' }],
    },
    {
      name: 'approved', type: 'checkbox', defaultValue: false, label: 'Godkjent bidragsyter',
      admin: { description: 'Hukes av av stab.' },
      access: { update: isEditor },
    },
    {
      name: 'anbudsvarsling', type: 'checkbox', defaultValue: true, label: 'Anbudsvarsling',
      admin: { description: 'Motta e-post når nye offentlige anbud kan passe for bedriften din.' },
    },
  ],
}
