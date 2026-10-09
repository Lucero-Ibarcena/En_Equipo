import express from 'express';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import authRoutes from './routes/auth.routes.js';
import householdRoutes from './routes/household.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { dateOffsetFromToday } from './utils/date.js';

const app = express();
const clientBuild = resolve(process.cwd(), 'dist');

app.disable('x-powered-by');
app.disable('etag');
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (request, response) => response.json({ status: 'ok', service: 'en-equipo-api' }));
app.get('/api/demo', (request, response) => response.json({
  household: { id: 'demo', name: 'Nuestra casa', timezone: 'America/Argentina/Buenos_Aires' },
  members: [
    { id: 'demo-ana', name: 'Ana', initials: 'A', color: 'sage', role: 'member' },
    { id: 'demo-leo', name: 'Leo', initials: 'L', color: 'blue', role: 'member' },
    { id: 'demo-sofi', name: 'Sofi', initials: 'S', color: 'peach', role: 'member' },
  ],
  tasks: [
    { id: 'demo-laundry', title: 'Poner un lavado de ropa', category: 'chores', assigneeId: 'demo-leo', dueDate: dateOffsetFromToday(0), status: 'pending', notes: 'Separar la ropa clara antes de ponerla.' },
    { id: 'demo-kitchen', title: 'Dejar la cocina lista', category: 'chores', assigneeId: 'demo-ana', dueDate: dateOffsetFromToday(0), status: 'in_progress', notes: '' },
    { id: 'demo-market', title: 'Frutas, verduras y leche', category: 'shopping', assigneeId: 'demo-sofi', dueDate: dateOffsetFromToday(1), status: 'pending', notes: 'Pasar por la feria si está abierta.' },
    { id: 'demo-electricity', title: 'Pagar la luz', category: 'payments', assigneeId: 'demo-ana', dueDate: dateOffsetFromToday(2), status: 'pending', notes: '' },
    { id: 'demo-tap', title: 'Revisar la canilla del baño', category: 'repairs', assigneeId: 'demo-leo', dueDate: dateOffsetFromToday(3), status: 'pending', notes: 'Pierde un poco de agua.' },
    { id: 'demo-plants', title: 'Regar las plantas', category: 'chores', assigneeId: 'demo-sofi', dueDate: dateOffsetFromToday(-1), status: 'done', notes: '' },
    { id: 'demo-internet', title: 'Pagar internet', category: 'payments', assigneeId: 'demo-leo', dueDate: dateOffsetFromToday(5), status: 'pending', notes: '' },
  ],
}));
app.use('/api/auth', authRoutes);
app.use('/api', householdRoutes);

if (existsSync(clientBuild)) {
  app.use(express.static(clientBuild));
  app.use((request, response, next) => {
    if (request.path.startsWith('/api')) return next();
    response.sendFile(resolve(clientBuild, 'index.html'));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
