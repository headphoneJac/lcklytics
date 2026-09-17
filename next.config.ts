import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ddragon.leagueoflegends.com",
      },
      {
        protocol: "https",
        hostname: "static.lolesports.com",
      },
      {
        protocol: "https",
        hostname: "am-a.akamaihd.net",
      },
      {
        protocol: "https",
        hostname: "lol.fandom.com",
      },
      {
        protocol: "https",
        hostname: "static.wikia.nocookie.net",
      },
    ],
  },
};

export default nextConfig;
