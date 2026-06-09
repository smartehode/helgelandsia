import type { CollectionConfig } from 'payload'
import { isEditor } from '../access'
import { slugField } from '../fields/slug'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug'],
    group: 'Taksonomi',
  },
  access: {
    read: () => true,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField('title'),
    {
      name: 'description',
      type: 'textarea',
      admin: { description: 'Kort beskrivelse, kan vises på kategoriside.' },
    },
    {
      name: 'color',
      type: 'text',
      admin: { description: 'Valgfri hex-farge for visuell merking (f.eks. #1f6feb).' },
    },
  ],
}
