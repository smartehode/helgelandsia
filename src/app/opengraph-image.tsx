import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Helgelandsia – alt om Helgeland samlet på ett sted'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// fjord: #0C2733 · sea: #103743 · sun: #DDA13A
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0C2733',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Georgia, serif',
          position: 'relative',
        }}
      >
        {/* Sol-aktig aksent øverst */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: '#DDA13A',
          }}
        />

        {/* H — stor logobokstav */}
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            color: '#DDA13A',
            lineHeight: 1,
            letterSpacing: '-4px',
          }}
        >
          H
        </div>

        {/* Navn */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: '#ffffff',
            marginTop: 8,
            letterSpacing: '-1px',
          }}
        >
          Helgelandsia
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 22,
            color: 'rgba(255,255,255,0.60)',
            marginTop: 18,
            textAlign: 'center',
            maxWidth: 680,
            fontFamily: 'system-ui, sans-serif',
            fontWeight: 400,
          }}
        >
          Alt om Helgeland, samlet på ett sted
        </div>

        {/* Bunn-stripe i sea-farge */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            background: '#103743',
          }}
        />
      </div>
    ),
    size,
  )
}
