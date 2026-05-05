// const nextConfig = { reactStrictMode: false, images: { unoptimized: true } };
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",          // ⬅️ KUNCI FULL SPA
  trailingSlash: true,       // routing aman di nginx
  reactStrictMode: false,
  images: {
    unoptimized: true,       // WAJIB untuk export
  },
};

export default nextConfig;
