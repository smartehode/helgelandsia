import { permanentRedirect } from 'next/navigation'

export default function HistorierRedirect({
  searchParams,
}: {
  searchParams: Promise<{ side?: string }>
}) {
  // Async searchParams virker ikke i sync redirect — bruk middleware-mønster med sync
  permanentRedirect('/leserinnlegg')
}
