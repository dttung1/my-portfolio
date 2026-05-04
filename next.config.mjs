/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@react-pdf/renderer", "pdfjs-dist"],
};

export default nextConfig;
