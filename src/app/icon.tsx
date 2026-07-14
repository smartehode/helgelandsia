import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        fontSize: 22,
        background: '#1B3A5C',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#F5F0E8',
        fontWeight: 700,
        borderRadius: 5,
      }}
    >
      H
    </div>,
    size,
  )
}
