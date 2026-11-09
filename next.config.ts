import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a phone on the same Wi-Fi open the dev server (http://<this Mac's IP>:3000) with live reload.
  allowedDevOrigins: ["192.168.0.12", "127.0.0.1", "*.local"],
  // The Varnmala app (an Expo web build in public/varnmala-app) routes on its own: any path inside it that is not a
  // real file gets the app's page, and the app shows the right screen.
  async rewrites() {
    return [
      { source: "/varnmala-app", destination: "/varnmala-app/index.html" },
      { source: "/varnmala-app/:path*", destination: "/varnmala-app/index.html" },
    ];
  },
  async redirects() {
    // The Lab used to be called Canvas.
    return [{ source: "/canvas", destination: "/lab", permanent: false }];
  },
};

export default nextConfig;
