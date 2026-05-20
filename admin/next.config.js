/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },

  async rewrites() {
    const modules = ['quiz', 'quizmaster', 'quizsolo', 'spin', 'vote'] // tombola migré en Next.js
    return modules.map(m => ({
      source: `/parcours/${m}`,
      destination: `/parcours/${m}.html`,
    }))
  },
}
module.exports = nextConfig
