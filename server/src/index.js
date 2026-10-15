import app from './app.js';

// [BACKEND: PUNTO DE ENTRADA] Inicia Express en el puerto configurado para la API.
const port = Number(process.env.PORT) || 3002;
const host = process.env.HOST || '0.0.0.0';

app.listen(port, host, () => {
  console.log(`En Equipo API disponible en el puerto ${port} (${host})`);
});
