import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // The Lab used to be called Canvas.
    return [{ source: "/canvas", destination: "/lab", permanent: false }];
  },
};

export default nextConfig;
