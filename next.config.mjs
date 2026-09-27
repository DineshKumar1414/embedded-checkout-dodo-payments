/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    const allowedOrigins = (process.env.CHECKOUT_ALLOWED_ORIGINS || '')
      .split(/\s+/)
      .filter((origin) => {
        try {
          const url = new URL(origin)
          return url.origin === origin && (url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))
        } catch {
          return false
        }
      })
      .join(' ')
    const frameAncestors = ["'self'", allowedOrigins].filter(Boolean).join(' ')

    return [
      {
        source: '/checkout',
        headers: [
          { key: 'Content-Security-Policy', value: `frame-ancestors ${frameAncestors}` },
        ],
      },
    ]
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
