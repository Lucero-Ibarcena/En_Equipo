import express from 'express';
import authRoutes from './routes/auth.routes.js';
import householdRoutes from './routes/household.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { DEFAULT_CATEGORIES } from './config/constants.js';

// [BACKEND: API HTTP] Ensambla Express, rutas públicas y módulos de autenticación y hogar.
const app = express();
app.disable('x-powered-by');
app.disable('etag');
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.get('/api/health', (request, response) => response.json({ status: 'ok', service: 'en-equipo-api' }));
// Public, read-only dashboard preview. Keep the sample free of fictional people and tasks.
app.get('/api/demo', (request, response) => response.json({
  household: { id: 'preview', name: 'Vista previa', timezone: 'America/Argentina/Buenos_Aires' },
  categories: DEFAULT_CATEGORIES,
  members: [],
  tasks: [],
}));
app.use('/api/auth', authRoutes);
app.use('/api', householdRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
