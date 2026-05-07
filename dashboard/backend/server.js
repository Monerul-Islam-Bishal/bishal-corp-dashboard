const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(morgan('dev'));

// Serve design files (before API routes to avoid 404 catch-all)
app.use('/design', express.static('/data/workspace/dashboard/design'));

const { initialize } = require('./db/setup');
let db;

const agentsRouter = require('./routes/agents');
const tasksRouter = require('./routes/tasks');
const reportsRouter = require('./routes/reports');
const overviewRouter = require('./routes/overview');

app.use((req, res, next) => { req.db = db; next(); });

app.use('/api/agents', agentsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/overview', overviewRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

async function start() {
  try {
    db = await initialize();
    app.listen(PORT, () => console.log(`Dashboard API running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}
start();
