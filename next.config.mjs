const removed = "bright-office-group-desks-dividers";
const backend = process.env.BACKEND_URL || "http://127.0.0.1:8080";
const nextConfig = {
  experimental: { globalNotFound: true, proxyClientMaxBodySize: "12mb" },
  async rewrites() { return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }]; },
  async redirects() {
    return [
      { source: "/", destination: "/en", permanent: false },
      { source: `/gallery/${removed}`, destination: "/fa/gallery", permanent: true },
      ...["en", "fa"].map(locale => ({ source: `/${locale}/gallery/${removed}`, destination: `/${locale}/gallery`, permanent: true })),
      ...["gallery", "services", "about", "contact"].map(page => ({ source: `/${page}/:path*`, destination: `/fa/${page}/:path*`, permanent: true })),
    ];
  },
};
export default nextConfig;
