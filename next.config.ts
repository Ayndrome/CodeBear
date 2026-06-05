import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    allowedDevOrigins: [
        "https://codebear.space",
        "http://localhost:3000",
    ],
    // Empty turbopack config silences the "webpack config but no turbopack config" warning
    turbopack: {},
    output: 'standalone',
};

export default nextConfig;