import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LeadPipelineView } from './components/LeadPipelineView';
import { LeadDetailDrawer } from './components/LeadDetailDrawer';
import { PublicLeadCaptureForm } from './components/PublicLeadCaptureForm';
import { ApiExplorerView } from './components/ApiExplorerView';
import { EmailNotificationsPanel } from './components/EmailNotificationsPanel';
import { api, setAuthToken } from './lib/apiClient';
import { User } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<string>('pipeline');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showEmails, setShowEmails] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    // Login default admin Priya Sharma
    const loginRes = await api.login(undefined, 'admin');
    if (loginRes.success && loginRes.data) {
      setAuthToken(loginRes.data.token);
      setCurrentUser(loginRes.data.user);
    }

    const usersRes = await api.getUsers();
    if (usersRes.success && usersRes.data) {
      setUsers(usersRes.data);
    }
  };

  const handleSwitchUser = async (role: 'admin' | 'member', userId?: string) => {
    let targetUser = users.find(u => u.id === userId);
    if (!targetUser) {
      targetUser = users.find(u => u.role === role);
    }

    if (targetUser) {
      const loginRes = await api.login(targetUser.email);
      if (loginRes.success && loginRes.data) {
        setAuthToken(loginRes.data.token);
        setCurrentUser(loginRes.data.user);
        setRefreshTrigger(prev => prev + 1);
      }
    }
  };

  const handleResetDb = async () => {
    if (!confirm('Reset database to initial pre-seeded state?')) return;
    const res = await api.resetDatabase();
    if (res.success) {
      setRefreshTrigger(prev => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSwitchUser={handleSwitchUser}
        onResetDb={handleResetDb}
        onOpenEmails={() => setShowEmails(true)}
        users={users}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'pipeline' && (
          <LeadPipelineView
            key={refreshTrigger}
            currentUser={currentUser}
            users={users}
            onSelectLead={id => setSelectedLeadId(id)}
          />
        )}

        {activeTab === 'public_form' && <PublicLeadCaptureForm />}

        {activeTab === 'api_docs' && (
          <ApiExplorerView currentUser={currentUser} users={users} />
        )}
      </main>

      {/* Detailed Drawer */}
      <LeadDetailDrawer
        leadId={selectedLeadId}
        currentUser={currentUser}
        users={users}
        onClose={() => setSelectedLeadId(null)}
        onLeadUpdated={() => setRefreshTrigger(prev => prev + 1)}
      />
      
      {/* Email Logs Panel */}
      <EmailNotificationsPanel 
        isOpen={showEmails}
        onClose={() => setShowEmails(false)}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
