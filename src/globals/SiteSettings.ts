import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Innstillinger',
  admin: { group: 'Konfigurasjon' },
  access: {
    read: () => true,
    update: isAdmin,
  },
  fields: [
    { name: 'siteName', type: 'text', required: true, defaultValue: 'Helgeland-portalen' },
    { name: 'tagline', type: 'text', label: 'Slagord' },
    { name: 'logo', type: 'upload', relationTo: 'media' },
    {
      name: 'defaultSeo',
      type: 'group',
      label: 'Standard SEO',
      fields: [
        { name: 'metaTitle', type: 'text' },
        { name: 'metaDescription', type: 'textarea' },
        { name: 'ogImage', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      name: 'social',
      type: 'group',
      label: 'Sosiale medier',
      fields: [
        { name: 'facebook', type: 'text' },
        { name: 'instagram', type: 'text' },
        { name: 'youtube', type: 'text' },
      ],
    },
    {
      name: 'contact',
      type: 'group',
      label: 'Kontaktinfo',
      fields: [
        { name: 'email', type: 'email' },
        { name: 'phone', type: 'text' },
        { name: 'address', type: 'textarea' },
      ],
    },
  ],
}
