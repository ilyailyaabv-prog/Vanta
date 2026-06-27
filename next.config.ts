import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Core config */
  reactStrictMode: true,
  output: "standalone",

  /* Image optimization */
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
        port: "",
        pathname: "/vanta-*/**",
      },
      {
        protocol: "https",
        hostname: "*.cloudflare-ipfs.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  /* Experimental features */
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },

  /* Headers */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;