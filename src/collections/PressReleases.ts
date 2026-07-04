import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { isEditor, isPublishedOrLoggedIn } from '../access'
import { slugField } from '../fields/slug'
import { afterChangeApproved } from '../lib/email/submission-approved'

export const PressReleases: CollectionConfig = {
  slug: 'press-releases',
  labels: { singular: 'Pressemelding', plural: 'Pressemeldinger' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'organization', 'createdAt', '_status'],
    group: 'Innhold',
  },
  versions: { drafts: true },
  hooks: {
    afterChange: [afterChangeApproved('press-releases')],
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
    { name: 'excerpt', type: 'textarea', label: 'Ingress' },
    {
      name: 'content',
      type: 'richText',
      required: true,
      label: 'Innhold',
      editor: lexicalEditor(),
    },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Bilde' },
    {
      type: 'row',
      fields: [
        { name: 'contactName', type: 'text', label: 'Kontaktperson', admin: { width: '40%' } },
        { name: 'contactEmail', type: 'email', label: 'E-post', admin: { width: '30%' } },
        { name: 'contactPhone', type: 'text', label: 'Telefon', admin: { width: '30%' } },
      ],
    },
    slugField('title'),
    { name: 'submittedBy', type: 'relationship', relationTo: 'members', label: 'Innsendt av', admin: { position: 'sidebar' }, access: { read: ({ req: { user } }) => Boolean(user) } },
  ],
}
