import React, { useState } from 'react';
import { 
  Terminal, 
  Play, 
  Copy, 
  Check, 
  Key, 
  Globe, 
  Lock, 
  ShieldAlert, 
  Code2,
  Sparkles
} from 'lucide-react';
import { User } from '../types';

interface ApiExplorerViewProps {
  currentUser: User | null;
  users: User[];
}

interface EndpointConfig {
  id: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  authRequired: boolean;
  requiredRole?: 'admin' | 'member';
  defaultBody?: any;
}

const ENDPOINTS: EndpointConfig[] = [
  {
    id: 'get_leads',
    method: 'GET',
    path: '/api/leads?page=1&limit=5&sortBy=createdAt&sortOrder=desc',
    description: 'Fetch paginated list of leads with filtering and search.',
    authRequired: true,
  },
  {
    id: 'public_lead',
    method: 'POST',
    path: '/api/leads/public',
    description: 'Public lead capture form capture (No auth required).',
    authRequired: false,
    defaultBody: {
      name: 'Rohit Sharma',
      email: 'rohit@example.com',
      company: 'Titanium Gear Corp',
      service: 'shopify_dev',
      budget: 40000,
      message: 'Looking for custom Shopify Plus theme overhaul.',
    },
  },
  {
    id: 'get_lead_by_id',
    method: 'GET',
    path: '/api/leads/lead_101',
    description: 'Get detailed information for a single lead record including notes and activity trail.',
    authRequired: true,
  },
  {
    id: 'update_lead',
    method: 'PATCH',
    path: '/api/leads/lead_101',
    description: 'Update lead pipeline stage or budget (Member restricted to assigned leads).',
    authRequired: true,
    defaultBody: {
      status: 'proposal',
      budget: 50000,
    },
  },
  {
    id: 'delete_lead',
    method: 'DELETE',
    path: '/api/leads/lead_101',
    description: 'Purge lead record. ADMIN ONLY (Returns 403 Forbidden for Member role).',
    authRequired: true,
    requiredRole: 'admin',
  },
  {
    id: 'add_note',
    method: 'POST',
    path: '/api/leads/lead_101/notes',
    description: 'Post internal note to a lead.',
    authRequired: true,
    defaultBody: {
      content: 'Client confirmed budget approval on discovery call.',
    },
  },
  {
    id: 'get_stats',
    method: 'GET',
    path: '/api/stats',
    description: 'Get sales pipeline aggregate metrics and status distribution.',
    authRequired: true,
  },
];

