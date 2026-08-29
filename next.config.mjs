/** @type {import('next').NextConfig} */
const nextConfig = {
  // Belt-and-suspenders for lib/pet-name-overlay.ts, which fs.readFileSync's
  // a bundled TTF at runtime (embedded as a base64 @font-face in the SVG
  // overlay — Vercel's serverless runtime has no system fonts, so relying
  // on font-family alone rendered empty tofu boxes in prod). Next's file
  // tracer usually catches static fs.readFileSync(path.join(...)) calls,
  // but this makes the font file's inclusion in the /api/generate function
  // bundle explicit rather than implicit.
  experimental: {
    outputFileTracingIncludes: {
      "/api/generate": ["./lib/fonts/**"],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  async redirects() {
    return [
      // "Free wallpaper" is what people actually search/type; the product
      // page lives at /wallpaper. Permanent so link equity consolidates.
      {
        source: "/free-wallpaper",
        destination: "/wallpaper",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
