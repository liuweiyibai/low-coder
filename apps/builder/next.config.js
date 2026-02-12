/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: [
        '@low-coder/schema-core',
        '@low-coder/component-sdk',
        '@low-coder/runtime'
    ],
    experimental: {
        optimizePackageImports: ['lucide-react']
    }
}

module.exports = nextConfig
