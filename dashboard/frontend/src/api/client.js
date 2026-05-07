const BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  };
  const response = await fetch(url, config);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Request failed: ${response.status}`);
  }
  return response.json();
}

/* ─── Agents ─── */
export function fetchAgents(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/agents${qs ? `?${qs}` : ''}`);
}
export function fetchAgent(id) {
  return request(`/agents/${id}`);
}
export function fetchAgentActivity(id) {
  return request(`/agents/${id}/activity`);
}
export function fetchAgentStats() {
  return request('/agents/stats/summary');
}

/* ─── Tasks ─── */
export function fetchTasks(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/tasks${qs ? `?${qs}` : ''}`);
}
export function fetchTask(id) {
  return request(`/tasks/${id}`);
}
export function createTask(data) {
  return request('/tasks', { method: 'POST', body: JSON.stringify(data) });
}
export function updateTask(id, data) {
  return request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}
export function fetchTaskHistory() {
  return request('/tasks/history/recent');
}

/* ─── Reports ─── */
export function fetchReports(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/reports${qs ? `?${qs}` : ''}`);
}
export function fetchReport(id) {
  return request(`/reports/${id}`);
}
export function fetchDailySummary() {
  return request('/reports/daily-summary');
}
export function fetchLogs(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/reports/logs${qs ? `?${qs}` : ''}`);
}
export function generateReport(data) {
  return request('/reports/generate', { method: 'POST', body: JSON.stringify(data) });
}

/* ─── Overview / Dashboard ─── */
export function fetchKpi() {
  return request('/overview/kpi');
}
export function fetchActivityFeed() {
  return request('/overview/activity-feed');
}
export function fetchMetrics(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/overview/metrics${qs ? `?${qs}` : ''}`);
}
