import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a phone on the same Wi-Fi open the dev server (http://<this Mac's IP>:3000) with live reload.
  allowedDevOrigins: ["192.168.0.12", "127.0.0.1", "*.local"],
  async redirects() {
    // The Lab used to be called Canvas.
    return [{ source: "/canvas", destination: "/lab", permanent: false }];
  },
};

export default nextConfig;
