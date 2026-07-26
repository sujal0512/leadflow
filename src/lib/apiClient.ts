import { ApiResponse, Lead, LeadActivity, LeadNote, PipelineStats, User, EmailLog } from '../types';

let currentToken: string = localStorage.getItem('leadhero_token') || 'token_usr_admin_1';

export function getAuthToken(): string {
  return currentToken;
}

export function setAuthToken(token: string) {
  currentToken = token;
  localStorage.setItem('leadhero_token', token);
}

async function request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`;
    headers['x-auth-token'] = currentToken;
  }

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    if (!res.ok && !data.error) {
      return {
        success: false,
        error: {
          code: `HTTP_${res.status}`,
          message: data.message || `Request failed with status ${res.status}`,
        },
      };
    }
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: err.message || 'Failed to connect to backend server',
      },
    };
  }
}

export const api = {
  login: (email?: string, password?: string) =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string) =>
    request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  getMe: () => request<User>('/api/auth/me'),

  getUsers: () => request<User[]>('/api/users'),

  submitPublicLead: (data: any) =>
    request<Lead>('/api/leads/public', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getLeads: (params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        searchParams.append(k, String(v));
      }
    });
    return request<Lead[]>(`/api/leads?${searchParams.toString()}`);
  },

  getLeadById: (id: string) => request<Lead & { notes: LeadNote[]; activities: LeadActivity[] }>(`/api/leads/${id}`),

  createLead: (data: Partial<Lead>) =>
    request<Lead>('/api/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateLead: (id: string, data: Partial<Lead>) =>
    request<Lead>(`/api/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteLead: (id: string) =>
    request<Lead>(`/api/leads/${id}`, {
      method: 'DELETE',
    }),

  getLeadNotes: (id: string) => request<LeadNote[]>(`/api/leads/${id}/notes`),

  addLeadNote: (id: string, content: string) =>
    request<LeadNote>(`/api/leads/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  getLeadActivities: (id: string) => request<LeadActivity[]>(`/api/leads/${id}/activities`),

  getStats: () => request<PipelineStats>('/api/stats'),

  resetDatabase: () =>
    request<{ message: string }>('/api/admin/reset', {
      method: 'POST',
    }),

  clearLeads: () =>
    request<{ message: string }>('/api/admin/clear', {
      method: 'POST',
    }),

  getEmails: () => request<EmailLog[]>('/api/emails'),
};
