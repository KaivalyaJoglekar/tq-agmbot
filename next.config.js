/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb', // Increase the limit to 5MB
    },
  },
};

export default nextConfig;
