const nextConfig = {
  async redirects() {
    // Removed from the site: poor framing / black borders.
    return [{ source: "/gallery/bright-office-group-desks-dividers", destination: "/gallery", permanent: true }];
  },
};
export default nextConfig;