export const ApiExplorerView: React.FC<ApiExplorerViewProps> = ({ currentUser, users }) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointConfig>(ENDPOINTS[0]);
  const [activeTokenOption, setActiveTokenOption] = useState<'admin' | 'member' | 'none'>('admin');
  const [requestPath, setRequestPath] = useState(selectedEndpoint.path);
  const [requestBody, setRequestBody] = useState(
    selectedEndpoint.defaultBody ? JSON.stringify(selectedEndpoint.defaultBody, null, 2) : ''
  );

  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [responseBody, setResponseBody] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [durationMs, setDurationMs] = useState<number | null>(null);

  const adminUser = users.find(u => u.role === 'admin') || users[0];
  const memberUser = users.find(u => u.role === 'member') || users[1];

  const getEffectiveToken = () => {
    if (activeTokenOption === 'admin') return `token_${adminUser.id}`;
    if (activeTokenOption === 'member') return `token_${memberUser.id}`;
    return '';
  };

  const handleEndpointSelect = (ep: EndpointConfig) => {
    setSelectedEndpoint(ep);
    setRequestPath(ep.path);
    setRequestBody(ep.defaultBody ? JSON.stringify(ep.defaultBody, null, 2) : '');
    setResponseBody(null);
    setResponseStatus(null);
  };

  const generateCurlCommand = () => {
    const token = getEffectiveToken();
    const headers = [];
    headers.push('-H "Content-Type: application/json"');
    if (token) {
      headers.push(`-H "Authorization: Bearer ${token}"`);
    }

    let cmd = `curl -X ${selectedEndpoint.method} "${window.location.origin}${requestPath}" \\\n  ${headers.join(' \\\n  ')}`;
    if (
      (selectedEndpoint.method === 'POST' || selectedEndpoint.method === 'PATCH') &&
      requestBody.trim()
    ) {
      cmd += ` \\\n  -d '${requestBody.replace(/\n/g, '')}'`;
    }
    return cmd;
  };

  const handleExecute = async () => {
    setLoading(true);
    setResponseBody(null);
    setResponseStatus(null);
    const start = Date.now();

    const token = getEffectiveToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const fetchOpts: RequestInit = {
        method: selectedEndpoint.method,
        headers,
      };

      if (
        (selectedEndpoint.method === 'POST' || selectedEndpoint.method === 'PATCH') &&
        requestBody.trim()
      ) {
        fetchOpts.body = requestBody;
      }

      const res = await fetch(requestPath, fetchOpts);
      const end = Date.now();
      setDurationMs(end - start);
      setResponseStatus(res.status);

      const resHeaders: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        resHeaders[key] = val;
      });
      setResponseHeaders(resHeaders);

      const json = await res.json();
      setResponseBody(json);
    } catch (err: any) {
      setResponseStatus(500);
      setResponseBody({ success: false, error: { message: err.message } });
    }
    setLoading(false);
  };

  const copyCurl = () => {
    navigator.clipboard.writeText(generateCurlCommand());
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">
            <Terminal className="w-4 h-4" />
            <span>Interactive REST API Contract & Sandbox</span>
          </div>
          <h2 className="text-xl font-bold text-white">LeadTracker Lead Platform API</h2>
          <p className="text-xs text-slate-400 mt-1">
            Execute real HTTP endpoints, verify auth status codes (401, 403, 200), copy cURL queries, and inspect responses.
          </p>
        </div>

        {/* Token Mode Selection */}
        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-semibold uppercase px-2">Bearer Token:</span>
          <button
            onClick={() => setActiveTokenOption('admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTokenOption === 'admin'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Admin Token
          </button>
          <button
            onClick={() => setActiveTokenOption('member')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTokenOption === 'member'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Member Token
          </button>
          <button
            onClick={() => setActiveTokenOption('none')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTokenOption === 'none'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Unauthenticated
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Endpoints List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
            Available Endpoints
          </div>

          <div className="space-y-1.5">
            {ENDPOINTS.map(ep => {
              const isSelected = selectedEndpoint.id === ep.id;
              return (
                <button
                  key={ep.id}
                  onClick={() => handleEndpointSelect(ep)}
                  className={`w-full p-3 rounded-xl border text-left transition ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        ep.method === 'GET'
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          : ep.method === 'POST'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : ep.method === 'PATCH'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {ep.method}
                    </span>

                    {ep.requiredRole && (
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 font-bold uppercase">
                        {ep.requiredRole} Only
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-mono font-semibold text-slate-200 truncate">
                    {ep.path}
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{ep.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Request & Response Sandbox */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Config Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-extrabold px-2.5 py-1 rounded-md uppercase ${
                    selectedEndpoint.method === 'GET'
                      ? 'bg-sky-500/20 text-sky-300'
                      : selectedEndpoint.method === 'POST'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : selectedEndpoint.method === 'PATCH'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {selectedEndpoint.method}
                </span>
                <input
                  type="text"
                  value={requestPath}
                  onChange={e => setRequestPath(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs font-mono text-white rounded-lg px-3 py-1.5 flex-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleExecute}
                disabled={loading}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-lg shadow-emerald-600/20"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{loading ? 'Executing...' : 'Send Request'}</span>
              </button>
            </div>

            {/* Request Body Editor if POST/PATCH */}
            {(selectedEndpoint.method === 'POST' || selectedEndpoint.method === 'PATCH') && (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  JSON Request Payload
                </label>
                <textarea
                  value={requestBody}
                  onChange={e => setRequestBody(e.target.value)}
                  rows={5}
                  className="w-full bg-slate-950 font-mono text-xs text-blue-200 border border-slate-800 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Generated cURL Display */}
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-semibold uppercase">
                <span>cURL CLI Command</span>
                <button
                  onClick={copyCurl}
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                >
                  {copiedCurl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCurl ? 'Copied!' : 'Copy cURL'}</span>
                </button>
              </div>
              <pre className="font-mono text-[11px] text-slate-300 whitespace-pre-wrap overflow-x-auto">
                {generateCurlCommand()}
              </pre>
            </div>
          </div>

          {/* Response Viewer */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Response Viewer
              </span>

              {responseStatus && (
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400">{durationMs} ms</span>
                  <span
                    className={`font-mono font-bold px-2.5 py-0.5 rounded ${
                      responseStatus >= 200 && responseStatus < 300
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : responseStatus === 401 || responseStatus === 403
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    HTTP {responseStatus}
                  </span>
                </div>
              )}
            </div>

            {responseBody ? (
              <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-300 overflow-x-auto max-h-96">
                {JSON.stringify(responseBody, null, 2)}
              </pre>
            ) : (
              <div className="bg-slate-950 border border-dashed border-slate-800/80 rounded-xl p-12 text-center text-xs text-slate-500">
                Click "Send Request" to invoke endpoint and view live HTTP JSON response.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
