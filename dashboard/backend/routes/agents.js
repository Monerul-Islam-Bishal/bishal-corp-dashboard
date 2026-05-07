const express = require('express');
const router = express.Router();

// GET /api/agents — list all agents
router.get('/', (req, res) => {
  try {
    const db = req.db;
    const { category, status } = req.query;
    let sql = 'SELECT * FROM agents';
    const params = [];
    const conditions = [];

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (conditions.length) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC';

    const agents = db.query(sql, params);
    res.json(agents);
  } catch (err) {
    console.error('GET /api/agents error:', err);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

// GET /api/agents/stats/summary — aggregate stats (must be before /:id routes)
router.get('/stats/summary', (req, res) => {
  try {
    const db = req.db;
    const summary = db.query(`
      SELECT
        COUNT(*) as total_agents,
        SUM(CASE WHEN status = 'working' THEN 1 ELSE 0 END) as active_agents,
        SUM(CASE WHEN status = 'idle' THEN 1 ELSE 0 END) as idle_agents,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done_agents,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_agents,
        SUM(tasks_completed) as total_tasks_completed,
        ROUND(AVG(success_rate) * 100, 1) as avg_success_rate
      FROM agents
    `);
    const byCategory = db.query(`
      SELECT category, COUNT(*) as count,
             SUM(tasks_completed) as tasks_completed,
             ROUND(AVG(success_rate) * 100, 1) as avg_success_rate
      FROM agents GROUP BY category ORDER BY count DESC
    `);

    res.json({ summary: summary[0] || {}, by_category: byCategory });
  } catch (err) {
    console.error('GET /api/agents/stats/summary error:', err);
    res.status(500).json({ error: 'Failed to fetch agent stats' });
  }
});

// GET /api/agents/:id — single agent with stats
router.get('/:id', (req, res) => {
  try {
    const db = req.db;
    const agent = db.get('SELECT * FROM agents WHERE id = ?', [req.params.id]);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const taskStats = db.query(`
      SELECT
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as in_progress_tasks,
        SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked_tasks,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks
      FROM tasks WHERE agent_id = ?
    `, [req.params.id]);

    res.json({ ...agent, task_stats: taskStats[0] || {} });
  } catch (err) {
    console.error('GET /api/agents/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

// GET /api/agents/:id/activity — agent activity history
router.get('/:id/activity', (req, res) => {
  try {
    const db = req.db;
    const agent = db.get('SELECT id FROM agents WHERE id = ?', [req.params.id]);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const logs = db.query(`
      SELECT al.*, t.title as task_title
      FROM activity_logs al
      LEFT JOIN tasks t ON al.task_id = t.id
      WHERE al.agent_id = ?
      ORDER BY al.timestamp DESC
      LIMIT 50
    `, [req.params.id]);

    res.json(logs);
  } catch (err) {
    console.error('GET /api/agents/:id/activity error:', err);
    res.status(500).json({ error: 'Failed to fetch agent activity' });
  }
});

module.exports = router;
