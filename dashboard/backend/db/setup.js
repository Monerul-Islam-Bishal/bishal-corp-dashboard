const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, 'dashboard.db');

function wrapDb(db) {
  db._save = function() {
    const data = this.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  };

  db.query = function(sql, params = []) {
    const stmt = this.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) results.push(stmt.getAsObject());
    stmt.free();
    return results;
  };

  db.run = function(sql, params = []) {
    this.exec('BEGIN');
    try {
      const stmt = this.prepare(sql);
      stmt.run(params);
      stmt.free();
      this.exec('COMMIT');
      this._save();
    } catch (e) {
      this.exec('ROLLBACK');
      throw e;
    }
  };

  db.get = function(sql, params = []) {
    const r = this.query(sql, params);
    return r.length > 0 ? r[0] : null;
  };

  return db;
}

async function initialize() {
  const SQL = await initSqlJs();
  let db;

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = wrapDb(new SQL.Database(buffer));

    // Check if data exists
    const agents = db.query('SELECT COUNT(*) as c FROM agents');
    if (agents.length > 0 && agents[0].c > 0) {
      return db;
    }
  }

  db = wrapDb(new SQL.Database());
  db.exec('PRAGMA journal_mode=WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT,
      status TEXT DEFAULT 'idle', last_active TIMESTAMP,
      tasks_completed INTEGER DEFAULT 0, success_rate REAL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT,
      agent_id TEXT, status TEXT DEFAULT 'pending', phase TEXT,
      attempts INTEGER DEFAULT 0, qa_status TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY, agent_id TEXT, task_id TEXT,
      action TEXT NOT NULL, details TEXT, level TEXT DEFAULT 'info',
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY, type TEXT NOT NULL, title TEXT,
      summary TEXT, data TEXT,
      generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS metrics (
      id TEXT PRIMARY KEY, metric_key TEXT NOT NULL,
      metric_value REAL NOT NULL, label TEXT,
      recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed agents
  const agentData = [
    { name: 'Alex Chen', category: 'engineering' },
    { name: 'Suki Tanaka', category: 'marketing' },
    { name: 'Lena Oshiro', category: 'engineering' },
    { name: 'Yuki Harada', category: 'engineering' },
    { name: 'Priya Mehta', category: 'finance' },
    { name: 'Marcus Webb', category: 'engineering' },
    { name: 'Elena Reyes', category: 'marketing' },
    { name: 'Tom Hardy', category: 'design' },
    { name: 'Sarah Kim', category: 'marketing' },
    { name: 'Raj Patel', category: 'finance' },
  ];
  const statuses = ['idle', 'working', 'done', 'failed', 'idle'];

  for (const [i, a] of agentData.entries()) {
    const id = uuidv4();
    const completed = Math.floor(Math.random() * 60) + 5;
    const rate = (Math.random() * 0.3 + 0.65).toFixed(2);
    const daysAgo = Math.floor(Math.random() * 30);
    const lastActive = new Date(Date.now() - daysAgo * 86400000).toISOString();
    db.run('INSERT INTO agents VALUES (?,?,?,?,?,?,?,?)',
      [id, a.name, a.category, statuses[i % statuses.length], lastActive, completed, parseFloat(rate), new Date().toISOString()]);
  }

  const agentIds = db.query('SELECT id FROM agents').map(r => r.id);

  // Seed tasks
  const taskData = [
    'Build frontend dashboard layout', 'Design API endpoints for agents',
    'Create activity log viewer', 'Implement KPI chart components',
    'Setup database schema', 'Create agent detail page',
    'Build task management UI', 'Implement search and filtering',
    'Design notification system', 'Setup authentication',
    'Create reporting engine', 'Build settings page',
    'Design company overview dashboard', 'Implement data export feature',
    'Create agent performance analytics', 'Build real-time activity feed',
    'Design mobile responsive layout', 'Implement dark mode toggle',
    'Create onboarding wizard', 'Build admin user management',
  ];
  const taskStatuses = ['pending', 'in-progress', 'done', 'done', 'done', 'qa-failed', 'done', 'blocked', 'done', 'done', 'pending', 'in-progress', 'done', 'done', 'qa-failed', 'done', 'pending', 'done', 'done', 'done'];
  const phases = ['Phase 1', 'Phase 2', 'Phase 1', 'Phase 2', 'Phase 3', 'Phase 1', 'Phase 2', 'Phase 3', 'Phase 2', 'Phase 1', 'Phase 2', 'Phase 3', 'Phase 1', 'Phase 2', 'Phase 3', 'Phase 1', 'Phase 3', 'Phase 2', 'Phase 1', 'Phase 3'];

  for (const [i, title] of taskData.entries()) {
    const id = uuidv4();
    const agentId = agentIds[i % agentIds.length];
    const s = taskStatuses[i];
    const daysAgo = Math.floor(Math.random() * 14);
    const phase = phases[i];
    const attempts = s === 'qa-failed' ? 2 : s === 'done' ? Math.floor(Math.random() * 3) + 1 : 0;
    const qa = s === 'done' ? 'passed' : s === 'qa-failed' ? 'failed' : null;
    const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();
    const completedAt = s === 'done' ? new Date(Date.now() - (daysAgo - 2) * 86400000).toISOString() : null;
    db.run('INSERT INTO tasks VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [id, title, `Implement ${title.toLowerCase()}`, agentId, s, phase, attempts, qa, createdAt, createdAt, completedAt]);
  }

  // Seed activity logs
  const actions = ['Started task', 'Completed task', 'Failed QA check', 'Retrying task', 'Deployed update', 'Created report', 'Updated config', 'Running diagnostics', 'Processing data', 'Reviewing code', 'Querying database', 'Generating output'];
  const levels = ['info', 'info', 'info', 'warning', 'info', 'info', 'success', 'info', 'error', 'info'];
  for (let i = 0; i < 60; i++) {
    const id = uuidv4();
    const agentId = agentIds[Math.floor(Math.random() * agentIds.length)];
    const taskId = agentIds[Math.floor(Math.random() * agentIds.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const level = levels[Math.floor(Math.random() * levels.length)];
    const minsAgo = Math.floor(Math.random() * 1440);
    db.run('INSERT INTO activity_logs VALUES (?,?,?,?,?,?,?)',
      [id, agentId, taskId, action, `Agent performed: ${action.toLowerCase()}`, level, new Date(Date.now() - minsAgo * 60000).toISOString()]);
  }

  // Seed metrics
  db.run('INSERT INTO metrics VALUES (?,?,?,?,?)', [uuidv4(), 'revenue_mtd', 3240, 'Revenue MTD', new Date().toISOString()]);
  db.run('INSERT INTO metrics VALUES (?,?,?,?,?)', [uuidv4(), 'active_agents', 12, 'Active Agents', new Date().toISOString()]);
  db.run('INSERT INTO metrics VALUES (?,?,?,?,?)', [uuidv4(), 'tasks_completed_today', 8, 'Tasks Completed Today', new Date().toISOString()]);
  db.run('INSERT INTO metrics VALUES (?,?,?,?,?)', [uuidv4(), 'total_tasks', 47, 'Total Tasks', new Date().toISOString()]);
  db.run('INSERT INTO metrics VALUES (?,?,?,?,?)', [uuidv4(), 'avg_success_rate', 87, 'Average Success Rate', new Date().toISOString()]);

  for (let day = 6; day >= 0; day--) {
    const dayDate = new Date(Date.now() - day * 86400000);
    const dayStr = dayDate.toISOString().split('T')[0];
    db.run('INSERT INTO metrics VALUES (?,?,?,?,?)', [uuidv4(), 'tasks_by_day', Math.floor(Math.random() * 12) + 3, dayStr, dayDate.toISOString()]);
    db.run('INSERT INTO metrics VALUES (?,?,?,?,?)', [uuidv4(), 'revenue_by_day', Math.floor(Math.random() * 500) + 200, dayStr, dayDate.toISOString()]);
  }

  db._save();
  return db;
}

module.exports = { initialize };
