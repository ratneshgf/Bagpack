import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep development artifacts separate from an inaccessible legacy .next cache.
  distDir: '.next-dev',
  // Allow this machine's LAN preview to load the current dev bundle and HMR updates.
  allowedDevOrigins: ['10.7.189.32'],
};

export default nextConfig;
