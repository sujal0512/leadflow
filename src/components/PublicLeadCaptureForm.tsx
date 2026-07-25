import React, { useState } from 'react';
import { 
  Building2, 
  Send, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  DollarSign, 
  Globe, 
  Clock, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { Lead, LeadService } from '../types';
import { api } from '../lib/apiClient';

export const PublicLeadCaptureForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    service: 'shopify_dev' as LeadService,
    budget: 35000,
    message: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [createdLead, setCreatedLead] = useState<Lead | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live score preview calculation
  const calculatedScore = Math.min(
    100,
    30 +
      (formData.budget >= 50000 ? 35 : formData.budget >= 25000 ? 25 : 15) +
      (formData.service === 'full_stack_build' || formData.service === 'shopify_dev' ? 15 : 10) +
      (formData.phone ? 10 : 0) +
      (formData.company.length > 3 ? 10 : 0)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    const res = await api.submitPublicLead({
      ...formData,
      source: 'Public Web Form (leadtracker.app)',
    });

    if (res.success && res.data) {
      setCreatedLead(res.data);
    } else if (res.error) {
      setErrorMessage(res.error.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/80 border border-slate-800 p-8 rounded-3xl text-center space-y-3 relative overflow-hidden shadow-2xl">
        <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs px-3.5 py-1 rounded-full font-semibold">
          <Globe className="w-3.5 h-3.5 text-blue-400" />
          <span>Public Client Capture Portal</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Start Your Growth Engine with LeadTracker
        </h1>

        <p className="text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
          We build high-converting Shopify stores, bespoke web platforms, and growth engines for ambitious brands in the US, UK, and Australia. Fill out your project brief below.
        </p>
      </div>

      {createdLead ? (
        /* Success State View */
        <div className="bg-slate-900 border border-emerald-500/40 p-8 rounded-3xl text-center space-y-6 shadow-2xl animate-in fade-in duration-300">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Project Inquiry Received!</h2>
            <p className="text-sm text-slate-300 max-w-md mx-auto">
              Thank you, <span className="font-semibold text-white">{createdLead.name}</span>. Your brief for{' '}
              <span className="font-semibold text-emerald-400">{createdLead.company}</span> has been assigned reference ID{' '}
              <span className="font-mono text-blue-300">{createdLead.id}</span>.
            </p>
          </div>

          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 max-w-lg mx-auto text-left text-xs space-y-3">
            <div className="text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800 pb-2">
              Lead Captured Successfully
            </div>

            <div className="grid grid-cols-2 gap-3 text-slate-300">
              <div>
                <span className="text-slate-500 block">Service:</span>
                <span className="font-semibold text-white capitalize">{createdLead.service.replace('_', ' ')}</span>
              </div>

              <div>
                <span className="text-slate-500 block">Estimated Budget:</span>
                <span className="font-semibold text-emerald-400">₹{createdLead.budget.toLocaleString()}</span>
              </div>

              <div>
                <span className="text-slate-500 block">Initial Lead Score:</span>
                <span className="font-semibold text-amber-400">{createdLead.score} / 100</span>
              </div>

              <div>
                <span className="text-slate-500 block">Status Pipeline:</span>
                <span className="font-semibold text-sky-400 capitalize">{createdLead.status}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setCreatedLead(null);
              setFormData({
                name: '',
                email: '',
                phone: '',
                company: '',
                service: 'shopify_dev',
                budget: 35000,
                message: '',
              });
            }}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition"
          >
            Submit Another Inquiry
          </button>
        </div>
      ) : (
        /* Form View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white">Project Scope & Contact Details</h2>
              <p className="text-xs text-slate-400">All leads trigger server validation & activity logging.</p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g. Lumina Apparel"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Priya Sharma"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="priya@lumina.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Service Required *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: 'shopify_dev', title: 'Shopify Store Rebuild', desc: 'Custom Liquid & Plus development' },
                    { id: 'full_stack_build', title: 'Full Stack App Build', desc: 'Custom Web & Mobile platform' },
                    { id: 'web_dev', title: 'Web Development', desc: 'High-speed marketing platforms' },
                    { id: 'performance_marketing', title: 'Performance Growth', desc: 'Paid social & conversion scaling' },
                    { id: 'cro_audit', title: 'CRO & Speed Audit', desc: 'Conversion rate optimization' },
                  ].map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, service: s.id as any })}
                      className={`p-3 rounded-xl border text-left transition ${
                        formData.service === s.id
                          ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-bold text-xs">{s.title}</div>
                      <div className="text-[10px] text-slate-400">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-300 font-semibold">Estimated Budget</label>
                  <span className="text-emerald-400 font-bold text-sm">
                    ₹{formData.budget.toLocaleString()} INR
                  </span>
                </div>
                <input
                  type="range"
                  min={5000}
                  max={100000}
                  step={5000}
                  value={formData.budget}
                  onChange={e => setFormData({ ...formData, budget: Number(e.target.value) })}
                  className="w-full accent-blue-500 bg-slate-950 cursor-pointer h-2 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>₹5k</span>
                  <span>₹25k</span>
                  <span>₹50k</span>
                  <span>₹100k+</span>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Project Brief / Details</label>
                <textarea
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about your target timeline, current tech stack, or core objectives..."
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Submitting Brief...' : 'Submit Project Brief'}</span>
              </button>
            </form>
          </div>

          {/* Right Sidebar: Dynamic Scoring Engine Preview */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                <Sparkles className="w-4 h-4" />
                <span>Real-Time Lead Scoring</span>
              </div>

              <div className="text-center py-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <div className="text-4xl font-extrabold text-white">{calculatedScore}</div>
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Priority Lead Index</div>
                <div className="text-[10px] text-slate-500 px-4">
                  Dynamically evaluated on server upon receipt. High scores trigger instant Slack & CRM notification.
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Budget Tier</span>
                  <span className="font-semibold text-emerald-400">
                    {formData.budget >= 50000 ? 'Enterprise (+35)' : formData.budget >= 25000 ? 'Mid-Market (+25)' : 'Standard (+15)'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Service Type</span>
                  <span className="font-semibold text-blue-400">High Leverage (+15)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Contact Depth</span>
                  <span className="font-semibold text-slate-400">
                    {formData.phone ? 'Verified (+10)' : 'Basic'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl text-xs space-y-2 text-slate-400">
              <div className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Enterprise SLA Guarantee</span>
              </div>
              <p>
                Inquiries are automatically logged into the pipeline and routed to senior account executives within 2 business hours.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
