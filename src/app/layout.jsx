// [INTERFAZ: ESTRUCTURA GENERAL] Carga los estilos globales y los metadatos compartidos.
import '../styles/global.css';
import '../features/application/styles/application.css';
import '../features/application/styles/tema-oscuro.css';
export const metadata = {
  title: 'En Equipo — Organización del hogar',
  description: 'Una forma más clara de compartir las responsabilidades del hogar.',
  icons: {
    icon: '/icon.svg',
  },
  manifest: '/manifest.webmanifest',
};
export const viewport = {
  themeColor: '#f4f5f2',
};
export default function RootLayout({ children }) {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}
