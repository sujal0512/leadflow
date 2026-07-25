import React from 'react';
import { Code2 } from 'lucide-react';

export const Footer: React.FC = () => {
  const devUrl = window.location.href;

  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 py-8 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-base mb-1">
              <Code2 className="w-5 h-5 text-blue-400" />
              <span>LeadTracker OS</span>
            </div>
            <p className="text-xs text-slate-400">
              Complete lead platform with role-based auth, and REST API.
            </p>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col sm:flex-row items-center gap-3">
            <div className="text-[11px] text-slate-400 font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800 text-ellipsis overflow-hidden max-w-xs">
              URL: {devUrl}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            © {new Date().getFullYear()} LeadTracker OS
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400">JWT & Token Auth</span>
            <span>•</span>
            <span className="hover:text-slate-400">Role Permissions</span>
            <span>•</span>
            <span className="hover:text-slate-400">REST API</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
