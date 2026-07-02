import type { CollectionConfig } from 'payload'
import { isAdmin, isAdminField } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true, // Aktiverer innlogging, JWT, passord-reset osv.
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'roles'],
    group: 'Administrasjon',
  },
  access: {
    // Bare admin kan opprette/slette/lese andre brukere
    create: isAdmin,
    delete: isAdmin,
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.roles?.includes('admin')) return true
      return { id: { equals: user.id } }
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.roles?.includes('admin')) return true
      return { id: { equals: user.id } }
    },
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['author'],
      access: {
        // Bare admin kan endre roller (ingen kan gi seg selv admin)
        create: isAdminField,
        update: isAdminField,
      },
      options: [
        { label: 'Administrator', value: 'admin' },
        { label: 'Redaktør', value: 'editor' },
        { label: 'Forfatter', value: 'author' },
      ],
    },
    {
      name: 'bio',
      type: 'textarea',
      admin: { description: 'Kort presentasjon, vises ved artikler.' },
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}
