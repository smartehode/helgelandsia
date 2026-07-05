import type { GlobalConfig } from 'payload'
import { isEditor } from '../access'
import { widgetBlocks, layoutBlocks } from '../blocks'

export const WidgetAreas: GlobalConfig = {
  slug: 'sidefelt',
  label: 'Widget-områder',
  admin: {
    group: 'Konfigurasjon',
    description: 'Widgets og layout-soner på forsiden.',
  },
  access: { read: () => true, update: isEditor },
  fields: [
    // ── Fremhevet sone ─────────────────────────────────────────────────────
    {
      name: 'fremhevetKolonner',
      type: 'select',
      label: 'Fremhevet sone – kolonner',
      defaultValue: '1',
      admin: {
        description: 'Antall kolonner i fremhevet sone (desktop). Mobil er alltid 1, tablet maks 2.',
      },
      options: [
        { label: '1 kolonne', value: '1' },
        { label: '2 kolonner', value: '2' },
        { label: '3 kolonner', value: '3' },
        { label: '4 kolonner', value: '4' },
      ],
    },
    {
      name: 'fremhevet',
      type: 'blocks',
      label: 'Fremhevet sone (full bredde)',
      blocks: layoutBlocks,
      admin: {
        description: 'Full bredde under navigasjonskortene. Bruk «Fremhevede historier»-blokken til å plukke ut ekslusive artikler og saker.',
      },
    },
    // ── Sidefelt ───────────────────────────────────────────────────────────
    {
      name: 'sidefeltKolonner',
      type: 'select',
      label: 'Sidefelt – kolonner',
      defaultValue: '1',
      admin: {
        description: 'Antall kolonner i sidefeltet. Nesten alltid 1 — sidefeltet er smal (340 px).',
      },
      options: [
        { label: '1 kolonne', value: '1' },
        { label: '2 kolonner', value: '2' },
        { label: '3 kolonner', value: '3' },
        { label: '4 kolonner', value: '4' },
      ],
    },
    {
      name: 'sidefelt',
      type: 'blocks',
      label: 'Sidefelt (høyrespalte)',
      blocks: widgetBlocks,
      admin: {
        description: 'Kompakt variant. Vises i høyrespalten ved siden av innholdet på store skjermer.',
      },
    },
    // ── Midten-sone ────────────────────────────────────────────────────────
    {
      name: 'midtenKolonner',
      type: 'select',
      label: 'Midten-sone – kolonner',
      defaultValue: '2',
      admin: {
        description: 'Antall kolonner midt på forsiden. Standard 2 — historier og arrangementer side om side.',
      },
      options: [
        { label: '1 kolonne', value: '1' },
        { label: '2 kolonner', value: '2' },
        { label: '3 kolonner', value: '3' },
        { label: '4 kolonner', value: '4' },
      ],
    },
    {
      name: 'midten',
      type: 'blocks',
      label: 'Midt på forsiden',
      blocks: widgetBlocks,
      admin: {
        description: 'Vises mellom «Fremhevet sone» og sidefeltet. Kolonnetall styres av feltet over.',
      },
    },
    // ── Bunn-sone ──────────────────────────────────────────────────────────
    {
      name: 'bunnKolonner',
      type: 'select',
      label: 'Bunn-sone – kolonner',
      defaultValue: '3',
      admin: {
        description: 'Antall kolonner i bunnsonen. Standard 3 — kompakt stripe over footeren.',
      },
      options: [
        { label: '1 kolonne', value: '1' },
        { label: '2 kolonner', value: '2' },
        { label: '3 kolonner', value: '3' },
        { label: '4 kolonner', value: '4' },
      ],
    },
    {
      name: 'bunn',
      type: 'blocks',
      label: 'Bunn av forsiden',
      blocks: widgetBlocks,
      admin: {
        description: 'Kompakt variant. Full-bredde stripe rett over footeren. Kolonnetall styres av feltet over.',
      },
    },
  ],
}
