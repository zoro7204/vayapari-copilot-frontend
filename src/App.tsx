import React, { useState, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import ExpenseManagement from './components/ExpenseManagement';

// --- LAZY LOADING: We only import components when we need them ---
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const OrderManagement = React.lazy(() => import('./components/OrderManagement'));
const CustomerManagement = React.lazy(() => import('./components/CustomerManagement'));
const Settings = React.lazy(() => import('./components/Settings'));

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'orders':
        return <OrderManagement />;
      case 'customers':
        return <CustomerManagement />;
      case 'expenses':
        return <ExpenseManagement />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-auto">
        {/* Suspense shows a loading message while the component's code is downloaded */}
        <Suspense fallback={<div className="p-6 text-center">Loading page...</div>}>
          {renderContent()}
        </Suspense>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;