/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/nds', destination: '/nds-partenaire.html' },
        { source: '/parcours/nds2026', destination: '/nds-parcours.html' },
      ],
    }
  },
}
module.exports = nextConfig
