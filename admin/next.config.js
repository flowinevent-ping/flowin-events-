/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/nds', destination: '/nds-partenaire.html' },
      ],
    }
  },
}
module.exports = nextConfig
