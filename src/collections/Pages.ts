import type { CollectionConfig } from 'payload'
import { isEditor, isPublishedOrLoggedIn } from '../access'
import { slugField } from '../fields/slug'
import { layoutBlocks } from '../blocks'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Side', plural: 'Sider' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status'],
    group: 'Innhold',
    livePreview: {
      url: ({ data }) =>
        `${process.env.NEXT_PUBLIC_SERVER_URL}/${data?.slug ?? ''}`,
    },
  },
  versions: { drafts: { autosave: { interval: 800 } } },
  access: {
    read: isPublishedOrLoggedIn,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Tittel' },
    slugField('title'),
    {
      name: 'layout',
      type: 'blocks',
      label: 'Sideinnhold',
      blocks: layoutBlocks,
      admin: {
        description: 'Bygg siden ved å stable blokker i ønsket rekkefølge.',
      },
    },
  ],
}
