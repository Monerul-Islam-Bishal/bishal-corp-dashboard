import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchAgents, fetchAgentStats } from '../api/client';

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [agentList, agentStats] = await Promise.all([
          fetchAgents().catch(() => []),
          fetchAgentStats().catch(() => null),
        ]);
        setAgents(Array.isArray(agentList) ? agentList : []);
        setStats(agentStats);
      } catch (err) {
        console.error('Failed to load agents:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = agents.filter(a =>
    a.name?.toLowerCase().includes(filter.toLowerCase()) ||
    a.category?.toLowerCase().includes(filter.toLowerCase())
  );

  const statusColor = (status) => {
    if (status === 'working') return '#6366f1';
    if (status === 'done' || status === 'idle') return '#22c55e';
    if (status === 'failed') return '#ef4444';
    return '#f59e0b';
  };
  const statusPulse = (status) => status === 'working' ? 'animate-pulse' : '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f8fafc]">Agents</h1>
          <p className="mt-1 text-sm text-[#94a3b8]">
            {loading ? 'Loading...' : `${agents.length} total agents`}
          </p>
        </div>
        <input
          type="text"
          placeholder="Search agents..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-[#334155] bg-[#1e293b] px-4 py-2 text-sm text-[#f8fafc] placeholder-[#64748b] outline-none focus:border-[#6366f1]"
        />
      </div>

      {/* Stats bar */}
      {stats && stats.summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <div className="rounded-lg border border-[#334155] bg-[#1e293b] p-3 text-center">
            <p className="text-lg font-bold text-[#6366f1]">{stats.summary.total_agents}</p>
            <p className="text-xs text-[#94a3b8]">Total</p>
          </div>
          <div className="rounded-lg border border-[#334155] bg-[#1e293b] p-3 text-center">
            <p className="text-lg font-bold text-[#22c55e]">{stats.summary.active_agents}</p>
            <p className="text-xs text-[#94a3b8]">Active</p>
          </div>
          <div className="rounded-lg border border-[#334155] bg-[#1e293b] p-3 text-center">
            <p className="text-lg font-bold text-[#f8fafc]">{stats.summary.total_tasks_completed}</p>
            <p className="text-xs text-[#94a3b8]">Tasks Done</p>
          </div>
          <div className="rounded-lg border border-[#334155] bg-[#1e293b] p-3 text-center">
            <p className="text-lg font-bold text-[#f8fafc]">{stats.summary.avg_success_rate}%</p>
            <p className="text-xs text-[#94a3b8]">Success Rate</p>
          </div>
        </div>
      )}

      {/* Agent Cards */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array(6).fill(null).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-[#334155] bg-[#1e293b] p-5">
              <div className="mb-3 h-4 w-32 rounded bg-[#334155]" />
              <div className="h-3 w-20 rounded bg-[#334155]" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((agent) => (
            <Link
              key={agent.id}
              to={`/agents/${agent.id}`}
              className="rounded-xl border border-[#334155] bg-[#1e293b] p-5 transition hover:border-[#6366f1]/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`inline-block h-3 w-3 rounded-full ${statusPulse(agent.status)}`}
                    style={{ backgroundColor: statusColor(agent.status) }} />
                  <h3 className="text-base font-semibold text-[#f8fafc]">{agent.name}</h3>
                </div>
                <span className="rounded-md bg-[#334155] px-2 py-0.5 text-xs text-[#94a3b8]">
                  {agent.category}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <p className="text-[#f8fafc] font-medium">{agent.tasks_completed}</p>
                  <p className="text-[#64748b]">Tasks</p>
                </div>
                <div>
                  <p className="text-[#22c55e] font-medium">{Math.round(agent.success_rate * 100)}%</p>
                  <p className="text-[#64748b]">Success</p>
                </div>
                <div>
                  <p className="text-[#f8fafc] font-medium capitalize">{agent.status}</p>
                  <p className="text-[#64748b]">Status</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
