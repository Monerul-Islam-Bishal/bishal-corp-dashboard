const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// GET /api/reports — list reports
router.get('/', (req, res) => {
  try {
    const db = req.db;
    const { type, limit = 20, offset = 0 } = req.query;
    let sql = 'SELECT * FROM reports';
    const params = [];
    if (type) { sql += ' WHERE type = ?'; params.push(type); }
    sql += ' ORDER BY generated_at DESC';
    const reports = db.query(sql, params);
    res.json(reports);
  } catch (err) {
    console.error('GET /api/reports error:', err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// GET /api/reports/daily-summary — today's summary
router.get('/daily-summary', (req, res) => {
  try {
    const db = req.db;
    const tasksCompleted = db.get("SELECT COUNT(*) as count FROM tasks WHERE status = 'done' AND date(updated_at) = date('now')").count;
    const activeAgents = db.get("SELECT COUNT(*) as count FROM agents WHERE status = 'working'").count;
    const totalAgents = db.get('SELECT COUNT(*) as count FROM agents').count;
    const avgSuccess = db.get('SELECT COALESCE(ROUND(AVG(success_rate) * 100, 1), 0) as rate FROM agents').rate;
    const revenue = db.get("SELECT COALESCE(SUM(metric_value), 0) as total FROM metrics WHERE metric_key = 'revenue_mtd'").total;

    res.json({
      today: new Date().toISOString().split('T')[0],
      tasks_completed: tasksCompleted,
      active_agents: activeAgents,
      total_agents: totalAgents,
      avg_success_rate: avgSuccess,
      revenue: Math.round(revenue * 100) / 100,
    });
  } catch (err) {
    console.error('GET /api/reports/daily-summary error:', err);
    res.status(500).json({ error: 'Failed to fetch daily summary' });
  }
});

// GET /api/reports/logs — activity logs
router.get('/logs', (req, res) => {
  try {
    const db = req.db;
    const { limit = 50, level, agent_id } = req.query;
    let sql = `SELECT al.*, a.name as agent_name, t.title as task_title
      FROM activity_logs al LEFT JOIN agents a ON al.agent_id = a.id
      LEFT JOIN tasks t ON al.task_id = t.id`;
    const params = [];
    const conds = [];
    if (level) { conds.push('al.level = ?'); params.push(level); }
    if (agent_id) { conds.push('al.agent_id = ?'); params.push(agent_id); }
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
    sql += ' ORDER BY al.timestamp DESC';
    const logs = db.query(sql, params);
    res.json(logs);
  } catch (err) {
    console.error('GET /api/reports/logs error:', err);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

// POST /api/reports/generate — generate a new summary report
router.post('/generate', (req, res) => {
  try {
    const db = req.db;
    const { type, title } = req.body;
    if (!type || !['daily', 'weekly', 'monthly', 'custom'].includes(type)) {
      return res.status(400).json({ error: 'Valid type required: daily, weekly, monthly, or custom' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    const dateRange = type === 'daily' ? 1 : type === 'weekly' ? 7 : type === 'monthly' ? 30 : 90;

    const tasksCompleted = db.get(`SELECT COUNT(*) as count FROM tasks WHERE status = 'done' AND julianday(updated_at) >= julianday('now') - ?`, [dateRange]).count;
    const totalTasks = db.get(`SELECT COUNT(*) as count FROM tasks WHERE julianday(created_at) >= julianday('now') - ?`, [dateRange]).count;
    const revenue = db.get(`SELECT COALESCE(SUM(metric_value), 0) as total FROM metrics WHERE metric_key = 'revenue_mtd'`, []).total;
    const activeAgents = db.get("SELECT COUNT(*) as count FROM agents WHERE status = 'working'").count;

    const titleStr = title || `${type.charAt(0).toUpperCase() + type.slice(1)} Report`;
    const summaryStr = `${tasksCompleted} tasks completed, ${activeAgents} agents active`;
    const reportData = JSON.stringify({ type, dateRangeDays: dateRange, tasksCompleted, totalTasks, revenue, activeAgents, generatedAt: now });

    db.run('INSERT INTO reports (id, type, title, summary, data, generated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, type, titleStr, summaryStr, reportData, now]);
    db.run('INSERT INTO activity_logs (id, agent_id, task_id, action, details, level, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uuidv4(), null, null, 'report_generated', 'Report: ' + titleStr, 'info', now]);

    const report = db.get('SELECT * FROM reports WHERE id = ?', [id]);
    res.status(201).json(report);
  } catch (err) {
    console.error('POST /api/reports/generate error:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// GET /api/reports/:id — single report
router.get('/:id', (req, res) => {
  try {
    const db = req.db;
    const report = db.get('SELECT * FROM reports WHERE id = ?', [req.params.id]);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    if (report.data) { try { report.data = JSON.parse(report.data); } catch {} }
    res.json(report);
  } catch (err) {
    console.error('GET /api/reports/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

module.exports = router;
