import React, { useEffect, useState } from 'react';
import { 
  X, 
  UserCheck, 
  Clock, 
  DollarSign, 
  Building2, 
  Mail, 
  Phone, 
  Send, 
  Trash2, 
  ShieldAlert, 
  Activity, 
  MessageSquare, 
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Lead, LeadActivity, LeadNote, LeadStatus, User } from '../types';
import { api } from '../lib/apiClient';

interface LeadDetailDrawerProps {
  leadId: string | null;
  currentUser: User | null;
  users: User[];
  onClose: () => void;
  onLeadUpdated: () => void;
}

const PIPELINE_STAGES: { id: LeadStatus; label: string; color: string }[] = [
  { id: 'new', label: 'New Lead', color: 'bg-sky-500' },
  { id: 'contacted', label: 'Contacted', color: 'bg-blue-500' },
  { id: 'discovery', label: 'Discovery Call', color: 'bg-indigo-500' },
  { id: 'proposal', label: 'Proposal Sent', color: 'bg-purple-500' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-amber-500' },
  { id: 'won', label: 'Won', color: 'bg-emerald-500' },
  { id: 'lost', label: 'Lost', color: 'bg-rose-500' },
];

export const LeadDetailDrawer: React.FC<LeadDetailDrawerProps> = ({
  leadId,
  currentUser,
  users,
  onClose,
  onLeadUpdated,
}) => {
  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'notes' | 'activity' | 'edit'>('notes');

  // Edit state
  const [editBudget, setEditBudget] = useState<number>(0);
  const [editAssignee, setEditAssignee] = useState<string>('');

  useEffect(() => {
    if (!leadId) return;
    fetchLeadData(leadId);
  }, [leadId]);

  const fetchLeadData = async (id: string) => {
    setLoading(true);
    setErrorMessage(null);
    const res = await api.getLeadById(id);
    if (res.success && res.data) {
      setLead(res.data);
      setNotes(res.data.notes || []);
      setActivities(res.data.activities || []);
      setEditBudget(res.data.budget);
      setEditAssignee(res.data.assignedToId || '');
    } else if (res.error) {
      setErrorMessage(res.error.message);
    }
    setLoading(false);
  };

  const handleStageChange = async (newStatus: LeadStatus) => {
    if (!lead) return;
    setErrorMessage(null);
    const res = await api.updateLead(lead.id, { status: newStatus });
    if (res.success && res.data) {
      setLead(res.data);
      onLeadUpdated();
      fetchLeadData(lead.id);
    } else if (res.error) {
      setErrorMessage(res.error.message);
    }
  };

  const handleAssigneeChange = async (newAssigneeId: string) => {
    if (!lead) return;
    setErrorMessage(null);
    const res = await api.updateLead(lead.id, { assignedToId: newAssigneeId || null as any });
    if (res.success && res.data) {
      setLead(res.data);
      setEditAssignee(newAssigneeId);
      onLeadUpdated();
      fetchLeadData(lead.id);
    } else if (res.error) {
      setErrorMessage(res.error.message);
    }
  };

  const handleBudgetSave = async () => {
    if (!lead) return;
    setErrorMessage(null);
    const res = await api.updateLead(lead.id, { budget: Number(editBudget) });
    if (res.success && res.data) {
      setLead(res.data);
      onLeadUpdated();
      fetchLeadData(lead.id);
    } else if (res.error) {
      setErrorMessage(res.error.message);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !newNote.trim()) return;
    setSubmittingNote(true);
    setErrorMessage(null);
    const res = await api.addLeadNote(lead.id, newNote);
    if (res.success) {
      setNewNote('');
      fetchLeadData(lead.id);
      onLeadUpdated();
    } else if (res.error) {
      setErrorMessage(res.error.message);
    }
    setSubmittingNote(false);
  };

  const handleDeleteLead = async () => {
    if (!lead) return;
    if (!confirm(`Are you sure you want to permanently purge lead "${lead.company}"? This action requires Admin role.`)) {
      return;
    }
    setErrorMessage(null);
    const res = await api.deleteLead(lead.id);
    if (res.success) {
      onLeadUpdated();
      onClose();
    } else if (res.error) {
      setErrorMessage(`[403 Permission Error] ${res.error.message}`);
    }
  };

  if (!leadId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-lg">
              {lead?.company.substring(0, 2).toUpperCase() || 'LD'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {lead?.company || 'Loading...'}
                {lead && (
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                      lead.score >= 80
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : lead.score >= 60
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    Score: {lead.score}/100
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">ID: {lead?.id} • Source: {lead?.source}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser?.role === 'admin' && (
              <button
                onClick={handleDeleteLead}
                className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 rounded-lg border border-rose-900/40 transition"
                title="Delete lead (Admin Only)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error Alert if Permission or Validation Fails */}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Action Restricted:</span> {errorMessage}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Loading lead details...
          </div>
        ) : lead ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Interactive Stage Pipeline Bar */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Pipeline Lifecycle Stage</span>
                <span className="text-blue-400 uppercase tracking-wider font-bold">{lead.status}</span>
              </div>

              <div className="grid grid-cols-7 gap-1 pt-1">
                {PIPELINE_STAGES.map(stage => {
                  const isActive = lead.status === stage.id;
                  return (
                    <button
                      key={stage.id}
                      onClick={() => handleStageChange(stage.id)}
                      className={`h-2.5 rounded-full transition-all relative group ${
                        isActive
                          ? `${stage.color} ring-2 ring-white/40 scale-105`
                          : 'bg-slate-800 hover:bg-slate-700'
                      }`}
                      title={`Change stage to ${stage.label}`}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-950 text-white text-[10px] py-1 px-2 rounded shadow-lg border border-slate-700 whitespace-nowrap z-20">
                        {stage.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Core Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                <span className="text-[11px] text-slate-400 uppercase font-semibold block mb-1">
                  Contact Person
                </span>
                <div className="text-sm text-white font-medium">{lead.name}</div>
                <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <a href={`mailto:${lead.email}`} className="hover:underline text-slate-300 truncate">
                    {lead.email}
                  </a>
                </div>
                {lead.phone && (
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{lead.phone}</span>
                  </div>
                )}
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                <span className="text-[11px] text-slate-400 uppercase font-semibold block mb-1">
                  Estimated Budget
                </span>
                <div className="text-lg text-emerald-400 font-bold">
                  ₹{lead.budget.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                  Service: <span className="text-blue-300">{lead.service.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            {/* Assignee & Quick Edit Panel */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Assigned Team Owner
                </span>
                {currentUser?.role === 'member' && lead.assignedToId && lead.assignedToId !== currentUser.id && (
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    View Only (Assigned to {lead.assignedToName})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <UserCheck className="w-5 h-5 text-blue-400" />
                <select
                  value={editAssignee}
                  onChange={e => handleAssigneeChange(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg p-2.5 flex-1 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Unassigned (Open Lead Pool)</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.title} - {u.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Navigation Tabs for Notes & Activity Trail */}
            <div className="border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`py-2 px-3 text-xs font-medium border-b-2 transition ${
                    activeTab === 'notes'
                      ? 'border-blue-500 text-blue-400 font-semibold'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 inline mr-1.5" />
                  Notes & Discussion ({notes.length})
                </button>

                <button
                  onClick={() => setActiveTab('activity')}
                  className={`py-2 px-3 text-xs font-medium border-b-2 transition ${
                    activeTab === 'activity'
                      ? 'border-blue-500 text-blue-400 font-semibold'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 inline mr-1.5" />
                  Immutable Activity Trail ({activities.length})
                </button>
              </div>
            </div>

            {/* TAB CONTENT: Notes */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                {/* Note Form */}
                <form onSubmit={handleAddNote} className="space-y-2">
                  <textarea
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Add an internal note or call update..."
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingNote || !newNote.trim()}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submittingNote ? 'Saving...' : 'Post Note'}</span>
                    </button>
                  </div>
                </form>

                {/* Notes List */}
                <div className="space-y-3">
                  {notes.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                      No internal notes recorded yet. Be the first to leave a call update.
                    </div>
                  ) : (
                    notes.map(note => (
                      <div
                        key={note.id}
                        className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-blue-300 flex items-center gap-1.5">
                            {note.authorName}
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded uppercase font-bold">
                              {note.authorRole}
                            </span>
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {new Date(note.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 whitespace-pre-wrap">{note.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: Activity Trail */}
            {activeTab === 'activity' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-400 flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                    <ShieldAlert className="w-4 h-4 text-emerald-400" />
                    Audit Log Enforcement
                  </span>
                  <span>Read-only system trail</span>
                </div>

                <div className="relative pl-6 border-l border-slate-800 space-y-4">
                  {activities.map(act => (
                    <div key={act.id} className="relative group">
                      <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-blue-500 ring-4 ring-slate-900"></div>
                      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white">{act.action}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(act.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">{act.details}</p>
                        <div className="text-[10px] text-slate-500">By: {act.userName}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
