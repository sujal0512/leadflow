import React, { useEffect, useState } from 'react';
import { Mail, X, RefreshCw, Send, CheckCircle2 } from 'lucide-react';
import { EmailLog } from '../types';
import { api } from '../lib/apiClient';

interface EmailNotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailNotificationsPanel: React.FC<EmailNotificationsPanelProps> = ({ isOpen, onClose }) => {
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEmails = async () => {
    setLoading(true);
    const res = await api.getEmails();
    if (res.success && res.data) {
      setEmails(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchEmails();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-800 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Outbox Logs</h2>
              <p className="text-xs text-slate-400">Simulated Email Notifications</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchEmails}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {emails.length === 0 && !loading && (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-500">
                <Mail className="w-6 h-6" />
              </div>
              <div className="text-slate-400 text-sm">No email logs yet.</div>
              <p className="text-xs text-slate-500 max-w-[250px] mx-auto">
                Submit a new public lead or change a lead's stage to generate a simulated email alert.
              </p>
            </div>
          )}
          
          {emails.map((email) => (
            <div key={email.id} className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Delivered</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {new Date(email.timestamp).toLocaleString()}
                  </span>
                </div>
                
                <h3 className="font-bold text-slate-200 text-sm">{email.subject}</h3>
                
                <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs pt-1">
                  <span className="text-slate-500">To:</span>
                  <span className="text-blue-300 font-medium">{email.recipient}</span>
                  
                  <span className="text-slate-500">Re:</span>
                  <span className="text-slate-300">{email.leadCompany}</span>
                </div>
              </div>
              
              <div className="p-4 bg-slate-900/50 text-slate-300 text-xs whitespace-pre-wrap leading-relaxed font-mono">
                {email.body}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
