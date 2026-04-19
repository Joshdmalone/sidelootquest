import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 blocks cross-origin requests to dev-server resources (HMR,
  // chunks) by default. When you access the dev server via a LAN IP instead
  // of localhost, chunks fail to load and client-side widgets break.
  //
  // Dev-only; no effect on production builds. Docs only document exact
  // hostnames + glob wildcards (not CIDR), so we list the exact host +
  // broad private-range wildcards.
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.12.139",
    "192.168.*.*",
    "10.*.*.*",
    "172.16.*.*",
    "172.17.*.*",
    "172.18.*.*",
    "172.19.*.*",
    "172.20.*.*",
    "172.21.*.*",
    "172.22.*.*",
    "172.23.*.*",
    "172.24.*.*",
    "172.25.*.*",
    "172.26.*.*",
    "172.27.*.*",
    "172.28.*.*",
    "172.29.*.*",
    "172.30.*.*",
    "172.31.*.*",
  ],
};

export default nextConfig;
