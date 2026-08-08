/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next.js's dev-only route indicator defaults to bottom-left, which
  // collides with the sidebar's Sign out control. This is dev-mode only —
  // it never renders in production builds regardless of this setting.
  devIndicators: {
    position: "bottom-right",
  },
};

module.exports = nextConfig;
