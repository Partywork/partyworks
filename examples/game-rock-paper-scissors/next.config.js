/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "partyworks-client",
    "partyworks-server",
    "partyworks-react",
  ],
};

module.exports = nextConfig;
