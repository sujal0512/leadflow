import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LeadPipelineView } from './components/LeadPipelineView';
import { LeadDetailDrawer } from './components/LeadDetailDrawer';
import { PublicLeadCaptureForm } from './components/PublicLeadCaptureForm';
import { ApiExplorerView } from './components/ApiExplorerView';
import { EmailNotificationsPanel } from './components/EmailNotificationsPanel';
import { AuthPage } from './components/AuthPage';
import { api, setAuthToken, getAuthToken } from './lib/apiClient';
import { User } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<string>('pipeline');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showEmails, setShowEmails] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    setIsInitializing(true);
    const token = getAuthToken();
    if (token) {
      const res = await api.getMe();
      if (res.success && res.data) {
        setCurrentUser(res.data);
      } else {
        // invalid token
        setAuthToken('');
      }
    }

    const usersRes = await api.getUsers();
    if (usersRes.success && usersRes.data) {
      setUsers(usersRes.data);
    }
    setIsInitializing(false);
  };

  const handleSwitchUser = async (role: 'admin' | 'member', userId?: string) => {
    let targetUser = users.find(u => u.id === userId);
    if (!targetUser) {
      targetUser = users.find(u => u.role === role);
    }

    if (targetUser) {
      // For demo switch, just use password123 as we seeded it, or we can just bypass if we really wanted to, 
      // but let's clear session and require login for a realistic flow, or auto-login with default pass.
      const loginRes = await api.login(targetUser.email, 'password123');
      if (loginRes.success && loginRes.data) {
        setAuthToken(loginRes.data.token);
        setCurrentUser(loginRes.data.user);
        setRefreshTrigger(prev => prev + 1);
      } else {
        alert('Could not switch to user: ' + (loginRes.error?.message || 'Invalid credentials'));
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

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-blue-500 font-semibold animate-pulse">Loading...</div>
      </div>
    );
  }

  // Public form doesn't strictly need auth, but for simplicity we keep the main shell authenticated
  // Or we can allow public form to bypass AuthPage
  if (!currentUser && activeTab !== 'public_form') {
    return (
      <AuthPage 
        onLogin={(user) => {
          setCurrentUser(user);
          // fetch users list again after login to make sure it's up to date
          api.getUsers().then(res => {
            if (res.success && res.data) setUsers(res.data);
          });
        }} 
      />
    );
  }

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
        onLogout={() => {
          setAuthToken('');
          setCurrentUser(null);
        }}
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
