'use client'

export default function FeaturedCell({ cellData }: { cellData?: boolean }) {
  return <>{cellData ? 'Ja' : 'Nei'}</>
}
