// Felles ikon- og fargedata for politikategorier.
// svgPaths er innholdet inne i en <svg viewBox="0 0 24 24"> — brukes i både
// React-lista (dangerouslySetInnerHTML) og Leaflet divIcon (HTML-streng).

export interface KategoriData {
  hex: string      // fyllefarge (kart-markør, ikonstroke i lista)
  svgPaths: string // SVG-innhold for 24×24 viewBox
}

export const KATEGORI: Record<string, KategoriData> = {
  Trafikk: {
    hex: '#d97706',
    svgPaths:
      '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.7h-.4L16.4 6H5c-.6 0-1 .4-1 1v10h2"/>' +
      '<path d="M15 17H8"/>' +
      '<circle cx="7.5" cy="17.5" r="1.5"/>' +
      '<circle cx="16.5" cy="17.5" r="1.5"/>',
  },
  Ulykke: {
    hex: '#ea580c',
    svgPaths:
      '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>' +
      '<path d="M12 9v4"/>' +
      '<path d="M12 17h.01"/>',
  },
  Voldshendelse: {
    hex: '#dc2626',
    svgPaths:
      '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>' +
      '<path d="M12 8v4"/>' +
      '<path d="M12 16h.01"/>',
  },
  'Ro og orden': {
    hex: '#2563eb',
    svgPaths:
      '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  },
  Brann: {
    hex: '#b91c1c',
    svgPaths:
      '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/>',
  },
  Savnet: {
    hex: '#db2777',
    svgPaths:
      '<circle cx="11" cy="11" r="8"/>' +
      '<path d="m21 21-4.3-4.3"/>',
  },
  Redning: {
    hex: '#ea580c',
    svgPaths:
      '<path d="M12 2v20"/>' +
      '<path d="M2 12h20"/>',
  },
  Sjø: {
    hex: '#0284c7',
    svgPaths:
      '<circle cx="12" cy="5" r="3"/>' +
      '<path d="M12 22V8"/>' +
      '<path d="M5 12H2a10 10 0 0 0 20 0h-3"/>',
  },
  Tyveri: {
    hex: '#7c3aed',
    svgPaths:
      '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>' +
      '<path d="M3 6h18"/>' +
      '<path d="M16 10a4 4 0 0 1-8 0"/>',
  },
  Innbrudd: {
    hex: '#7c3aed',
    svgPaths:
      '<rect width="11" height="11" x="3" y="11" rx="2"/>' +
      '<path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
  },
  Dyr: {
    hex: '#65a30d',
    svgPaths:
      '<circle cx="11" cy="4" r="2"/>' +
      '<circle cx="18" cy="8" r="2"/>' +
      '<circle cx="20" cy="16" r="2"/>' +
      '<path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>',
  },
  Skadeverk: {
    hex: '#57534e',
    svgPaths:
      '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  },
  Vær: {
    hex: '#0284c7',
    svgPaths:
      '<path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973"/>' +
      '<path d="m13 12-3 5h4l-3 5"/>',
  },
  Arrangement: {
    hex: '#16a34a',
    svgPaths:
      '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>' +
      '<path d="M16 2v4"/>' +
      '<path d="M8 2v4"/>' +
      '<path d="M3 10h18"/>',
  },
}

export const KATEGORI_DEFAULT: KategoriData = {
  hex: '#6b7280',
  svgPaths:
    '<circle cx="12" cy="12" r="10"/>' +
    '<path d="M12 16v-4"/>' +
    '<path d="M12 8h.01"/>',
}

export function kategoriData(cat: string): KategoriData {
  return KATEGORI[cat] ?? KATEGORI_DEFAULT
}
