import express from 'express';
import authRoutes from './routes/auth.routes.js';
import householdRoutes from './routes/household.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { DEFAULT_CATEGORIES } from './config/constants.js';

// [SERVIDOR: API HTTP] Configura Express, registra las rutas y aplica el manejo común de errores.
const app = express();
app.disable('x-powered-by');
app.disable('etag');
app.use(
  express.json({
    limit: '1mb',
  })
);
app.use(
  express.urlencoded({
    extended: false,
  })
);
app.get('/api/health', (request, response) =>
  response.json({
    status: 'ok',
    service: 'en-equipo-api',
  })
);
// [VISTA PREVIA] Devuelve categorías reales del sistema sin inventar personas ni tareas.
app.get('/api/demo', (request, response) =>
  response.json({
    household: {
      id: 'preview',
      name: 'Vista previa',
      timezone: 'America/Argentina/Buenos_Aires',
    },
    categories: DEFAULT_CATEGORIES,
    members: [],
    tasks: [],
  })
);
app.use('/api/auth', authRoutes);
app.use('/api', householdRoutes);
app.use(notFoundHandler);
app.use(errorHandler);
export default app;
