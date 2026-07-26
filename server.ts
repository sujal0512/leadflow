import express, { NextFunction, Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { z } from 'zod';
import { Lead, LeadNote, LeadService, LeadStatus, PipelineStats, User } from './src/types';
import { db, calculateLeadScore } from './server/store';

// Helper to extend Express Request with authenticated user
interface AuthRequest extends Request {
  user?: User;
  token?: string;
  requestId?: string;
}

const PORT = 3000;

async function startServer() {
  const app = express();

  // Basic Middleware
  app.use(express.json());

  // Request ID & Logger Middleware
  app.use((req: AuthRequest, res: Response, next: NextFunction) => {
    req.requestId = `req_${Math.random().toString(36).substring(2, 9)}`;
    res.setHeader('X-Request-Id', req.requestId);
    res.setHeader('X-RateLimit-Limit', '300');
    res.setHeader('X-RateLimit-Remaining', '298');

    // Extract bearer token
    const authHeader = req.headers.authorization;
    let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if (!token && req.headers['x-auth-token']) {
      token = req.headers['x-auth-token'] as string;
    }

    if (token) {
      req.token = token;
      // find user by token (token format e.g. token_usr_admin_1)
      const userId = token.replace('token_', '');
      const user = db.users.find(u => u.id === userId);
      if (user) {
        req.user = user;
      }
    }

    next();
  });

  // Auth Guard Middleware
  const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication token missing or invalid. Please sign in.',
        },
      });
    }
    next();
  };

  // Role Guard Middleware
  const requireRole = (role: 'admin' | 'member') => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }
      if (role === 'admin' && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied: Action requires Administrator privileges.',
          },
        });
      }
      next();
    };
  };

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'LeadHero API',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  });

  // Auth: Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Email and password are required' }
      });
    }

    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' }
      });
    }

    const token = `token_${user.id}`;
    return res.json({
      success: true,
      data: {
        token,
        user,
      },
    });
  });

  // Auth: Register
  app.post('/api/auth/register', (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Name, email, and password are required' }
      });
    }

    const existingUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'User with this email already exists' }
      });
    }

    const newUser: User = {
      id: `usr_${Date.now()}`,
      name,
      email,
      password,
      role: 'member', // Default role
      avatar: '/avatars/naruto_avatar_1785045491039.jpg', // Default avatar
      title: 'New Member',
      active: true,
    };

    db.users.push(newUser);

    const token = `token_${newUser.id}`;
    return res.json({
      success: true,
      data: {
        token,
        user: newUser,
      },
    });
  });

  // Auth: Me
  app.get('/api/auth/me', requireAuth, (req: AuthRequest, res) => {
    res.json({
      success: true,
      data: req.user,
    });
  });

  // Users: List team members
  app.get('/api/users', requireAuth, (req, res) => {
    res.json({
      success: true,
      data: db.users,
    });
  });

  // Public Lead Capture Form Endpoint
  const publicLeadSchema = z.object({
    name: z.string().min(2, 'Full name is required (min 2 chars)'),
    email: z.string().email('Valid email address is required'),
    phone: z.string().optional().default(''),
    company: z.string().min(1, 'Company name is required'),
    service: z.enum([
      'shopify_dev',
      'web_dev',
      'performance_marketing',
      'full_stack_build',
      'cro_audit',
    ]),
    budget: z.number().min(500, 'Minimum budget is $500'),
    message: z.string().optional().default(''),
    source: z.string().optional().default('Public Web Form'),
  });

  app.post('/api/leads/public', (req, res) => {
    const parseResult = publicLeadSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid lead data',
          details: parseResult.error.format(),
        },
      });
    }

    const data = parseResult.data;
    const leadId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const score = calculateLeadScore(data.budget, data.service as LeadService, Boolean(data.phone), data.company);

    const newLead: Lead = {
      id: leadId,
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      company: data.company,
      service: data.service as LeadService,
      budget: data.budget,
      status: 'new',
      assignedToId: null,
      assignedToName: null,
      score,
      source: data.source,
      notesCount: data.message ? 1 : 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.leads.unshift(newLead);

    // Initial activity
    db.logActivity(
      leadId,
      'system_public',
      'Public Guest',
      'Lead Captured',
      `Submitted public capture form for ${data.service} with budget $${data.budget.toLocaleString()}`
    );

    // Add message as initial note if provided
    if (data.message) {
      db.notes.unshift({
        id: `note_${Date.now()}`,
        leadId,
        authorId: 'system_public',
        authorName: data.name,
        authorRole: 'member',
        content: `[Public Form Message] ${data.message}`,
        createdAt: new Date().toISOString(),
      });
    }

    db.logEmail(
      leadId,
      data.company,
      data.email,
      `We received your project brief!`,
      `Hi ${data.name},\n\nThank you for submitting your project brief for ${data.company}. Our team is reviewing it and will reach out shortly.\n\nBest,\nLeadTracker Team`
    );

    return res.status(201).json({
      success: true,
      data: newLead,
      message: 'Lead captured successfully! Our team will reach out shortly.',
    });
  });

  // Authenticated Lead Listing with Pagination, Filtering, and Sorting
  app.get('/api/leads', requireAuth, (req: AuthRequest, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as LeadStatus | undefined;
    const service = req.query.service as LeadService | undefined;
    const assignedTo = req.query.assignedTo as string | undefined;
    const search = req.query.search as string | undefined;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) || 'desc';

    let filtered = [...db.leads];

    if (status) {
      filtered = filtered.filter(l => l.status === status);
    }

    if (service) {
      filtered = filtered.filter(l => l.service === service);
    }

    if (assignedTo) {
      if (assignedTo === 'unassigned') {
        filtered = filtered.filter(l => !l.assignedToId);
      } else {
        filtered = filtered.filter(l => l.assignedToId === assignedTo);
      }
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        l =>
          l.name.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.company.toLowerCase().includes(q)
      );
    }

    // Sort logic
    filtered.sort((a, b) => {
      let valA: any = (a as any)[sortBy];
      let valB: any = (b as any)[sortBy];

      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return res.json({
      success: true,
      data: paginated,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  });

  // Get Single Lead
  app.get('/api/leads/:id', requireAuth, (req, res) => {
    const lead = db.leads.find(l => l.id === req.params.id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Lead with ID ${req.params.id} not found` },
      });
    }

    const leadNotes = db.notes.filter(n => n.leadId === lead.id);
    const leadActivities = db.activities.filter(a => a.leadId === lead.id);

    return res.json({
      success: true,
      data: {
        ...lead,
        notes: leadNotes,
        activities: leadActivities,
      },
    });
  });

  // Create Lead (Authenticated)
  app.post('/api/leads', requireAuth, (req: AuthRequest, res) => {
    const { name, email, phone, company, service, budget, status, assignedToId, extraData } = req.body;

    if (!name || !email || !company || !service) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Missing required fields: name, email, company, service',
        },
      });
    }

    const assignedUser = assignedToId ? db.users.find(u => u.id === assignedToId) : null;
    const score = calculateLeadScore(Number(budget) || 10000, service, Boolean(phone), company);
    const leadId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;

    const newLead: Lead = {
      id: leadId,
      name,
      email,
      phone: phone || '',
      company,
      service,
      budget: Number(budget) || 10000,
      status: status || 'new',
      assignedToId: assignedUser ? assignedUser.id : null,
      assignedToName: assignedUser ? assignedUser.name : null,
      score,
      source: 'Internal Sales App',
      notesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      extraData: extraData || {}
    };

    db.leads.unshift(newLead);
    db.logActivity(
      leadId,
      req.user!.id,
      req.user!.name,
      'Lead Created',
      `Created lead manually for ${company}`
    );

    return res.status(201).json({
      success: true,
      data: newLead,
    });
  });

  // Update Lead (PATCH) - Stage, Assignee, Info with permissions
  app.patch('/api/leads/:id', requireAuth, (req: AuthRequest, res) => {
    const leadIndex = db.leads.findIndex(l => l.id === req.params.id);
    if (leadIndex === -1) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Lead not found' },
      });
    }

    const lead = db.leads[leadIndex];
    const user = req.user!;

    // Permission check for non-admins modifying assigned leads of others
    if (user.role !== 'admin' && lead.assignedToId && lead.assignedToId !== user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Members can only modify leads assigned to themselves or unassigned leads.',
        },
      });
    }

    const { status, assignedToId, budget, name, phone, company, service } = req.body;

    // Track activity changes
    if (status && status !== lead.status) {
      db.logActivity(
        lead.id,
        user.id,
        user.name,
        'Stage Changed',
        `Moved status from "${lead.status}" to "${status}"`
      );

      // Simulate sending email alert
      const statusLabels: Record<string, string> = {
        new: 'New Lead',
        contacted: 'Contacted',
        discovery: 'Discovery Call',
        proposal: 'Proposal Sent',
        negotiation: 'Negotiation',
        won: 'Won',
        lost: 'Lost',
      };

      db.logEmail(
        lead.id,
        lead.company,
        lead.email,
        `Update on your project with LeadTracker`,
        `Hi ${lead.name},\n\nYour project status has been updated to "${statusLabels[status] || status}". Our team will be in touch shortly.\n\nBest,\n${user.name}`
      );

      lead.status = status;
    }

    if (assignedToId !== undefined && assignedToId !== lead.assignedToId) {
      const assignedUser = assignedToId ? db.users.find(u => u.id === assignedToId) : null;
      db.logActivity(
        lead.id,
        user.id,
        user.name,
        'Assignee Updated',
        assignedUser
          ? `Assigned lead to ${assignedUser.name} (${assignedUser.title})`
          : 'Unassigned lead'
      );
      lead.assignedToId = assignedUser ? assignedUser.id : null;
      lead.assignedToName = assignedUser ? assignedUser.name : null;
    }

    if (budget !== undefined && budget !== lead.budget) {
      db.logActivity(
        lead.id,
        user.id,
        user.name,
        'Budget Updated',
        `Updated estimated budget from $${lead.budget.toLocaleString()} to $${Number(budget).toLocaleString()}`
      );
      lead.budget = Number(budget);
    }

    if (name) lead.name = name;
    if (phone !== undefined) lead.phone = phone;
    if (company) lead.company = company;
    if (service) lead.service = service;

    lead.score = calculateLeadScore(lead.budget, lead.service, Boolean(lead.phone), lead.company);
    lead.updatedAt = new Date().toISOString();

    db.leads[leadIndex] = lead;

    return res.json({
      success: true,
      data: lead,
    });
  });

  // Delete Lead - ADMIN ONLY!
  app.delete('/api/leads/:id', requireAuth, requireRole('admin'), (req: AuthRequest, res) => {
    const leadIndex = db.leads.findIndex(l => l.id === req.params.id);
    if (leadIndex === -1) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Lead not found' },
      });
    }

    const removed = db.leads.splice(leadIndex, 1)[0];

    // Clean notes and activities
    db.notes = db.notes.filter(n => n.leadId !== req.params.id);
    db.activities = db.activities.filter(a => a.leadId !== req.params.id);

    return res.json({
      success: true,
      data: removed,
      message: 'Lead and associated history purged successfully.',
    });
  });

  // Lead Notes CRUD
  app.get('/api/leads/:id/notes', requireAuth, (req, res) => {
    const notes = db.notes.filter(n => n.leadId === req.params.id);
    return res.json({
      success: true,
      data: notes,
    });
  });

  app.post('/api/leads/:id/notes', requireAuth, (req: AuthRequest, res) => {
    const lead = db.leads.find(l => l.id === req.params.id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Lead not found' },
      });
    }

    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Note content cannot be empty' },
      });
    }

    const newNote: LeadNote = {
      id: `note_${Date.now()}`,
      leadId: lead.id,
      authorId: req.user!.id,
      authorName: req.user!.name,
      authorRole: req.user!.role,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    db.notes.unshift(newNote);
    lead.notesCount = (lead.notesCount || 0) + 1;
    lead.updatedAt = new Date().toISOString();

    db.logActivity(
      lead.id,
      req.user!.id,
      req.user!.name,
      'Added Note',
      `Added note: "${content.length > 50 ? content.substring(0, 50) + '...' : content}"`
    );

    return res.status(201).json({
      success: true,
      data: newNote,
    });
  });

  // Lead Activities Trail
  app.get('/api/leads/:id/activities', requireAuth, (req, res) => {
    const activities = db.activities.filter(a => a.leadId === req.params.id);
    return res.json({
      success: true,
      data: activities,
    });
  });

  // Stats / Dashboard Analytics
  app.get('/api/stats', requireAuth, (req, res) => {
    const totalLeads = db.leads.length;
    const totalPipelineValue = db.leads.reduce((sum, l) => sum + l.budget, 0);
    const wonLeads = db.leads.filter(l => l.status === 'won');
    const wonValue = wonLeads.reduce((sum, l) => sum + l.budget, 0);
    const conversionRate = totalLeads ? Math.round((wonLeads.length / totalLeads) * 100) : 0;
    const avgDealSize = totalLeads ? Math.round(totalPipelineValue / totalLeads) : 0;

    const byStatus: Record<string, { count: number; value: number }> = {};
    const byService: Record<string, { count: number; value: number }> = {};

    db.leads.forEach(l => {
      if (!byStatus[l.status]) {
        byStatus[l.status] = { count: 0, value: 0 };
      }
      byStatus[l.status].count++;
      byStatus[l.status].value += l.budget;

      if (!byService[l.service]) {
        byService[l.service] = { count: 0, value: 0 };
      }
      byService[l.service].count++;
      byService[l.service].value += l.budget;
    });

    const stats: PipelineStats = {
      totalLeads,
      totalPipelineValue,
      wonValue,
      conversionRate,
      avgDealSize,
      byStatus,
      byService,
    };

    return res.json({
      success: true,
      data: stats,
    });
  });

  // Reset Store Endpoint (Admin / Demo helper)
  app.post('/api/admin/reset', requireAuth, requireRole('admin'), (req, res) => {
    db.reset();
    return res.json({
      success: true,
      message: 'Database reset to initial pre-seeded state.',
    });
  });

  // Clear All Leads Endpoint
  app.post('/api/admin/clear', requireAuth, requireRole('admin'), (req, res) => {
    db.clearAllLeads();
    return res.json({
      success: true,
      message: 'All leads and related data have been deleted.',
    });
  });

  // Get Email Logs
  app.get('/api/emails', requireAuth, (req, res) => {
    return res.json({
      success: true,
      data: db.emails,
    });
  });

  // Vite Integration for Dev / Production Static File Serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LeadHero Server] Running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
