import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The project lives inside a folder that has its own package-lock.json.
  // Pin Turbopack to this repo so it does not walk up to the parent directory.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
