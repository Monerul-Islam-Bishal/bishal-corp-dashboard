import { useState, useEffect } from 'react';
import { fetchReports, fetchDailySummary, fetchLogs, generateReport } from '../api/client';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [dailySummary, setDailySummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    async function load() {
      try {
        const [r, ds, l] = await Promise.all([
          fetchReports().catch(() => []),
          fetchDailySummary().catch(() => null),
          fetchLogs({ limit: 30 }).catch(() => []),
        ]);
        setReports(Array.isArray(r) ? r : []);
        setDailySummary(ds);
        setLogs(Array.isArray(l) ? l : []);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleGenerate = async (type) => {
    try {
      const report = await generateReport({ type, title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report` });
      setReports(prev => [report, ...prev]);
    } catch (err) {
      console.error('Failed to generate report:', err);
    }
  };

  const tabs = ['summary', 'reports', 'logs'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f8fafc]">Reports & Logs</h1>
          <p className="mt-1 text-sm text-[#94a3b8]">Activity history and analytics</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleGenerate('daily')}
            className="rounded-lg bg-[#6366f1]/80 px-3 py-1.5 text-xs text-white hover:bg-[#6366f1]">
            Daily Report
          </button>
          <button onClick={() => handleGenerate('weekly')}
            className="rounded-lg bg-[#6366f1]/80 px-3 py-1.5 text-xs text-white hover:bg-[#6366f1]">
            Weekly Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-[#334155] bg-[#1e293b] p-1">
        {tabs.map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium capitalize transition ${activeTab === t ? 'bg-[#6366f1] text-white' : 'text-[#94a3b8] hover:text-[#f8fafc]'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array(4).fill(null).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-[#334155] bg-[#1e293b] p-5">
              <div className="h-4 w-32 rounded bg-[#334155]" />
              <div className="mt-2 h-3 w-48 rounded bg-[#334155]" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Daily Summary Tab */}
          {activeTab === 'summary' && dailySummary && (
            <div className="rounded-xl border border-[#334155] bg-[#1e293b] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#f8fafc]">Today's Summary</h2>
                <span className="text-xs text-[#64748b]">{dailySummary.today}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { label: 'Tasks Completed', value: dailySummary.tasks_completed, color: '#6366f1' },
                  { label: 'Active Agents', value: `${dailySummary.active_agents} / ${dailySummary.total_agents}`, color: '#22c55e' },
                  { label: 'Avg Success Rate', value: `${dailySummary.avg_success_rate}%`, color: '#f59e0b' },
                  { label: 'Revenue MTD', value: `$${dailySummary.revenue}`, color: '#f8fafc' },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg border border-[#334155] bg-[#0f172a] p-4 text-center">
                    <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                    <p className="mt-1 text-xs text-[#94a3b8]">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-3">
              {reports.map((r) => (
                <div key={r.id} className="rounded-xl border border-[#334155] bg-[#1e293b] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-[#f8fafc]">{r.title}</h3>
                      <p className="text-xs text-[#64748b]">{r.summary || r.type} · {new Date(r.generated_at).toLocaleString()}</p>
                    </div>
                    <span className="rounded-md bg-[#6366f1]/10 px-2 py-0.5 text-xs capitalize text-[#6366f1]">{r.type}</span>
                  </div>
                </div>
              ))}
              {reports.length === 0 && (
                <p className="py-12 text-center text-sm text-[#64748b]">No reports yet. Generate one above!</p>
              )}
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className="rounded-xl border border-[#334155] bg-[#1e293b] p-5">
              <h2 className="mb-4 text-base font-semibold text-[#f8fafc]">Activity Logs</h2>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {logs.map((log) => {
                  const isErr = log.level === 'error';
                  const isWarn = log.level === 'warning';
                  const isSuc = log.level === 'success';
                  const dotColor = isErr ? '#ef4444' : isWarn ? '#f59e0b' : isSuc ? '#22c55e' : '#6366f1';
                  return (
                    <div key={log.id} className="flex items-center justify-between rounded-lg border border-[#334155] bg-[#0f172a] px-4 py-2">
                      <div className="flex items-center gap-3">
                        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: dotColor }} />
                        <div>
                          <p className="text-sm text-[#f8fafc]">{log.action}</p>
                          <p className="text-xs text-[#64748b]">{log.agent_name} · {log.details}</p>
                        </div>
                      </div>
                      <span className="text-xs text-[#64748b]">{formatTimeAgo(log.timestamp)}</span>
                    </div>
                  );
                })}
                {logs.length === 0 && (
                  <p className="py-8 text-center text-sm text-[#64748b]">No logs yet</p>
                )}
              </div>
            </div>
          )}
        </>
      )}
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
