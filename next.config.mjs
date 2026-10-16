const apiTarget = (process.env.EN_EQUIPO_API_TARGET || 'http://127.0.0.1:3002').replace(/\/$/, '');

// [CONFIGURACIÓN DE NEXT] Oculta la insignia de desarrollo y conecta /api con Express.
/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiTarget}/api/:path*`,
      },
    ];
  },
};
export default nextConfig;
