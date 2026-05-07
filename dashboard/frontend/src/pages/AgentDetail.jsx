import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAgent, fetchAgentActivity } from '../api/client';

export default function AgentDetail() {
  const { id } = useParams();
  const [agent, setAgent] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [agentData, activityData] = await Promise.all([
          fetchAgent(id).catch(() => null),
          fetchAgentActivity(id).catch(() => []),
        ]);
        setAgent(agentData);
        setActivity(Array.isArray(activityData) ? activityData : []);
      } catch (err) {
        console.error('Failed to load agent:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 animate-pulse rounded bg-[#334155]" />
        <div className="h-48 animate-pulse rounded-xl border border-[#334155] bg-[#1e293b]" />
      </div>
    );
  }

  if (!agent) {
    return <p className="text-[#ef4444]">Agent not found</p>;
  }

  return (
    <div className="space-y-6">
      <Link to="/agents" className="text-sm text-[#6366f1] hover:text-[#4f46e5]">← Back to Agents</Link>

      <div className="rounded-xl border border-[#334155] bg-[#1e293b] p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#6366f1]/20">
            <span className="text-xl font-bold text-[#6366f1]">{agent.name?.charAt(0)}</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#f8fafc]">{agent.name}</h1>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-block h-2 w-2 rounded-full ${agent.status === 'working' ? 'animate-pulse bg-[#6366f1]' : agent.status === 'idle' ? 'bg-[#22c55e]' : agent.status === 'failed' ? 'bg-[#ef4444]' : 'bg-[#f59e0b]'}`} />
              <span className="text-sm capitalize text-[#94a3b8]">{agent.status}</span>
              <span className="text-sm text-[#64748b]">·</span>
              <span className="rounded-md bg-[#334155] px-2 py-0.5 text-xs text-[#94a3b8]">{agent.category}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-[#334155] bg-[#0f172a] p-4 text-center">
            <p className="text-2xl font-bold text-[#6366f1]">{agent.tasks_completed}</p>
            <p className="text-xs text-[#94a3b8]">Tasks Completed</p>
          </div>
          <div className="rounded-lg border border-[#334155] bg-[#0f172a] p-4 text-center">
            <p className="text-2xl font-bold text-[#22c55e]">{Math.round(agent.success_rate * 100)}%</p>
            <p className="text-xs text-[#94a3b8]">Success Rate</p>
          </div>
          <div className="rounded-lg border border-[#334155] bg-[#0f172a] p-4 text-center">
            <p className="text-2xl font-bold text-[#f59e0b]">
              {agent.task_stats?.total_tasks ?? '—'}
            </p>
            <p className="text-xs text-[#94a3b8]">Total Tasks</p>
          </div>
          <div className="rounded-lg border border-[#334155] bg-[#0f172a] p-4 text-center">
            <p className="text-2xl font-bold text-[#f8fafc]">
              {agent.task_stats?.completed_tasks ?? '—'}
            </p>
            <p className="text-xs text-[#94a3b8]">Completed</p>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="rounded-xl border border-[#334155] bg-[#1e293b] p-5">
        <h2 className="mb-4 text-base font-semibold text-[#f8fafc]">Activity History</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {activity.map((log) => (
            <div key={log.id} className="flex items-center justify-between rounded-lg border border-[#334155] bg-[#0f172a] px-4 py-3">
              <div>
                <p className="text-sm text-[#f8fafc]">{log.action}</p>
                <p className="text-xs text-[#64748b]">{log.details}</p>
              </div>
              <span className="text-xs text-[#64748b]">{formatTimeAgo(log.timestamp)}</span>
            </div>
          ))}
          {activity.length === 0 && (
            <p className="py-8 text-center text-sm text-[#64748b]">No activity recorded</p>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
