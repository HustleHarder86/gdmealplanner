/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static exports for better performance
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig