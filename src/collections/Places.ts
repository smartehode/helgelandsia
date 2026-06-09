import type { CollectionConfig } from 'payload'
import { isEditor } from '../access'
import { slugField } from '../fields/slug'

// Steder/kommuner i regionen – brukes til geografisk filtrering.
export const Places: CollectionConfig = {
  slug: 'places',
  labels: { singular: 'Sted', plural: 'Steder' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'municipality'],
    group: 'Taksonomi',
  },
  access: {
    read: () => true,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    {
      name: 'municipality',
      type: 'text',
      label: 'Kommune',
    },
    {
      type: 'row',
      fields: [
        { name: 'lat', type: 'number', label: 'Breddegrad', admin: { width: '50%' } },
        { name: 'lng', type: 'number', label: 'Lengdegrad', admin: { width: '50%' } },
      ],
    },
  ],
}
