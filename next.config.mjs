import UnoCSS from '@unocss/webpack'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove turbopack as it's causing issues with UnoCSS
  webpack: (config, { isServer }) => {
    config.plugins.push(
      UnoCSS({
        // Use a simpler configuration that's compatible with Next.js
        mode: 'vue-scoped', // This mode is more compatible with Next.js
      })
    )
    return config
  },
  // Disable TypeScript checks during build
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  // Disable ESLint during build
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
}

export default nextConfig