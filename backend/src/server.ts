import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

import healthRouter from './routes/health.js';
import patientsRouter from './routes/patients.js';
import medicationsRouter from './routes/medications.js';
import dosesRouter from './routes/doses.js';
import careCircleRouter from './routes/careCircle.js';
import appointmentsRouter from './routes/appointments.js';
import schedulerRouter from './routes/scheduler.js';
import demoRouter from './routes/demo.js';

const app = express();
const PORT = process.env.PORT || 8080;

// Security & Parsing
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows inline styles & icons for responsive SPA
  })
);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// API Routes
app.use('/api/health', healthRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/patients', medicationsRouter);
app.use('/api/patients', appointmentsRouter);
app.use('/api/doses', dosesRouter);
app.use('/api', careCircleRouter);
app.use('/api/scheduler', schedulerRouter);
app.use('/api/demo', demoRouter);

// Serve compiled Frontend SPA in production / unified container
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');

app.use(express.static(frontendDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
    if (err) {
      // If frontend isn't built yet, output a helpful API welcome message
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>ElderSync API Server</title>
            <style>
              body { font-family: system-ui, sans-serif; background: #0F172A; color: #F8FAFC; padding: 40px; }
              .card { background: #1E293B; border-radius: 8px; padding: 24px; max-width: 600px; margin: auto; }
              h1 { color: #0D9488; }
              a { color: #38BDF8; }
              pre { background: #0F172A; padding: 12px; border-radius: 6px; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>ElderSync API Engine</h1>
              <p>Backend API running on port ${PORT}.</p>
              <p>Health endpoint: <a href="/api/health">/api/health</a></p>
              <p>Seeded demo patient: <code>patient_robert_vance</code></p>
            </div>
          </body>
        </html>
      `);
    }
  });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[GlobalErrorHandler]', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 ElderSync Unified Server running on port ${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
  });
}

export default app;
