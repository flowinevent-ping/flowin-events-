/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/nds', destination: '/nds-partenaire.html' },
        { source: '/carte', destination: '/carte.html' },
        { source: '/pro-nds', destination: '/pro-nds-live.html' },
      ],
    }
  },
}
module.exports = nextConfig
