/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: true,
      },
    ]
  },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        hostname: "https://console.firebase.google.com/",
      },
    ],
    domains: ['firebasestorage.googleapis.com'],
    // path: `assets/slider/*`,
  },
}

module.exports = nextConfig
