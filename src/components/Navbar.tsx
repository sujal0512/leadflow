import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  UserCheck, 
  Terminal, 
  FileCode2, 
  PlaySquare, 
  RotateCcw, 
  Layers, 
  Sparkles,
  ChevronDown,
  Globe,
  Mail
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSwitchUser: (role: 'admin' | 'member', userId?: string) => void;
  onResetDb: () => void;
  onOpenEmails: () => void;
  onLogout: () => void;
  users: User[];
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onSwitchUser,
  onResetDb,
  onOpenEmails,
  onLogout,
  users,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 shadow-md">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-blue-900/80 via-indigo-900/80 to-slate-900 px-4 py-1 text-xs text-blue-200 flex items-center justify-between border-b border-blue-800/40">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold text-white">Sujal Das's LeadTracker</span>
          <span className="text-slate-400">|</span>
          <span>Lead Management Platform & API Suite</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onResetDb}
            className="flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-2 py-0.5 rounded border border-slate-700 transition"
            title="Reset database to seed records"
          >
            <RotateCcw className="w-3 h-3 text-amber-400" />
            <span>Reset Demo DB</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">LeadHero</span>
                <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400">Sujal Das's LeadTracker</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'pipeline'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Pipeline & Leads</span>
            </button>

            <button
              onClick={() => setActiveTab('public_form')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'public_form'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Public Lead Form</span>
            </button>

            <button
              onClick={() => setActiveTab('api_docs')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'api_docs'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Terminal className="w-4 h-4 text-sky-400" />
              <span>REST API Explorer</span>
            </button>
          </nav>

          {/* User Role Switcher & Email Logs */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenEmails}
              className="p-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition relative"
              title="View Simulated Email Logs"
            >
              <Mail className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full ring-2 ring-slate-900 animate-pulse"></span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 px-3 py-1.5 rounded-lg text-sm text-white transition"
              >
              {currentUser ? (
                <>
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-blue-500/40"
                  />
                  <div className="text-left hidden sm:block">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium leading-tight">{currentUser.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          currentUser.role === 'admin'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {currentUser.role}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block leading-none">
                      {currentUser.title}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 text-slate-300">
                  <UserCheck className="w-4 h-4" />
                  <span>Select Role</span>
                </div>
              )}
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 divide-y divide-slate-800">
                <div className="px-3 py-2 text-xs font-semibold uppercase text-slate-400 tracking-wider">
                  Switch Active Persona
                </div>

                <div className="py-1">
                  {users.map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSwitchUser(u.role, u.id);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs transition ${
                        currentUser?.id === u.id
                          ? 'bg-blue-600/20 text-white border border-blue-500/30'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white truncate">{u.name}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                              u.role === 'admin'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {u.role}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block truncate">{u.title}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-2 px-3 pb-1 border-t border-slate-800">
                  <button
                    onClick={() => {
                      onLogout();
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left text-xs font-semibold text-rose-400 hover:text-rose-300 py-1"
                  >
                    Log Out
                  </button>
                  <div className="text-[11px] text-slate-400 mt-2">
                    <span className="text-amber-400 font-semibold">Note:</span> Admins can delete leads & run full administrative actions. Members are restricted to assigned lead updates.
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden flex items-center justify-between py-2 border-t border-slate-800 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === 'pipeline' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pipeline
          </button>
          <button
            onClick={() => setActiveTab('public_form')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === 'public_form' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Public Form
          </button>
          <button
            onClick={() => setActiveTab('api_docs')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === 'api_docs' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            REST API
          </button>
        </div>
      </div>
    </header>
  );
};
