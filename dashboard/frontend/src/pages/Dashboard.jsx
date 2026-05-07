import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { fetchKpi, fetchActivityFeed, fetchMetrics } from '../api/client';

const COLORS = { accent: '#6366f1', success: '#22c55e', warning: '#f59e0b', danger: '#ef4444', muted: '#64748b' };

function StatCard({ label, value, change, color, loading }) {
  return (
    <div className="rounded-xl border border-[#334155] bg-[#1e293b] p-5 transition hover:border-[#6366f1]/50">
      <p className="text-sm font-medium text-[#94a3b8]">{label}</p>
      {loading ? (
        <div className="mt-2 h-8 w-24 animate-pulse rounded bg-[#334155]" />
      ) : (
        <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
      )}
      {change && <p className="mt-1 text-xs text-[#64748b]">{change}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [kpi, setKpi] = useState(null);
  const [activity, setActivity] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [kpiData, activityData, metricsData] = await Promise.all([
          fetchKpi(),
          fetchActivityFeed(),
          fetchMetrics({ days: 30 }).catch(() => ({})),
        ]);
        setKpi(kpiData);
        setActivity(Array.isArray(activityData) ? activityData.slice(0, 8) : []);
        setMetrics(metricsData || {});
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const stats = [
    { label: 'Total Agents', value: kpi?.total_agents ?? '—', color: 'text-[#6366f1]' },
    { label: 'Active Now', value: kpi?.active_agents ?? '—', color: 'text-[#22c55e]' },
    { label: 'Tasks Completed', value: kpi?.completed_tasks ?? '—', color: 'text-[#f59e0b]' },
    { label: 'Revenue MTD', value: kpi ? `$${kpi.revenue_mtd?.toLocaleString()}` : '—', color: 'text-[#f8fafc]' },
  ];

  // Process weekly metrics from API
  const tasksByDay = metrics['tasks_by_day']?.data || [];
  const revenueByDay = metrics['revenue_by_day']?.data || [];
  const weeklyChartData = tasksByDay.map((t, i) => ({
    day: new Date(t.date).toLocaleDateString('en', { weekday: 'short' }),
    tasks: t.value,
    revenue: revenueByDay[i]?.value || 0,
  }));

  // Default chart data if API not ready
  const defaultChartData = [
    { day: 'Mon', tasks: 8, revenue: 240 }, { day: 'Tue', tasks: 12, revenue: 320 },
    { day: 'Wed', tasks: 5, revenue: 180 }, { day: 'Thu', tasks: 15, revenue: 450 },
    { day: 'Fri', tasks: 11, revenue: 380 }, { day: 'Sat', tasks: 7, revenue: 290 },
    { day: 'Sun', tasks: 4, revenue: 210 },
  ];

  const chartData = weeklyChartData.length > 0 ? weeklyChartData : defaultChartData;

  // Category distribution (pie chart)
  const categoryData = [
    { name: 'Engineering', value: 4, color: COLORS.accent },
    { name: 'Marketing', value: 3, color: COLORS.success },
    { name: 'Finance', value: 2, color: COLORS.warning },
    { name: 'Design', value: 1, color: COLORS.muted },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#f8fafc]">Dashboard</h1>
        <p className="mt-1 text-sm text-[#94a3b8]">
          Real-time view of your company {loading ? '' : `· ${kpi?.completed_today ?? 0} tasks completed today`}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} loading={loading} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue / Tasks Chart */}
        <div className="rounded-xl border border-[#334155] bg-[#1e293b] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#f8fafc]">Weekly Activity</h3>
            <span className="rounded-md bg-[#22c55e]/10 px-2 py-0.5 text-xs font-medium text-[#22c55e]">
              {kpi?.completion_rate ?? 0}% completion
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="tasksGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.accent} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }} />
                <Area type="monotone" dataKey="tasks" stroke={COLORS.accent} fill="url(#tasksGrad)" strokeWidth={2} name="Tasks" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Agent Distribution */}
        <div className="rounded-xl border border-[#334155] bg-[#1e293b] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#f8fafc]">Agent Categories</h3>
            <span className="rounded-md bg-[#6366f1]/10 px-2 py-0.5 text-xs font-medium text-[#6366f1]">
              {kpi?.total_agents ?? 0} total
            </span>
          </div>
          <div className="flex h-64 items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="ml-4 space-y-2">
              {categoryData.map((c) => (
                <div key={c.name} className="flex items-center gap-2 text-sm">
                  <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-[#94a3b8]">{c.name}</span>
                  <span className="text-[#f8fafc] font-medium">{c.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Status Summary + Activity Feed */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Status Summary */}
        <div className="rounded-xl border border-[#334155] bg-[#1e293b] p-5">
          <h3 className="mb-4 text-base font-semibold text-[#f8fafc]">Task Status Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Completed', value: kpi?.completed_tasks ?? 0, color: COLORS.success },
              { label: 'In Progress', value: kpi?.in_progress_tasks ?? 0, color: COLORS.accent },
              { label: 'Pending', value: kpi?.pending_tasks ?? 0, color: COLORS.warning },
              { label: 'Blocked', value: kpi?.blocked_tasks ?? 0, color: COLORS.danger },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-[#334155] bg-[#0f172a] p-4 text-center">
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="mt-1 text-xs text-[#94a3b8]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="rounded-xl border border-[#334155] bg-[#1e293b] p-5">
          <h3 className="mb-4 text-base font-semibold text-[#f8fafc]">Recent Activity</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {(loading ? Array(5).fill(null) : activity).map((item, i) => {
              if (loading) {
                return (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-[#334155] bg-[#0f172a] px-4 py-3">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-[#334155]" />
                    <div className="flex-1">
                      <div className="h-4 w-24 animate-pulse rounded bg-[#334155]" />
                      <div className="mt-1 h-3 w-32 animate-pulse rounded bg-[#334155]" />
                    </div>
                  </div>
                );
              }
              const isSuccess = item.level === 'success' || item.action?.includes('Completed');
              const isError = item.level === 'error';
              const isWarn = item.level === 'warning';
              const dotColor = isSuccess ? COLORS.success : isError ? COLORS.danger : isWarn ? COLORS.warning : COLORS.accent;
              const timeAgo = item.timestamp ? formatTimeAgo(item.timestamp) : '';
              return (
                <div key={item.id || i} className="flex items-center justify-between rounded-lg border border-[#334155] bg-[#0f172a] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: dotColor }} />
                    <div>
                      <p className="text-sm font-medium text-[#f8fafc]">{item.agent_name || 'Agent'}</p>
                      <p className="text-xs text-[#94a3b8]">{item.action} {item.details ? `- ${item.details}` : ''}</p>
                    </div>
                  </div>
                  <span className="text-xs text-[#64748b]">{timeAgo}</span>
                </div>
              );
            })}
            {!loading && activity.length === 0 && (
              <p className="py-8 text-center text-sm text-[#64748b]">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
