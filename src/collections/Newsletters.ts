import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { isEditor, isPublishedOrLoggedIn } from '../access'
import { slugField } from '../fields/slug'
import { afterChangeApproved } from '../lib/email/submission-approved'

export const Newsletters: CollectionConfig = {
  slug: 'newsletters',
  labels: { singular: 'Nyhetsbrev', plural: 'Nyhetsbrev' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'organization', 'createdAt', '_status'],
    group: 'Innhold',
  },
  versions: { drafts: true },
  hooks: {
    afterChange: [afterChangeApproved('newsletters')],
  },
  access: {
    read: isPublishedOrLoggedIn,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Tittel' },
    { name: 'organization', type: 'text', label: 'Avsender/organisasjon' },
    {
      name: 'content',
      type: 'richText',
      required: true,
      label: 'Innhold',
      editor: lexicalEditor(),
    },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Bilde' },
    slugField('title'),
    { name: 'submittedBy', type: 'relationship', relationTo: 'members', label: 'Innsendt av', admin: { position: 'sidebar' }, access: { read: ({ req: { user } }) => Boolean(user) } },
  ],
}
