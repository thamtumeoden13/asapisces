import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [{
      protocol: "https",
      hostname: "*"
    }]
  },
  experimental: {
    ppr: "incremental",
  },
  devIndicators: {
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.glb$/,
      use: [
        {
          loader: 'file-loader',
          options: {
            publicPath: '/_next/static/assets/',
            outputPath: 'static/assets/',
            name: '[name].[hash].[ext]',
          },
        },
      ],
    });
    return config;
  },
  async headers() {
    return [
      {
        source: '/_next/static/media/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
