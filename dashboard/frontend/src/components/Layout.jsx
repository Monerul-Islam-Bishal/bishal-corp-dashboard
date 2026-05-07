import { useState } from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-14 items-center justify-between border-b border-[#334155] bg-[#0f172a] px-6 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-[#f8fafc]">Bishal Corp</h1>
            <span className="flex items-center gap-1.5 rounded-full bg-[#22c55e]/10 px-2.5 py-0.5 text-xs font-medium text-[#22c55e]">
              <span className="status-pulse inline-block h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
              All Systems
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="rounded-lg bg-[#1e293b] px-3 py-1.5 text-sm text-[#94a3b8] transition-colors hover:bg-[#334155] hover:text-[#f8fafc]"
            >
              + New Task
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6366f1] text-sm font-semibold text-white">
              B
            </div>
          </div>
        </header>
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-[#0f172a] p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
