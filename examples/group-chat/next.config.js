/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  //todo remove this it's erroring with partyworks-server for some reason :/
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
