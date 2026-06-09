import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Tillat bilder fra egen server og evt. S3-bøtte
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  experimental: {
    reactCompiler: false,
  },
}

// withPayload kobler adminpanelet og API-rutene inn i Next.js
export default withPayload(nextConfig)
