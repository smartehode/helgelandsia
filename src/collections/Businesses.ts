import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { isEditor, isPublishedOrLoggedIn } from '../access'
import { slugField } from '../fields/slug'

async function geocodeHook({ data }: { data: any }) {
  const city = String(data.city || '').trim()
  if (!city) return data
  const q = [city, data.county, data.country].filter(Boolean).join(', ')
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q, format: 'json', limit: '1' })}`,
      { headers: { 'User-Agent': 'Helgelandsia/1.0 (helgelandsia.no)' } },
    )
    const [hit] = (await res.json()) as any[]
    if (hit) {
      data.lat = parseFloat(hit.lat)
      data.lng = parseFloat(hit.lon)
    }
  } catch { /* stille feil — lat/lng forblir uendret */ }
  return data
}

export const Businesses: CollectionConfig = {
  slug: 'businesses',
  labels: { singular: 'Bedrift', plural: 'Bedrifter' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'place', 'featured', '_status'],
    group: 'Innhold',
  },
  versions: { drafts: true },
  hooks: { beforeChange: [geocodeHook] },
  access: {
    read: isPublishedOrLoggedIn,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Profil',
          fields: [
            { name: 'name', type: 'text', required: true, label: 'Navn' },
            { name: 'tagline', type: 'text', label: 'Slagord / kort beskrivelse' },
            { name: 'logo', type: 'upload', relationTo: 'media', label: 'Logo' },
            {
              name: 'description',
              type: 'richText',
              label: 'Beskrivelse',
              editor: lexicalEditor(),
            },
            {
              name: 'gallery',
              type: 'array',
              label: 'Bildegalleri',
              fields: [
                { name: 'image', type: 'upload', relationTo: 'media', required: true },
              ],
            },
          ],
        },
        {
          label: 'Kontakt & kart',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'phone', type: 'text', label: 'Telefon', admin: { width: '50%' } },
                { name: 'email', type: 'email', label: 'E-post', admin: { width: '50%' } },
              ],
            },
            { name: 'website', type: 'text', label: 'Nettside (URL)' },
            { name: 'address', type: 'text', label: 'Adresse' },
            {
              type: 'row',
              fields: [
                { name: 'city', type: 'text', label: 'By', admin: { width: '40%' } },
                { name: 'county', type: 'text', label: 'Fylke', admin: { width: '30%' } },
                { name: 'country', type: 'text', label: 'Land', defaultValue: 'Norge', admin: { width: '30%' } },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'lat', type: 'number', label: 'Breddegrad (auto)', admin: { width: '50%', readOnly: true, description: 'Fylles ut automatisk fra By/Fylke/Land' } },
                { name: 'lng', type: 'number', label: 'Lengdegrad (auto)', admin: { width: '50%', readOnly: true, description: 'Fylles ut automatisk fra By/Fylke/Land' } },
              ],
            },
            {
              name: 'openingHours',
              type: 'array',
              label: 'Åpningstider',
              fields: [
                {
                  name: 'day',
                  type: 'select',
                  required: true,
                  options: [
                    { label: 'Mandag', value: 'mon' },
                    { label: 'Tirsdag', value: 'tue' },
                    { label: 'Onsdag', value: 'wed' },
                    { label: 'Torsdag', value: 'thu' },
                    { label: 'Fredag', value: 'fri' },
                    { label: 'Lørdag', value: 'sat' },
                    { label: 'Søndag', value: 'sun' },
                  ],
                },
                { name: 'opens', type: 'text', label: 'Åpner (f.eks. 09:00)' },
                { name: 'closes', type: 'text', label: 'Stenger (f.eks. 17:00)' },
              ],
            },
            {
              name: 'social',
              type: 'group',
              label: 'Sosiale medier',
              fields: [
                { name: 'facebook', type: 'text' },
                { name: 'instagram', type: 'text' },
              ],
            },
          ],
        },
      ],
    },
    slugField('name'),
    { name: 'submittedBy', type: 'relationship', relationTo: 'members', label: 'Innsendt av', admin: { position: 'sidebar' } },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      admin: { position: 'sidebar' },
      label: 'Bransje/kategori',
    },
    {
      name: 'place',
      type: 'relationship',
      relationTo: 'places',
      admin: { position: 'sidebar' },
      label: 'Sted',
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
      label: 'Fremhevet',
    },
  ],
}
