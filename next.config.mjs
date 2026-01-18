/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  swcMinify: false,
  webpack: (config) => {
    config.resolve.alias.canvas = false
    return config
  },
  turbopack: {},
}

export default nextConfig
