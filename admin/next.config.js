/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/nds', destination: '/nds-partenaire.html' },
        { source: '/nds-partenaire', destination: '/nds-partenaire.html' },
        { source: '/jeu', destination: '/nds-parcours.html' },
        { source: '/carte', destination: '/carte.html' },
        { source: '/pro-nds', destination: '/pro-nds-live.html' },
        { source: '/prospection', destination: '/prospection.html' },
        // Compat QR legacy : /parcours/<module>.html -> /parcours/<module>
        // (les anciens QR imprimes avec .html ne tombent plus en 404 ; query string conservee)
        { source: '/parcours/:module(quiz|quizsolo|quizmaster|spin|vote|tombola|nds2026).html', destination: '/parcours/:module' },
      ],
    }
  },
}
module.exports = nextConfig
