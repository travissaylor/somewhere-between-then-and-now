import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack(config) {
    // Treat .glsl files as raw text strings so they can be imported by ShaderMaterial factories
    config.module.rules.push({
      test: /\.glsl$/,
      type: 'asset/source',
    });
    return config;
  },
};

export default nextConfig;
