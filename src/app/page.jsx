import App from './App.jsx';

// [FRONTEND: APP ROUTER · SERVER COMPONENT] Recibe enlaces de invitación y abre la app.
export default async function HomePage({ searchParams }) {
  const { join = '' } = await searchParams;
  const initialJoinCode = Array.isArray(join) ? join[0] || '' : join;

  return <App initialJoinCode={initialJoinCode} />;
}
