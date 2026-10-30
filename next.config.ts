import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lawngreen-wasp-141236.hostingersite.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "epaper.janasainyam.in",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "janasainyam.in",
        pathname: "/**",
      },
    ],
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
