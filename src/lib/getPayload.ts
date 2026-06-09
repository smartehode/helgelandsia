import { getPayload as getPayloadInstance } from 'payload'
import config from '@payload-config'

// Lokal API: henter data direkte i Server Components uten HTTP-overhead.
// Cachet på tvers av forespørsler i samme prosess.
export const getPayloadClient = async () => {
  return getPayloadInstance({ config })
}
