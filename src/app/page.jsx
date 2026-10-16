import App from '../features/application/components/App.jsx';

// [INTERFAZ: PÁGINA PRINCIPAL · COMPONENTE DE SERVIDOR] Recibe enlaces de invitación y abre la
// aplicación.
export default async function HomePage({ searchParams }) {
  const { join = '' } = await searchParams;
  const initialJoinCode = Array.isArray(join) ? join[0] || '' : join;

  return <App initialJoinCode={initialJoinCode} />;
}
