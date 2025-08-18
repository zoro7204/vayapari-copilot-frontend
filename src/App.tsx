import React, { useState, Suspense, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import ExpenseManagement from './components/ExpenseManagement';

const Dashboard = React.lazy(() => import('./components/Dashboard'));
const OrderManagement = React.lazy(() => import('./components/OrderManagement'));
const CustomerManagement = React.lazy(() => import('./components/CustomerManagement'));
const Settings = React.lazy(() => import('./components/Settings'));

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // --- NEW LOGIC TO DETECT IF A MODAL IS LIKELY OPEN ---
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // This effect will run whenever isModalOpen changes
    if (isModalOpen) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
  }, [isModalOpen]);


  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    const props = { setIsModalOpen }; // Pass the setter to all components
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />; // Dashboard doesn't have modals yet
      case 'orders':
        return <OrderManagement {...props} />;
      case 'customers':
        return <CustomerManagement {...props} />;
      case 'expenses':
        return <ExpenseManagement {...props} />;
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