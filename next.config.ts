import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // next/image may optimize (resize, convert) only our uploaded images.
    localPatterns: [{ pathname: "/api/uploads/**", search: "" }],
  },
};

export default nextConfig;
