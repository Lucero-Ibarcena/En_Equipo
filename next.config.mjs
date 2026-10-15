const apiTarget = (process.env.EN_EQUIPO_API_TARGET || 'http://127.0.0.1:3002').replace(/\/$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // [DESARROLLO] Oculta la insignia visual de Next sin ocultar errores.
  devIndicators: false,
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${apiTarget}/api/:path*` }];
  },
};

export default nextConfig;
