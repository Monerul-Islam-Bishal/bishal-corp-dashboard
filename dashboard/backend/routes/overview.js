const express = require('express');
const router = express.Router();

// GET /api/overview/kpi — KPI data
router.get('/kpi', (req, res) => {
  try {
    const db = req.db;
    const totalAgents = db.get('SELECT COUNT(*) as count FROM agents').count;
    const activeAgents = db.get("SELECT COUNT(*) as count FROM agents WHERE status = 'working'").count;
    const totalTasks = db.get('SELECT COUNT(*) as count FROM tasks').count;
    const completedTasks = db.get("SELECT COUNT(*) as count FROM tasks WHERE status = 'done'").count;
    const pendingTasks = db.get("SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'").count;
    const inProgressTasks = db.get("SELECT COUNT(*) as count FROM tasks WHERE status = 'in-progress'").count;
    const blockedTasks = db.get("SELECT COUNT(*) as count FROM tasks WHERE status = 'blocked'").count;
    const qaFailedTasks = db.get("SELECT COUNT(*) as count FROM tasks WHERE qa_status = 'failed'").count;
    const completedToday = db.get("SELECT COUNT(*) as count FROM tasks WHERE status = 'done' AND date(updated_at) = date('now')").count;
    const avgSuccess = db.get('SELECT COALESCE(ROUND(AVG(success_rate) * 100, 1), 0) as rate FROM agents').rate;
    const revenue = db.get("SELECT COALESCE(SUM(metric_value), 0) as total FROM metrics WHERE metric_key = 'revenue_mtd'").total;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      total_agents: totalAgents,
      active_agents: activeAgents,
      idle_agents: totalAgents - activeAgents,
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      pending_tasks: pendingTasks,
      in_progress_tasks: inProgressTasks,
      blocked_tasks: blockedTasks,
      qa_failed_tasks: qaFailedTasks,
      completed_today: completedToday,
      completion_rate: completionRate,
      avg_success_rate: avgSuccess,
      revenue_mtd: Math.round(revenue * 100) / 100,
    });
  } catch (err) {
    console.error('GET /api/overview/kpi error:', err);
    res.status(500).json({ error: 'Failed to fetch KPI data', details: err.message });
  }
});

// GET /api/overview/metrics — time-series metrics
router.get('/metrics', (req, res) => {
  try {
    const db = req.db;
    const { days = 30 } = req.query;

    const rows = db.query(`
      SELECT metric_key, metric_value, label, recorded_at
      FROM metrics WHERE julianday('now') - julianday(recorded_at) <= ?
      ORDER BY recorded_at ASC
    `, [Number(days)]);

    // Group by metric_key
    const grouped = {};
    for (const row of rows) {
      if (!grouped[row.metric_key]) grouped[row.metric_key] = { label: row.label, data: [] };
      grouped[row.metric_key].data.push({ value: row.metric_value, date: row.recorded_at.split('T')[0] });
    }

    res.json(grouped);
  } catch (err) {
    console.error('GET /api/overview/metrics error:', err);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// GET /api/overview/activity-feed — recent activity feed
router.get('/activity-feed', (req, res) => {
  try {
    const db = req.db;
    const entries = db.query(`
      SELECT al.id, al.action, al.details, al.level, al.timestamp,
             a.name as agent_name, a.category as agent_category,
             t.title as task_title
      FROM activity_logs al
      LEFT JOIN agents a ON al.agent_id = a.id
      LEFT JOIN tasks t ON al.task_id = t.id
      ORDER BY al.timestamp DESC LIMIT 20
    `);
    res.json(entries);
  } catch (err) {
    console.error('GET /api/overview/activity-feed error:', err);
    res.status(500).json({ error: 'Failed to fetch activity feed' });
  }
});

module.exports = router;
