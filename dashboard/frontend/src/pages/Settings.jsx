import { useState } from 'react';

export default function Settings() {
  const [companyName, setCompanyName] = useState('Bishal Corp');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#f8fafc]">Settings</h1>
        <p className="mt-1 text-sm text-[#94a3b8]">Configure your company dashboard</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Info */}
        <div className="rounded-xl border border-[#334155] bg-[#1e293b] p-5 space-y-4">
          <h2 className="text-base font-semibold text-[#f8fafc]">Company</h2>
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-1">Company Name</label>
            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
              className="w-full rounded-lg border border-[#334155] bg-[#0f172a] px-4 py-2 text-sm text-[#f8fafc] outline-none focus:border-[#6366f1]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-1">API Endpoint</label>
            <input type="text" defaultValue="http://localhost:3001/api" readOnly
              className="w-full rounded-lg border border-[#334155] bg-[#0f172a] px-4 py-2 text-sm text-[#64748b] outline-none cursor-not-allowed" />
          </div>
        </div>

        {/* Display */}
        <div className="rounded-xl border border-[#334155] bg-[#1e293b] p-5 space-y-4">
          <h2 className="text-base font-semibold text-[#f8fafc]">Display</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#f8fafc]">Dark Mode</p>
              <p className="text-xs text-[#64748b]">Currently forced dark theme</p>
            </div>
            <div className="h-6 w-11 rounded-full bg-[#6366f1] flex items-center px-0.5">
              <div className="h-5 w-5 rounded-full bg-white ml-auto" />
            </div>
          </div>
        </div>

        {/* Integration */}
        <div className="rounded-xl border border-[#334155] bg-[#1e293b] p-5 space-y-4">
          <h2 className="text-base font-semibold text-[#f8fafc]">Integrations</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#f8fafc]">The Agency (184 agents)</p>
              <p className="text-xs text-[#64748b]">Connected · OpenClaw sub-agents</p>
            </div>
            <span className="rounded-md bg-[#22c55e]/10 px-2 py-0.5 text-xs text-[#22c55e]">Active</span>
          </div>
        </div>

        <button type="submit"
          className="rounded-lg bg-[#6366f1] px-6 py-2 text-sm font-medium text-white hover:bg-[#4f46e5]">
          {saved ? '✓ Saved!' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
