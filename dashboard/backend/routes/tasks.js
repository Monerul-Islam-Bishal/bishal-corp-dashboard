const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// GET /api/tasks — list all tasks (with filters)
router.get('/', (req, res) => {
  try {
    const db = req.db;
    const { status, agent_id, phase, limit = 50, offset = 0 } = req.query;
    let sql = 'SELECT t.*, a.name as agent_name FROM tasks t LEFT JOIN agents a ON t.agent_id = a.id';
    const params = [];
    const conditions = [];

    if (status) { conditions.push('t.status = ?'); params.push(status); }
    if (agent_id) { conditions.push('t.agent_id = ?'); params.push(agent_id); }
    if (phase) { conditions.push('t.phase = ?'); params.push(phase); }

    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY t.created_at DESC';

    const tasks = db.query(sql, params);
    res.json(tasks);
  } catch (err) {
    console.error('GET /api/tasks error:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/history/recent — recent task history
router.get('/history/recent', (req, res) => {
  try {
    const db = req.db;
    const tasks = db.query(`
      SELECT t.*, a.name as agent_name
      FROM tasks t LEFT JOIN agents a ON t.agent_id = a.id
      WHERE t.status IN ('done', 'blocked', 'failed')
      ORDER BY t.updated_at DESC LIMIT 20
    `);
    res.json(tasks);
  } catch (err) {
    console.error('GET /api/tasks/history/recent error:', err);
    res.status(500).json({ error: 'Failed to fetch task history' });
  }
});

// GET /api/tasks/:id — single task details
router.get('/:id', (req, res) => {
  try {
    const db = req.db;
    const task = db.get('SELECT t.*, a.name as agent_name, a.category as agent_category FROM tasks t LEFT JOIN agents a ON t.agent_id = a.id WHERE t.id = ?', [req.params.id]);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const activity = db.query('SELECT * FROM activity_logs WHERE task_id = ? ORDER BY timestamp DESC LIMIT 20', [req.params.id]);
    res.json({ ...task, activity });
  } catch (err) {
    console.error('GET /api/tasks/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST /api/tasks — create a new task
router.post('/', (req, res) => {
  try {
    const db = req.db;
    const { title, description, agent_id, phase } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });

    const id = uuidv4();
    const now = new Date().toISOString();

    db.run('INSERT INTO tasks (id, title, description, agent_id, status, phase, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, title.trim(), description || null, agent_id || null, 'pending', phase || null, now, now]);
    db.run('INSERT INTO activity_logs (id, agent_id, task_id, action, details, level, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uuidv4(), agent_id || null, id, 'task_created', 'New task created: ' + title.trim(), 'info', now]);

    const task = db.get('SELECT * FROM tasks WHERE id = ?', [id]);
    res.status(201).json(task);
  } catch (err) {
    console.error('POST /api/tasks error:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PATCH /api/tasks/:id — update task status
router.patch('/:id', (req, res) => {
  try {
    const db = req.db;
    const { status, qa_status, agent_id } = req.body;
    const existing = db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    const now = new Date().toISOString();
    const updates = [];
    const params = [];

    if (status) { updates.push('status = ?'); params.push(status); if (status === 'done') { updates.push('completed_at = ?'); params.push(now); } }
    if (qa_status !== undefined) { updates.push('qa_status = ?'); params.push(qa_status); }
    if (agent_id) { updates.push('agent_id = ?'); params.push(agent_id); }
    updates.push('updated_at = ?'); params.push(now);
    params.push(req.params.id);

    db.run(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, params);
    db.run('INSERT INTO activity_logs (id, agent_id, task_id, action, details, level, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uuidv4(), existing.agent_id, req.params.id, status ? `task_${status}` : 'task_updated', `Task status: ${status || 'modified'}`, 'info', now]);

    const task = db.get('SELECT t.*, a.name as agent_name FROM tasks t LEFT JOIN agents a ON t.agent_id = a.id WHERE t.id = ?', [req.params.id]);
    res.json(task);
  } catch (err) {
    console.error('PATCH /api/tasks/:id error:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

module.exports = router;
