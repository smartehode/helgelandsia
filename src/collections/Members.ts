import type { CollectionConfig } from 'payload'
import { isEditor } from '../access'

export const Members: CollectionConfig = {
  slug: 'members',
  labels: { singular: 'Medlem', plural: 'Medlemmer' },
  auth: true, // e-post/passord + sikre httpOnly-cookies (Google m.fl. kobles på senere)
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'approved', 'createdAt'],
    group: 'Medlemmer',
  },
  access: {
    // Hvem som helst kan registrere seg
    create: () => true,
    // Medlemmer slipper ALDRI inn i adminpanelet
    admin: () => false,
    // Medlemmer ser/redigerer kun seg selv; stab ser alle
    read: ({ req: { user } }) => (user?.collection === 'users' ? true : { id: { equals: user?.id } }),
    update: ({ req: { user } }) => (user?.collection === 'users' ? true : { id: { equals: user?.id } }),
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
  ],
}
