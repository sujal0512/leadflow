import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  UserCheck, 
  DollarSign, 
  TrendingUp, 
  CheckCircle2, 
  BarChart3, 
  Building2, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical, 
  Trash2, 
  Eye, 
  Sparkles,
  ArrowUpDown,
  AlertCircle,
  Download,
  Upload
} from 'lucide-react';
import { Lead, LeadService, LeadStatus, PipelineStats, User } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '../lib/apiClient';

interface LeadPipelineViewProps {
  currentUser: User | null;
  users: User[];
  onSelectLead: (leadId: string) => void;
}

const STAGES: { id: LeadStatus; label: string; badgeColor: string; barColor: string }[] = [
  { id: 'new', label: 'New Lead', badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30', barColor: 'bg-sky-500' },
  { id: 'contacted', label: 'Contacted', badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30', barColor: 'bg-blue-500' },
  { id: 'discovery', label: 'Discovery Call', badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', barColor: 'bg-indigo-500' },
  { id: 'qualified', label: 'Qualified', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', barColor: 'bg-cyan-500' },
  { id: 'proposal', label: 'Proposal Sent', badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30', barColor: 'bg-purple-500' },
  { id: 'negotiation', label: 'Negotiation', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30', barColor: 'bg-amber-500' },
  { id: 'won', label: 'Won', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', barColor: 'bg-emerald-500' },
  { id: 'lost', label: 'Lost', badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30', barColor: 'bg-rose-500' },
];

export const LeadPipelineView: React.FC<LeadPipelineViewProps> = ({
  currentUser,
  users,
  onSelectLead,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('table');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const dynamicStages = React.useMemo(() => {
    const defaultStageIds = STAGES.map(s => s.id);
    const existingStages = [...STAGES];
    
    if (stats?.byStatus) {
      Object.keys(stats.byStatus).forEach(statusId => {
        if (!defaultStageIds.includes(statusId)) {
          existingStages.push({
            id: statusId,
            label: statusId.charAt(0).toUpperCase() + statusId.slice(1).replace(/_/g, ' '),
            badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
            barColor: 'bg-slate-500'
          });
        }
      });
    }
    return existingStages;
  }, [stats?.byStatus]);

  const dynamicHeaders = React.useMemo(() => {
    const headers = new Set<string>();
    leads.forEach(lead => {
      if (lead.extraData) {
        Object.keys(lead.extraData).forEach(key => {
          // ignore internal known ones if they got in
          const kLower = key.toLowerCase();
          if (!['name', 'email', 'company', 'phone', 'budget', 'status', 'service', 'id', 'score'].includes(kLower)) {
            headers.add(key);
          }
        });
      }
    });
    return Array.from(headers);
  }, [leads]);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [serviceFilter, setServiceFilter] = useState<string>('');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalLeadsCount, setTotalLeadsCount] = useState<number>(0);

  // New Lead Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [newLeadData, setNewLeadData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    service: 'shopify_dev' as LeadService,
    budget: 25000,
    status: 'new' as LeadStatus,
    assignedToId: '',
  });

  useEffect(() => {
    fetchData();
  }, [search, statusFilter, serviceFilter, assigneeFilter, sortBy, sortOrder, page, limit]);

  const fetchData = async () => {
    setLoading(true);
    setErrorMessage(null);

    const [leadsRes, statsRes] = await Promise.all([
      api.getLeads({
        search,
        status: statusFilter,
        service: serviceFilter,
        assignedTo: assigneeFilter,
        sortBy,
        sortOrder,
        page,
        limit: viewMode === 'kanban' ? 50 : limit,
      }),
      api.getStats(),
    ]);

    if (leadsRes.success && leadsRes.data) {
      setLeads(leadsRes.data);
      if (leadsRes.meta) {
        setTotalPages(leadsRes.meta.totalPages);
        setTotalLeadsCount(leadsRes.meta.total);
      }
    } else if (leadsRes.error) {
      setErrorMessage(leadsRes.error.message);
    }

    if (statsRes.success && statsRes.data) {
      setStats(statsRes.data);
    }

    setLoading(false);
  };

  const handleStageAdvance = async (leadId: string, currentStatus: LeadStatus, nextStatus: LeadStatus) => {
    const res = await api.updateLead(leadId, { status: nextStatus });
    if (res.success) {
      fetchData();
    } else if (res.error) {
      setErrorMessage(`[Permission Denied] ${res.error.message}`);
    }
  };

  const handleDeleteLead = async (lead: Lead) => {
    if (!confirm(`Are you sure you want to delete lead "${lead.company}"?`)) return;
    const res = await api.deleteLead(lead.id);
    if (res.success) {
      fetchData();
    } else if (res.error) {
      setErrorMessage(`[403 Forbidden] ${res.error.message}`);
    }
  };

  const handleCreateLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadData.name || !newLeadData.email || !newLeadData.company) {
      alert('Please fill in required fields (Name, Email, Company)');
      return;
    }

    const res = await api.createLead(newLeadData);
    if (res.success) {
      setShowNewModal(false);
      setNewLeadData({
        name: '',
        email: '',
        phone: '',
        company: '',
        service: 'shopify_dev',
        budget: 25000,
        status: 'new',
        assignedToId: '',
      });
      fetchData();
    } else if (res.error) {
      alert(res.error.message);
    }
  };

  const handleExportCSV = async () => {
    try {
      setLoading(true);
      // Fetch all leads without pagination limit to export full DB
      const res = await api.getLeads({ limit: 10000 });
      if (res.success && res.data) {
        const allLeads = res.data;
        if (allLeads.length === 0) {
          alert('No leads to export');
          return;
        }

        const headers = ['ID', 'Name', 'Email', 'Company', 'Phone', 'Service', 'Budget', 'Status', 'Score', 'Assigned To', 'Created At'];
        const csvRows = [headers.join(',')];

        for (const lead of allLeads) {
          const row = [
            lead.id,
            `"${lead.name.replace(/"/g, '""')}"`,
            `"${lead.email.replace(/"/g, '""')}"`,
            `"${lead.company.replace(/"/g, '""')}"`,
            `"${lead.phone.replace(/"/g, '""')}"`,
            lead.service,
            lead.budget,
            lead.status,
            lead.score,
            `"${(lead.assignedToName || 'Unassigned').replace(/"/g, '""')}"`,
            lead.createdAt
          ];
          csvRows.push(row.join(','));
        }

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert('Failed to fetch leads for export');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during export');
    } finally {
      setLoading(false);
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const text = await file.text();
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length <= 1) {
        alert('CSV file is empty or missing data rows');
        return;
      }

      await api.clearLeads();

      const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const headersLower = rawHeaders.map(h => h.toLowerCase());
      
      const nameIdx = headersLower.findIndex(h => h.includes('name'));
      const emailIdx = headersLower.findIndex(h => h.includes('email'));
      const companyIdx = headersLower.findIndex(h => h.includes('company'));
      const phoneIdx = headersLower.findIndex(h => h.includes('phone'));
      const budgetIdx = headersLower.findIndex(h => h.includes('budget') || h.includes('amount') || h.includes('value'));
      const statusIdx = headersLower.findIndex(h => h.includes('status') || h.includes('stage'));
      const serviceIdx = headersLower.findIndex(h => h.includes('service') || h.includes('product'));
      
      let importedCount = 0;
      for (let i = 1; i < lines.length; i++) {
        // Handle CSV split carefully to not split inside quotes
        // This is a naive regex-based splitter that handles basic quotes
        let row: string[] = [];
        let match;
        const regex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
        let line = lines[i];
        if(!line) continue;
        
        // Simpler split that ignores quotes for now to keep it fast and less error prone for complex strings
        row = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
        if (row.length === 0 || (row.length === 1 && !row[0])) continue;
        
        const extraData: Record<string, any> = {};
        for(let c = 0; c < row.length; c++) {
          if (c < rawHeaders.length) {
            extraData[rawHeaders[c]] = row[c];
          }
        }
        
        const newLead = {
          name: nameIdx !== -1 && row[nameIdx] ? row[nameIdx] : (companyIdx !== -1 && row[companyIdx] ? `Contact at ${row[companyIdx]}` : `Lead ${i}`),
          email: emailIdx !== -1 && row[emailIdx] ? row[emailIdx] : `unknown${i}@example.com`,
          company: companyIdx !== -1 && row[companyIdx] ? row[companyIdx] : `Company ${i}`,
          phone: phoneIdx !== -1 && row[phoneIdx] ? row[phoneIdx] : '',
          service: serviceIdx !== -1 && row[serviceIdx] ? row[serviceIdx] : 'general',
          budget: budgetIdx !== -1 && row[budgetIdx] ? (parseInt(row[budgetIdx].replace(/[^0-9]/g, ''), 10) || 5000) : 5000,
          status: statusIdx !== -1 && row[statusIdx] ? row[statusIdx].toLowerCase().replace(/[^a-z0-9_]/g, '_') : 'new',
          extraData
        };
        
        await api.createLead(newLead);
        importedCount++;
      }
      
      alert(`Successfully imported ${importedCount} records!`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('An error occurred during import');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClearData = async () => {
    if (!window.confirm('Are you sure you want to delete all leads? This action cannot be undone.')) {
      return;
    }
    try {
      setLoading(true);
      await api.clearLeads();
      alert('All leads have been deleted.');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to clear leads.');
    } finally {
      setLoading(false);
    }
  };

  const getHexColor = (barColor: string) => {
    if (barColor.includes('sky')) return '#0ea5e9';
    if (barColor.includes('blue')) return '#3b82f6';
    if (barColor.includes('indigo')) return '#6366f1';
    if (barColor.includes('cyan')) return '#06b6d4';
    if (barColor.includes('purple')) return '#a855f7';
    if (barColor.includes('amber')) return '#f59e0b';
    if (barColor.includes('emerald')) return '#10b981';
    if (barColor.includes('rose')) return '#f43f5e';
    return '#3b82f6';
  };

  const chartData = dynamicStages.map(s => ({
    name: s.label,
    count: stats?.byStatus?.[s.id]?.count || 0,
    color: getHexColor(s.barColor),
  }));

  return (
    <div className="space-y-6">
      {/* Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Total Leads</div>
          <div className="text-2xl font-bold text-white mt-1">
            {stats?.totalLeads ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Active in database</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Pipeline Value</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">
            ₹{(stats?.totalPipelineValue ?? 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Gross potential value</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Won Revenue</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            ₹{(stats?.wonValue ?? 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Closed deals value</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Conversion Rate</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {stats?.conversionRate ?? 0}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Won / Total leads ratio</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl col-span-2 md:col-span-1">
          <div className="text-xs text-slate-400 font-medium">Avg Deal Size</div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">
            ₹{(stats?.avgDealSize ?? 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Per client contract</div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="text-sm text-slate-300 font-semibold mb-4">Leads by Status</div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={0} angle={-30} textAnchor="end" />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip 
                cursor={{ fill: '#334155', opacity: 0.4 }} 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }} 
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by company, contact name, or email..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            {/* View Mode Switcher */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center">
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'kanban'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'table'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Table View</span>
              </button>
            </div>

            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef} 
              onChange={handleImportCSV} 
              className="hidden" 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-700 transition"
              title="Import leads from CSV"
            >
              <Upload className="w-4 h-4" />
              <span>Import CSV</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={loading}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-700 transition"
              title="Export database to CSV"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleClearData}
              disabled={loading}
              className="flex items-center gap-1.5 bg-red-900/30 hover:bg-red-800/40 text-red-400 text-xs font-semibold px-4 py-2 rounded-xl border border-red-800/50 transition"
              title="Delete all data"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Data</span>
            </button>

            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-lg shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create Lead</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800 text-xs">
          <div>
            <label className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
              Filter Status
            </label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {dynamicStages.map(s => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
              Filter Service
            </label>
            <select
              value={serviceFilter}
              onChange={e => setServiceFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Services</option>
              <option value="shopify_dev">Shopify Development</option>
              <option value="web_dev">Web Development</option>
              <option value="performance_marketing">Performance Marketing</option>
              <option value="full_stack_build">Full Stack Build</option>
              <option value="cro_audit">CRO & Speed Audit</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
              Assigned Owner
            </label>
            <select
              value={assigneeFilter}
              onChange={e => setAssigneeFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Team Owners</option>
              <option value="unassigned">Unassigned Pool</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
              Sort Order
            </label>
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={e => {
                const [sb, so] = e.target.value.split('_');
                setSortBy(sb);
                setSortOrder(so as any);
              }}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="createdAt_desc">Newest First</option>
              <option value="budget_desc">Highest Budget</option>
              <option value="score_desc">Highest Lead Score</option>
              <option value="updatedAt_desc">Recently Updated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Permission or Error Banner */}
      {errorMessage && (
        <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* VIEW 1: KANBAN BOARD */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
          {dynamicStages.map(stage => {
            const stageLeads = leads.filter(l => l.status === stage.id);
            const stageTotalVal = stageLeads.reduce((acc, curr) => acc + curr.budget, 0);

            return (
              <div
                key={stage.id}
                className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 flex flex-col w-full"
              >
                {/* Column Header */}
                <div className="pb-3 mb-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${stage.barColor}`}></div>
                    <span className="text-xs font-bold text-white">{stage.label}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-semibold">
                      {stageLeads.length}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-400">
                    ₹{(stageTotalVal / 1000).toFixed(0)}k
                  </span>
                </div>

                {/* Lead Cards List */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                  {stageLeads.length === 0 ? (
                    <div className="text-center py-8 text-[11px] text-slate-600 border border-dashed border-slate-800/80 rounded-xl">
                      No leads in stage
                    </div>
                  ) : (
                    stageLeads.map(lead => (
                      <div
                        key={lead.id}
                        onClick={() => onSelectLead(lead.id)}
                        className="bg-slate-950 hover:bg-slate-800/90 border border-slate-800/80 hover:border-blue-500/50 rounded-xl p-3.5 space-y-2.5 cursor-pointer transition shadow-sm group"
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-xs font-bold text-white group-hover:text-blue-300 transition line-clamp-1">
                            {lead.company}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                              lead.score >= 80
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : lead.score >= 60
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {lead.score} pts
                          </span>
                        </div>

                        <div className="text-xs text-slate-400">{lead.name}</div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                          <span className="font-bold text-emerald-400">
                            ₹{lead.budget.toLocaleString()}
                          </span>
                          <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                            {lead.service.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Assignee & Stage Quick Advance */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <UserCheck className="w-3 h-3 text-blue-400" />
                            <span>{lead.assignedToName || 'Unassigned'}</span>
                          </div>

                          {/* Quick Stage Controls */}
                          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            {stage.id !== 'won' && stage.id !== 'lost' && (
                              <button
                                onClick={() => {
                                  const stageIdx = dynamicStages.findIndex(s => s.id === stage.id);
                                  if (stageIdx < dynamicStages.length - 1) {
                                    handleStageAdvance(lead.id, stage.id, dynamicStages[stageIdx + 1].id);
                                  }
                                }}
                                className="text-[10px] bg-blue-600/30 hover:bg-blue-600 text-blue-200 px-1.5 py-0.5 rounded border border-blue-500/40 transition"
                                title="Advance Stage"
                              >
                                →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VIEW 2: DETAILED DATA TABLE */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Company & Contact</th>
                  <th className="p-3.5">Status Stage</th>
                  <th className="p-3.5">Service</th>
                  <th className="p-3.5">Budget</th>
                  <th className="p-3.5">Lead Score</th>
                  <th className="p-3.5">Assigned Owner</th>
                  {dynamicHeaders.map(header => (
                    <th key={header} className="p-3.5 whitespace-nowrap">{header}</th>
                  ))}
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={7 + dynamicHeaders.length} className="text-center py-12 text-slate-500">
                      No matching leads found. Try relaxing search filters.
                    </td>
                  </tr>
                ) : (
                  leads.map(lead => (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-800/50 transition cursor-pointer"
                      onClick={() => onSelectLead(lead.id)}
                    >
                      <td className="p-3.5">
                        <div className="font-bold text-white">{lead.company}</div>
                        <div className="text-slate-400 text-[11px]">
                          {lead.name} • {lead.email}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            dynamicStages.find(s => s.id === lead.status)?.badgeColor || 'bg-slate-800'
                          }`}
                        >
                          {dynamicStages.find(s => s.id === lead.status)?.label || lead.status}
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-300 capitalize">
                        {lead.service.replace('_', ' ')}
                      </td>

                      <td className="p-3.5 font-bold text-emerald-400">
                        ₹{lead.budget.toLocaleString()}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                            lead.score >= 80
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : lead.score >= 60
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {lead.score} / 100
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className="text-slate-300 font-medium">
                          {lead.assignedToName || 'Unassigned'}
                        </span>
                      </td>

                      {dynamicHeaders.map(header => (
                        <td key={header} className="p-3.5 text-slate-400">
                          {lead.extraData?.[header] || '-'}
                        </td>
                      ))}

                      <td className="p-3.5 text-right space-x-2" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectLead(lead.id)}
                          className="p-1.5 text-blue-400 hover:text-white hover:bg-blue-600/30 rounded-lg transition"
                          title="View Lead Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {currentUser?.role === 'admin' && (
                          <button
                            onClick={() => handleDeleteLead(lead)}
                            className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-900/40 rounded-lg transition"
                            title="Delete Lead (Admin Only)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Footer */}
          <div className="bg-slate-950 p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
            <div>
              Showing Page <span className="font-bold text-white">{page}</span> of{' '}
              <span className="font-bold text-white">{totalPages}</span> ({totalLeadsCount} total leads)
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="flex items-center gap-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 px-3 py-1.5 rounded-lg text-white transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="flex items-center gap-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 px-3 py-1.5 rounded-lg text-white transition"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW LEAD MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" />
                <span>Create New Lead Record</span>
              </h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLeadSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={newLeadData.company}
                  onChange={e => setNewLeadData({ ...newLeadData, company: e.target.value })}
                  placeholder="e.g. Example Retail Co."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={newLeadData.name}
                    onChange={e => setNewLeadData({ ...newLeadData, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={newLeadData.email}
                    onChange={e => setNewLeadData({ ...newLeadData, email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Service Required</label>
                  <select
                    value={newLeadData.service}
                    onChange={e => setNewLeadData({ ...newLeadData, service: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  >
                    <option value="shopify_dev">Shopify Development</option>
                    <option value="web_dev">Web Development</option>
                    <option value="performance_marketing">Performance Marketing</option>
                    <option value="full_stack_build">Full Stack Build</option>
                    <option value="cro_audit">CRO Audit</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Estimated Budget (₹)</label>
                  <input
                    type="number"
                    value={newLeadData.budget}
                    onChange={e => setNewLeadData({ ...newLeadData, budget: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Assign Team Member</label>
                <select
                  value={newLeadData.assignedToId}
                  onChange={e => setNewLeadData({ ...newLeadData, assignedToId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                >
                  <option value="">Unassigned</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.title})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500"
                >
                  Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
