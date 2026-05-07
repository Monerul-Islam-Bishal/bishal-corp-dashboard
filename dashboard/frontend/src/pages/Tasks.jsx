import { useState, useEffect } from 'react';
import { fetchTasks, fetchTaskHistory, createTask } from '../api/client';

const statusStyles = {
  'done': { bg: 'bg-[#22c55e]/10', text: 'text-[#22c55e]', dot: '#22c55e' },
  'in-progress': { bg: 'bg-[#6366f1]/10', text: 'text-[#6366f1]', dot: '#6366f1' },
  'pending': { bg: 'bg-[#f59e0b]/10', text: 'text-[#f59e0b]', dot: '#f59e0b' },
  'blocked': { bg: 'bg-[#ef4444]/10', text: 'text-[#ef4444]', dot: '#ef4444' },
  'qa-failed': { bg: 'bg-[#f59e0b]/10', text: 'text-[#f59e0b]', dot: '#f59e0b' },
  default: { bg: 'bg-[#64748b]/10', text: 'text-[#64748b]', dot: '#64748b' },
};

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', phase: 'Phase 1' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [taskList, taskHist] = await Promise.all([
          fetchTasks(statusFilter ? { status: statusFilter } : {}).catch(() => []),
          fetchTaskHistory().catch(() => []),
        ]);
        setTasks(Array.isArray(taskList) ? taskList : []);
        setHistory(Array.isArray(taskHist) ? taskHist : []);
      } catch (err) {
        console.error('Failed to load tasks:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [statusFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const task = await createTask(newTask);
      setTasks(prev => [task, ...prev]);
      setShowCreate(false);
      setNewTask({ title: '', description: '', phase: 'Phase 1' });
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f8fafc]">Tasks</h1>
          <p className="mt-1 text-sm text-[#94a3b8]">{loading ? '...' : `${tasks.length} tasks`}</p>
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-[#334155] bg-[#1e293b] px-3 py-2 text-sm text-[#f8fafc] outline-none"
          >
            <option value="">All Status</option>
            <option value="done">Done</option>
            <option value="in-progress">In Progress</option>
            <option value="pending">Pending</option>
            <option value="blocked">Blocked</option>
            <option value="qa-failed">QA Failed</option>
          </select>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="rounded-lg bg-[#6366f1] px-4 py-2 text-sm font-medium text-white hover:bg-[#4f46e5]"
          >
            + New Task
          </button>
        </div>
      </div>

      {/* Create Task Form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="rounded-xl border border-[#334155] bg-[#1e293b] p-5 space-y-4">
          <input
            type="text"
            placeholder="Task title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            required
            className="w-full rounded-lg border border-[#334155] bg-[#0f172a] px-4 py-2 text-sm text-[#f8fafc] placeholder-[#64748b] outline-none focus:border-[#6366f1]"
          />
          <textarea
            placeholder="Description (optional)"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-[#334155] bg-[#0f172a] px-4 py-2 text-sm text-[#f8fafc] placeholder-[#64748b] outline-none focus:border-[#6366f1]"
          />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowCreate(false)}
              className="rounded-lg border border-[#334155] px-4 py-2 text-sm text-[#94a3b8] hover:text-[#f8fafc]">
              Cancel
            </button>
            <button type="submit" disabled={creating}
              className="rounded-lg bg-[#6366f1] px-4 py-2 text-sm font-medium text-white hover:bg-[#4f46e5] disabled:opacity-50">
              {creating ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      )}

      {/* Task List */}
      {loading ? (
        <div className="space-y-3">
          {Array(5).fill(null).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-[#334155] bg-[#1e293b] p-5">
              <div className="h-4 w-48 rounded bg-[#334155]" />
              <div className="mt-2 h-3 w-32 rounded bg-[#334155]" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const s = statusStyles[task.status] || statusStyles.default;
            return (
              <div key={task.id} className="rounded-xl border border-[#334155] bg-[#1e293b] p-4 transition hover:border-[#6366f1]/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: s.dot }} />
                    <div>
                      <h3 className="text-sm font-medium text-[#f8fafc]">{task.title}</h3>
                      <p className="text-xs text-[#64748b]">{task.agent_name || 'Unassigned'} · {task.phase || 'No phase'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.qa_status && (
                      <span className={`rounded-md px-2 py-0.5 text-xs ${task.qa_status === 'passed' ? 'bg-[#22c55e]/10 text-[#22c55e]' : 'bg-[#ef4444]/10 text-[#ef4444]'}`}>
                        QA {task.qa_status}
                      </span>
                    )}
                    <span className={`rounded-md px-2 py-0.5 text-xs ${s.bg} ${s.text}`}>
                      {task.status}
                    </span>
                    {task.attempts > 0 && (
                      <span className="text-xs text-[#64748b]">({task.attempts} attempt{task.attempts > 1 ? 's' : ''})</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {tasks.length === 0 && (
            <p className="py-12 text-center text-sm text-[#64748b]">No tasks found</p>
          )}
        </div>
      )}

      {/* Task History */}
      {history.length > 0 && (
        <div className="rounded-xl border border-[#334155] bg-[#1e293b] p-5">
          <h3 className="mb-4 text-base font-semibold text-[#f8fafc]">Recent History</h3>
          <div className="space-y-2">
            {history.slice(0, 5).map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-lg border border-[#334155] bg-[#0f172a] px-4 py-2">
                <div>
                  <p className="text-sm text-[#f8fafc]">{h.title}</p>
                  <p className="text-xs text-[#64748b]">{h.agent_name} · {h.status}</p>
                </div>
                <span className={`rounded-md px-2 py-0.5 text-xs ${statusStyles[h.status]?.bg} ${statusStyles[h.status]?.text}`}>
                  {h.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
