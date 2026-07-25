export type Role = 'admin' | 'member';

export type LeadStatus = 
  | 'new'
  | 'contacted'
  | 'discovery'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost';

export type LeadService = 
  | 'shopify_dev'
  | 'web_dev'
  | 'performance_marketing'
  | 'full_stack_build'
  | 'cro_audit';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  title: string;
  active: boolean;
}

export interface LeadNote {
  id: string;
  leadId: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  content: string;
  createdAt: string;
}

export interface LeadActivity {
  id: string;
  leadId: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  service: LeadService;
  budget: number;
  status: LeadStatus;
  assignedToId: string | null;
  assignedToName: string | null;
  score: number; // 0-100 calculated
  source: string;
  notesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStats {
  totalLeads: number;
  totalPipelineValue: number;
  wonValue: number;
  conversionRate: number;
  avgDealSize: number;
  byStatus: Record<LeadStatus, { count: number; value: number }>;
  byService: Record<LeadService, { count: number; value: number }>;
}

export interface ApiPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  meta?: ApiPaginationMeta;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface EmailLog {
  id: string;
  leadId: string;
  leadCompany: string;
  recipient: string;
  subject: string;
  body: string;
  timestamp: string;
}
