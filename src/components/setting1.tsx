import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Store, Users, Database, Link, Palette, Upload, Save, UserPlus,
  Edit3, Trash2, Download, Archive, Plus, X, Check, AlertTriangle,
  Sun, Moon, Globe, Shield, CheckCircle, ExternalLink, Calendar,
  Building2, Phone, Hash, Image, Eye, Settings as SettingsIcon,
  Search, Filter, Copy, RefreshCw, HelpCircle, ChevronDown, ChevronUp,
  Zap, Bell, Lock, Key, CreditCard, Mail, Smartphone, Monitor,MessageCircle
} from 'lucide-react';

// Enhanced Types
interface ShopProfile {
  shopName: string;
  address: string;
  phoneNumber: string;
  gstin: string;
  logoUrl?: string;
  businessType?: string;
  website?: string;
  foundedYear?: number;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Staff';
  status: 'Invited' | 'Active' | 'Inactive';
  invitedAt: string;
  lastActive?: string;
  permissions?: string[];
  avatar?: string;
}

interface ExpenseCategory {
  id: string;
  name: string;
  createdAt: string;
  color?: string;
  isDefault?: boolean;
  usageCount?: number;
}

interface IntegrationStatus {
  telegram: {
    connected: boolean;
    botLink?: string;
    notifications?: boolean;
  };
  whatsapp: {
    connected: boolean;
    comingSoon: boolean;
    phoneNumber?: string;
  };
  email: {
    connected: boolean;
    provider?: string;
    lastSent?: string;
  };
}

interface NotificationSettings {
  orderUpdates: boolean;
  lowStock: boolean;
  dailyReports: boolean;
  weeklyReports: boolean;
  paymentReminders: boolean;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmWord: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
  isLoading?: boolean;
}

const Settings: React.FC = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'profile' | 'staff' | 'data' | 'integrations' | 'appearance' | 'security'>('profile');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Enhanced Shop Profile State
  const [shopProfile, setShopProfile] = useState<ShopProfile>({
    shopName: '',
    address: '',
    phoneNumber: '',
    gstin: '',
    logoUrl: '',
    businessType: '',
    website: '',
    foundedYear: new Date().getFullYear()
  });
  const [originalProfile, setOriginalProfile] = useState<ShopProfile>({
    shopName: '',
    address: '',
    phoneNumber: '',
    gstin: '',
    logoUrl: '',
    businessType: '',
    website: '',
    foundedYear: new Date().getFullYear()
  });
  const [isDragging, setIsDragging] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    contact: false,
    additional: false
  });

  // Enhanced Staff Management State
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffFilter, setStaffFilter] = useState<'all' | 'active' | 'invited' | 'admin' | 'staff'>('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [removingStaff, setRemovingStaff] = useState<StaffMember | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [newStaffForm, setNewStaffForm] = useState({ 
    name: '', 
    email: '', 
    role: 'Staff' as 'Admin' | 'Staff',
    permissions: [] as string[]
  });

  // Enhanced Data Management State
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6366F1');
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveDate, setArchiveDate] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  // Enhanced Integrations State
  const [integrations, setIntegrations] = useState<IntegrationStatus>({
    telegram: { connected: false, notifications: true },
    whatsapp: { connected: false, comingSoon: true },
    email: { connected: false }
  });
  const [notifications, setNotifications] = useState<NotificationSettings>({
    orderUpdates: true,
    lowStock: true,
    dailyReports: false,
    weeklyReports: true,
    paymentReminders: true
  });

  // Enhanced Appearance State
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light');
  const [language, setLanguage] = useState<'en' | 'kn'>('en');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [compactMode, setCompactMode] = useState(false);

  // Loading and UI State
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, any>>({});

  // =======================================================
  //  API Handler Functions (FIX for "Cannot find name" errors)
  // =======================================================

  const handleRemoveStaff = async (staffId: string) => {
    try {
      // NOTE: We assume a 'deleteStaff' function will be added to api.ts
      // await deleteStaff(staffId); 
      await fetch(`/api/staff/${staffId}`, { method: 'DELETE' });
      setStaff(prev => prev.filter(s => s.id !== staffId));
      showToastMessage('Staff member removed successfully.', 'success');
    } catch (error) {
      showToastMessage('Failed to remove staff member.', 'error');
    } finally {
      setRemovingStaff(null);
    }
  };

  const handleUpdateStaff = async (staffId: string, updates: Partial<StaffMember>) => {
    try {
      // NOTE: We assume an 'updateStaff' function will be added to api.ts
      // await updateStaff(staffId, updates);
      await fetch(`/api/staff/${staffId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      setStaff(prev => prev.map(s => s.id === staffId ? { ...s, ...updates } : s));
      showToastMessage('Staff member updated.', 'success');
    } catch (error) {
      showToastMessage('Failed to update staff member.', 'error');
    } finally {
      setEditingStaff(null);
    }
  };

  const handleExportData = () => {
    // This simply triggers the browser to download from our backend endpoint
    window.location.href = '/api/data/export';
  };

  const handleArchiveData = async () => {
    if (!archiveDate) {
      showToastMessage('Please select a date first.', 'error');
      return;
    }
    try {
      // NOTE: We assume an 'archiveData' function will be added to api.ts
      // await archiveData(archiveDate);
      await fetch('/api/data/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beforeDate: archiveDate })
      });
      showToastMessage('Data archived successfully. Please refresh for updated views.', 'success');
    } catch (error) {
      showToastMessage('Failed to archive data.', 'error');
    } finally {
      setShowArchiveModal(false);
    }
  };

  const handleUpdateCategory = async (categoryId: string, newName: string) => {
    try {
      // NOTE: We assume an 'editExpenseCategory' function will be added to api.ts
      // await editExpenseCategory(categoryId, { name: newName });
      await fetch(`/api/expense-categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      setExpenseCategories(prev => prev.map(c => c.id === categoryId ? { ...c, name: newName } : c));
      showToastMessage('Category updated.', 'success');
    } catch (error) {
      showToastMessage('Failed to update category.', 'error');
    } finally {
      setEditingCategory(null);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        // NOTE: We assume a 'deleteExpenseCategory' function will be added to api.ts
        // await deleteExpenseCategory(categoryId);
        await fetch(`/api/expense-categories/${categoryId}`, { method: 'DELETE' });
        setExpenseCategories(prev => prev.filter(c => c.id !== categoryId));
        showToastMessage('Category deleted.', 'success');
      } catch (error) {
        showToastMessage('Failed to delete category.', 'error');
      }
    }
  };

  // Auto-save functionality
  const debouncedSave = useCallback(
    debounce(async (data: ShopProfile) => {
      if (autoSave && JSON.stringify(data) !== JSON.stringify(originalProfile)) {
        try {
          await fetch('/api/shop-profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          setOriginalProfile(data);
          showToastMessage('Profile auto-saved', 'success');
        } catch (error) {
          showToastMessage('Auto-save failed', 'error');
        }
      }
    }, 1000),
    [autoSave, originalProfile]
  );

  // Toast notification system
  const showToastMessage = (message: string, type: 'success' | 'error' | 'info') => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 3000);
  };

  // Check if profile has changes
  const hasProfileChanges = useMemo(() => {
    return JSON.stringify(shopProfile) !== JSON.stringify(originalProfile);
  }, [shopProfile, originalProfile]);

  // Filter staff based on search and filter criteria
  useEffect(() => {
    let filtered = staff;
    
    if (staffSearchQuery) {
      filtered = filtered.filter(member => 
        member.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(staffSearchQuery.toLowerCase())
      );
    }
    
    if (staffFilter !== 'all') {
      filtered = filtered.filter(member => {
        switch (staffFilter) {
          case 'active':
            return member.status === 'Active';
          case 'invited':
            return member.status === 'Invited';
          case 'admin':
            return member.role === 'Admin';
          case 'staff':
            return member.role === 'Staff';
          default:
            return true;
        }
      });
    }
    
    setFilteredStaff(filtered);
  }, [staff, staffSearchQuery, staffFilter]);

  // Auto-save profile changes
  useEffect(() => {
    if (hasProfileChanges) {
      debouncedSave(shopProfile);
    }
  }, [shopProfile, hasProfileChanges, debouncedSave]);

  // Fetch all settings data on component mount
  useEffect(() => {
    const loadSettingsData = async () => {
      try {
        setIsLoading(true);
        
        // Load all data concurrently
        const [profileRes, staffRes, categoriesRes, integrationsRes, appearanceRes] = await Promise.all([
          fetch('/api/shop-profile'),
          fetch('/api/staff'),
          fetch('/api/expense-categories'),
          fetch('/api/integrations'),
          fetch('/api/settings/appearance')
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setShopProfile(profileData);
          setOriginalProfile(profileData);
        }

        if (staffRes.ok) {
          const staffData = await staffRes.json();
          setStaff(staffData);
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setExpenseCategories(categoriesData);
        }

        if (integrationsRes.ok) {
          const integrationsData = await integrationsRes.json();
          setIntegrations(integrationsData);
        }

        if (appearanceRes.ok) {
          const appearanceData = await appearanceRes.json();
          setTheme(appearanceData.theme || 'light');
          setLanguage(appearanceData.language || 'en');
          setFontSize(appearanceData.fontSize || 'medium');
          setCompactMode(appearanceData.compactMode || false);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        showToastMessage('Failed to load settings', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettingsData();
  }, []);

  // Enhanced logo upload with preview
  const handleLogoUpload = async (file: File) => {
    try {
      // Optimistic update
      const previewUrl = URL.createObjectURL(file);
      setShopProfile(prev => ({ ...prev, logoUrl: previewUrl }));
      
      const formData = new FormData();
      formData.append('logo', file);
      
      const response = await fetch('/api/shop-profile/logo', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const { logoUrl } = await response.json();
        setShopProfile(prev => ({ ...prev, logoUrl }));
        showToastMessage('Logo uploaded successfully', 'success');
      } else {
        // Revert optimistic update
        setShopProfile(prev => ({ ...prev, logoUrl: originalProfile.logoUrl }));
        showToastMessage('Failed to upload logo', 'error');
      }
    } catch (error) {
      console.error('Failed to upload logo:', error);
      showToastMessage('Failed to upload logo', 'error');
    }
  };

  // Enhanced drag and drop with better visual feedback
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      handleLogoUpload(files[0]);
    }
  };

  // Enhanced save with better feedback
  const handleSaveProfile = async () => {
    try {
      setProfileSaving(true);
      const response = await fetch('/api/shop-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shopProfile)
      });
      
      if (response.ok) {
        setOriginalProfile(shopProfile);
        showToastMessage('Profile saved successfully', 'success');
      } else {
        throw new Error('Failed to save profile');
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      showToastMessage('Failed to save profile', 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  // Section toggle functionality
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Enhanced staff management functions
  const handleInviteStaff = async () => {
    try {
      const response = await fetch('/api/staff/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStaffForm)
      });
      
      if (response.ok) {
        const newStaff = await response.json();
        setStaff(prev => [...prev, newStaff]);
        setNewStaffForm({ name: '', email: '', role: 'Staff', permissions: [] });
        setShowInviteModal(false);
        showToastMessage(`Invitation sent to ${newStaff.name}`, 'success');
      }
    } catch (error) {
      console.error('Failed to invite staff:', error);
      showToastMessage('Failed to send invitation', 'error');
    }
  };

  const handleBulkStaffAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedStaff.length === 0) return;
    
    try {
      const response = await fetch('/api/staff/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, staffIds: selectedStaff })
      });
      
      if (response.ok) {
        // Refresh staff list
        const staffResponse = await fetch('/api/staff');
        if (staffResponse.ok) {
          const staffData = await staffResponse.json();
          setStaff(staffData);
          setSelectedStaff([]);
          showToastMessage(`${action} applied to ${selectedStaff.length} members`, 'success');
        }
      }
    } catch (error) {
      console.error(`Failed to ${action} staff:`, error);
      showToastMessage(`Failed to ${action} selected staff`, 'error');
    }
  };

  // Enhanced category management with color support
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      const response = await fetch('/api/expense-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newCategoryName,
          color: newCategoryColor 
        })
      });
      
      if (response.ok) {
        const category = await response.json();
        setExpenseCategories(prev => [...prev, category]);
        setNewCategoryName('');
        setNewCategoryColor('#6366F1');
        showToastMessage('Category added successfully', 'success');
      }
    } catch (error) {
      console.error('Failed to add category:', error);
      showToastMessage('Failed to add category', 'error');
    }
  };

  // Enhanced appearance settings
  const handleAppearanceChange = async (setting: string, value: any) => {
    try {
      const newSettings = { theme, language, fontSize, compactMode, [setting]: value };
      
      const response = await fetch('/api/settings/appearance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      
      if (response.ok) {
        switch (setting) {
          case 'theme':
            setTheme(value);
            break;
          case 'language':
            setLanguage(value);
            break;
          case 'fontSize':
            setFontSize(value);
            break;
          case 'compactMode':
            setCompactMode(value);
            break;
        }
        showToastMessage('Appearance updated', 'success');
      }
    } catch (error) {
      console.error('Failed to update appearance:', error);
      showToastMessage('Failed to update appearance', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded-lg w-64"></div>
            <div className="flex space-x-6">
              <div className="w-64 space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-12 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
              <div className="flex-1 space-y-6">
                <div className="h-96 bg-gray-200 rounded-xl"></div>
                <div className="h-64 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: Store, description: 'Shop information and branding' },
    { id: 'staff', label: 'Team', icon: Users, description: 'Manage staff and permissions' },
    { id: 'data', label: 'Data', icon: Database, description: 'Export and manage data' },
    { id: 'integrations', label: 'Integrations', icon: Link, description: 'Connect external services' },
    { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Customize interface' },
    { id: 'security', label: 'Security', icon: Shield, description: 'Account and data security' }
  ] as const;

  const categoryColors = [
    '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F97316', 
    '#EAB308', '#22C55E', '#10B981', '#06B6D4', '#3B82F6'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                <SettingsIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent">
                  Settings
                </h1>
                <p className="text-gray-600 text-lg mt-1">Configure your business preferences and integrations</p>
              </div>
            </div>
            
            {/* Global Search */}
            <div className="hidden md:block relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/80 backdrop-blur-sm"
              />
            </div>
          </div>
          
          {/* Auto-save indicator */}
          {hasProfileChanges && autoSave && (
            <div className="mt-4 flex items-center space-x-2 text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Auto-saving changes...</span>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Enhanced Sidebar Navigation */}
          <div className="lg:w-80">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6 sticky top-6">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full group relative overflow-hidden rounded-xl transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200 scale-[1.02]'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600 hover:scale-[1.01]'
                      }`}
                    >
                      <div className="flex items-center space-x-4 p-4">
                        <div className={`p-2 rounded-lg transition-all duration-300 ${
                          isActive 
                            ? 'bg-white/20' 
                            : 'bg-gray-100 group-hover:bg-indigo-50'
                        }`}>
                          <Icon className={`h-5 w-5 transition-all duration-300 ${
                            isActive ? 'text-white' : 'text-gray-600 group-hover:text-indigo-600'
                          }`} />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-base">{tab.label}</div>
                          <div className={`text-sm opacity-75 ${
                            isActive ? 'text-white' : 'text-gray-500'
                          }`}>
                            {tab.description}
                          </div>
                        </div>
                      </div>
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-600/10 animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </nav>
              
              {/* Quick Stats */}
              <div className="mt-8 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border">
                <h4 className="font-semibold text-gray-900 mb-3">Quick Stats</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Team Members</span>
                    <span className="font-medium">{staff.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Categories</span>
                    <span className="font-medium">{expenseCategories.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Integrations</span>
                    <span className="font-medium">
                      {Object.values(integrations).filter(i => i.connected).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Main Content */}
          <div className="flex-1">
            {/* Shop Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Auto-save toggle */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Zap className="h-5 w-5 text-indigo-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Auto-save</h3>
                        <p className="text-sm text-gray-600">Automatically save changes as you type</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setAutoSave(!autoSave)}
                      className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                        autoSave ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${
                        autoSave ? 'left-7' : 'left-1'
                      }`} />
                    </button>
                  </div>
                </div>

                {/* Profile Form */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-8">
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Form Section */}
                    <div className="xl:col-span-2 space-y-8">
                      {/* Basic Information */}
                      <div>
                        <button
                          onClick={() => toggleSection('basic')}
                          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 hover:from-indigo-100 hover:to-purple-100 transition-all duration-200"
                        >
                          <div className="flex items-center space-x-3">
                            <Building2 className="h-5 w-5 text-indigo-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                          </div>
                          {expandedSections.basic ? 
                            <ChevronUp className="h-5 w-5 text-gray-500" /> : 
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                          }
                        </button>
                        
                        {expandedSections.basic && (
                          <div className="mt-6 space-y-6 pl-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                  Shop Name
                                </label>
                                <input
                                  type="text"
                                  value={shopProfile.shopName}
                                  onChange={(e) => setShopProfile(prev => ({ ...prev, shopName: e.target.value }))}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                                  placeholder="Enter your shop name"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                  Business Type
                                </label>
                                <select
                                  value={shopProfile.businessType}
                                  onChange={(e) => setShopProfile(prev => ({ ...prev, businessType: e.target.value }))}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                                >
                                  <option value="">Select business type</option>
                                  <option value="retail">Retail Store</option>
                                  <option value="wholesale">Wholesale</option>
                                  <option value="manufacturing">Manufacturing</option>
                                  <option value="services">Services</option>
                                  <option value="other">Other</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Address
                              </label>
                              <textarea
                                value={shopProfile.address}
                                onChange={(e) => setShopProfile(prev => ({ ...prev, address: e.target.value }))}
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/50 backdrop-blur-sm transition-all duration-200 resize-none"
                                placeholder="Enter your complete business address"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Contact Information */}
                      <div>
                        <button
                          onClick={() => toggleSection('contact')}
                          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 hover:from-emerald-100 hover:to-teal-100 transition-all duration-200"
                        >
                          <div className="flex items-center space-x-3">
                            <Phone className="h-5 w-5 text-emerald-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                          </div>
                          {expandedSections.contact ? 
                            <ChevronUp className="h-5 w-5 text-gray-500" /> : 
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                          }
                        </button>
                        
                        {expandedSections.contact && (
                          <div className="mt-6 space-y-6 pl-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                  Phone Number
                                </label>
                                <input
                                  type="tel"
                                  value={shopProfile.phoneNumber}
                                  onChange={(e) => setShopProfile(prev => ({ ...prev, phoneNumber: e.target.value }))}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                                  placeholder="+91 98765 43210"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                  Website
                                </label>
                                <input
                                  type="url"
                                  value={shopProfile.website}
                                  onChange={(e) => setShopProfile(prev => ({ ...prev, website: e.target.value }))}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                                  placeholder="https://yourwebsite.com"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-3">
                                GSTIN
                              </label>
                              <input
                                type="text"
                                value={shopProfile.gstin}
                                onChange={(e) => setShopProfile(prev => ({ ...prev, gstin: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                                placeholder="22AAAAA0000A1Z5"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Additional Information */}
                      <div>
                        <button
                          onClick={() => toggleSection('additional')}
                          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 hover:from-purple-100 hover:to-pink-100 transition-all duration-200"
                        >
                          <div className="flex items-center space-x-3">
                            <Calendar className="h-5 w-5 text-purple-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
                          </div>
                          {expandedSections.additional ? 
                            <ChevronUp className="h-5 w-5 text-gray-500" /> : 
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                          }
                        </button>
                        
                        {expandedSections.additional && (
                          <div className="mt-6 pl-6">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Founded Year
                              </label>
                              <input
                                type="number"
                                value={shopProfile.foundedYear}
                                onChange={(e) => setShopProfile(prev => ({ ...prev, foundedYear: parseInt(e.target.value) || new Date().getFullYear() }))}
                                className="w-full md:w-64 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                                min="1900"
                                max={new Date().getFullYear()}
                                placeholder="2020"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Logo Upload Section */}
                      <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-4">
                          <Image className="h-4 w-4 inline mr-2" />
                          Shop Logo
                        </label>
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                            isDragging 
                              ? 'border-indigo-400 bg-indigo-50 scale-[1.02]' 
                              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                          }`}
                        >
                          {shopProfile.logoUrl ? (
                            <div className="space-y-4">
                              <div className="relative inline-block">
                                <img 
                                  src={shopProfile.logoUrl} 
                                  alt="Shop Logo" 
                                  className="h-24 w-24 object-cover rounded-xl mx-auto shadow-lg" 
                                />
                                <button
                                  onClick={() => setShopProfile(prev => ({ ...prev, logoUrl: '' }))}
                                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                              <p className="text-sm text-gray-600">Drag and drop a new image or click to replace</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl mx-auto flex items-center justify-center">
                                <Upload className="h-8 w-8 text-white" />
                              </div>
                              <div>
                                <p className="text-gray-700 font-medium">Drag and drop your logo here</p>
                                <p className="text-sm text-gray-500 mt-1">or click to browse files (PNG, JPG up to 5MB)</p>
                              </div>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Save Button */}
                      {!autoSave && (
                        <div className="flex items-center justify-end space-x-4">
                          <button
                            onClick={() => setShopProfile(originalProfile)}
                            disabled={!hasProfileChanges}
                            className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                          >
                            Reset Changes
                          </button>
                          <button
                            onClick={handleSaveProfile}
                            disabled={!hasProfileChanges || profileSaving}
                            className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 ${
                              hasProfileChanges && !profileSaving
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transform hover:scale-[1.02]'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {profileSaving ? (
                              <>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4" />
                                <span>Save Changes</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Enhanced Preview Section */}
                    <div className="xl:col-span-1">
                      <div className="sticky top-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                          <Eye className="h-5 w-5 mr-2 text-indigo-600" />
                          Live Preview
                        </h3>
                        
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
                          <div className="text-center space-y-4">
                            {shopProfile.logoUrl && (
                              <img 
                                src={shopProfile.logoUrl} 
                                alt="Logo" 
                                className="h-20 w-20 object-cover rounded-xl mx-auto shadow-md" 
                              />
                            )}
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">
                                {shopProfile.shopName || 'Your Shop Name'}
                              </h3>
                              {shopProfile.businessType && (
                                <p className="text-sm text-gray-500 capitalize">{shopProfile.businessType}</p>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>{shopProfile.address || 'Your Shop Address'}</p>
                              <p>{shopProfile.phoneNumber || 'Your Phone Number'}</p>
                              {shopProfile.website && (
                                <p className="text-indigo-600">{shopProfile.website}</p>
                              )}
                              {shopProfile.gstin && <p>GSTIN: {shopProfile.gstin}</p>}
                              {shopProfile.foundedYear && (
                                <p>Est. {shopProfile.foundedYear}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
                          <div className="flex items-start space-x-3">
                            <HelpCircle className="h-5 w-5 text-indigo-600 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-gray-900">Preview Info</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                This shows how your shop information will appear on invoices, receipts, and other documents.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Staff Management Tab */}
            {activeTab === 'staff' && (
              <div className="space-y-6">
                {/* Staff Management Header */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Team Management</h2>
                      <p className="text-gray-600 mt-1">Invite and manage your team members</p>
                    </div>
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                    >
                      <UserPlus className="h-5 w-5" />
                      <span>Invite Team Member</span>
                    </button>
                  </div>

                  {/* Search and Filter */}
                  <div className="mt-6 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search team members..."
                        value={staffSearchQuery}
                        onChange={(e) => setStaffSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/50 backdrop-blur-sm"
                      />
                    </div>
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <select
                        value={staffFilter}
                        onChange={(e) => setStaffFilter(e.target.value as any)}
                        className="pl-10 pr-8 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/50 backdrop-blur-sm min-w-48"
                      >
                        <option value="all">All Members</option>
                        <option value="active">Active Only</option>
                        <option value="invited">Invited Only</option>
                        <option value="admin">Admins</option>
                        <option value="staff">Staff</option>
                      </select>
                    </div>
                  </div>

                  {/* Bulk Actions */}
                  {selectedStaff.length > 0 && (
                    <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-indigo-900">
                          {selectedStaff.length} member{selectedStaff.length !== 1 ? 's' : ''} selected
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleBulkStaffAction('activate')}
                            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Activate
                          </button>
                          <button
                            onClick={() => handleBulkStaffAction('deactivate')}
                            className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                          >
                            Deactivate
                          </button>
                          <button
                            onClick={() => handleBulkStaffAction('delete')}
                            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Staff List */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
                  <div className="divide-y divide-gray-100">
                    {filteredStaff.map((member, index) => (
                      <div
                        key={member.id}
                        className={`p-6 hover:bg-gray-50/50 transition-all duration-200 ${
                          index === 0 ? 'rounded-t-2xl' : ''
                        } ${
                          index === filteredStaff.length - 1 ? 'rounded-b-2xl' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <input
                            type="checkbox"
                            checked={selectedStaff.includes(member.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStaff(prev => [...prev, member.id]);
                              } else {
                                setSelectedStaff(prev => prev.filter(id => id !== member.id));
                              }
                            }}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          
                          <div className="flex-shrink-0">
                            {member.avatar ? (
                              <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                              <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-lg">
                                  {member.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3">
                              <h4 className="font-semibold text-gray-900 truncate">{member.name}</h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                member.role === 'Admin' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {member.role}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                member.status === 'Active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : member.status === 'Invited'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {member.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">{member.email}</p>
                            <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                              <span>Joined {new Date(member.invitedAt).toLocaleDateString()}</span>
                              {member.lastActive && (
                                <span>Last active {new Date(member.lastActive).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setEditingStaff(member)}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                              title="Edit member"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setRemovingStaff(member)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                              title="Remove member"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {filteredStaff.length === 0 && (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {staff.length === 0 ? 'No team members yet' : 'No matches found'}
                      </h3>
                      <p className="text-gray-600 mb-6">
                        {staff.length === 0 
                          ? 'Invite your first team member to get started'
                          : 'Try adjusting your search or filters'
                        }
                      </p>
                      {staff.length === 0 && (
                        <button
                          onClick={() => setShowInviteModal(true)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                        >
                          Invite First Team Member
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Enhanced Data Management Tab */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                {/* Export Data Section */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-8">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="p-3 bg-emerald-100 rounded-xl">
                      <Download className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Export Business Data</h3>
                      <p className="text-gray-600">Download your complete business data for backup or analysis</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h4 className="font-medium text-gray-900 mb-1">Orders & Sales</h4>
                      <p className="text-sm text-gray-600">All transaction records</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h4 className="font-medium text-gray-900 mb-1">Customer Data</h4>
                      <p className="text-sm text-gray-600">Contact information & history</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h4 className="font-medium text-gray-900 mb-1">Inventory</h4>
                      <p className="text-sm text-gray-600">Product catalog & stock levels</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleExportData()}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  >
                    <Download className="h-5 w-5" />
                    <span>Export All Data (CSV)</span>
                  </button>
                </div>

                {/* Enhanced Category Manager */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-indigo-100 rounded-xl">
                        <Database className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">Expense Categories</h3>
                        <p className="text-gray-600">Organize your business expenses</p>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search categories..."
                        value={categorySearchQuery}
                        onChange={(e) => setCategorySearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 w-64 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/50"
                      />
                    </div>
                  </div>
                  
                  {/* Add Category Form */}
                  <div className="flex items-center space-x-4 mb-8 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Enter category name"
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/80"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                    />
                    <div className="flex items-center space-x-2">
                      <div className="grid grid-cols-5 gap-1 p-2 bg-white rounded-lg border border-gray-200">
                        {categoryColors.map(color => (
                          <button
                            key={color}
                            onClick={() => setNewCategoryColor(color)}
                            className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                              newCategoryColor === color ? 'border-gray-400 scale-110' : 'border-gray-200'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <button
                        onClick={handleAddCategory}
                        disabled={!newCategoryName.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2"
                        >
                        <Plus className="h-4 w-4" />
                        <span>Add Category</span>
                      </button>

                    </div>
                  </div>

                  {/* Categories Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {expenseCategories
                      .filter(category => 
                        categorySearchQuery === '' || 
                        category.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
                      )
                      .map((category) => (
                      <div key={category.id} className="group p-4 border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all duration-200 bg-white/50">
                        {editingCategory?.id === category.id ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={editingCategory.name}
                              onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleUpdateCategory(category.id, editingCategory.name);
                                } else if (e.key === 'Escape') {
                                  setEditingCategory(null);
                                }
                              }}
                              autoFocus
                            />
                            <div className="flex items-center justify-between">
                              <div className="grid grid-cols-5 gap-1">
                                {categoryColors.map(color => (
                                  <button
                                    key={color}
                                    onClick={() => setEditingCategory({ ...editingCategory, color })}
                                    className={`w-5 h-5 rounded-full border transition-all duration-200 ${
                                      (editingCategory.color || category.color) === color ? 'border-gray-400 scale-110' : 'border-gray-200'
                                    }`}
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleUpdateCategory(category.id, editingCategory.name)}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setEditingCategory(null)}
                                  className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-3 flex-1">
                                <div 
                                  className="w-4 h-4 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: category.color || '#6366F1' }}
                                />
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-semibold text-gray-900 truncate">{category.name}</h4>
                                  <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                                    <span>Created {new Date(category.createdAt).toLocaleDateString()}</span>
                                    {category.usageCount && (
                                      <span>• {category.usageCount} uses</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                  onClick={() => setEditingCategory(category)}
                                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(category.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                  disabled={category.isDefault}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {expenseCategories.length === 0 && (
                    <div className="text-center py-12">
                      <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">No categories yet</h4>
                      <p className="text-gray-600">Create your first expense category to get started</p>
                    </div>
                  )}
                </div>

                {/* Enhanced Danger Zone */}
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-8">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="p-3 bg-red-100 rounded-xl">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-red-900">Danger Zone</h3>
                      <p className="text-red-700">Irreversible actions that affect your data</p>
                    </div>
                  </div>
                  
                  <div className="bg-white/80 rounded-xl p-6 border border-red-200">
                    <h4 className="font-semibold text-gray-900 mb-4">Archive Old Data</h4>
                    <p className="text-gray-600 mb-6">
                      Archive data before a specific date to improve performance. Archived data cannot be recovered.
                    </p>
                    
                    <div className="flex items-center space-x-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Archive data before:</label>
                        <input
                          type="date"
                          value={archiveDate}
                          onChange={(e) => setArchiveDate(e.target.value)}
                          max={new Date().toISOString().split('T')[0]}
                          className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                        />
                      </div>
                      <button
                        onClick={() => setShowArchiveModal(true)}
                        disabled={!archiveDate}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 mt-6"
                      >
                        <Archive className="h-4 w-4" />
                        <span>Archive Old Data</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Integrations Tab */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                {/* Integrations Header */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Integrations & Notifications</h2>
                  <p className="text-gray-600">Connect external services and manage notifications</p>
                </div>

                {/* Integration Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Telegram Integration */}
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center">
                          <MessageCircle className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">Telegram Bot</h3>
                          <p className="text-gray-600 text-sm">Real-time notifications and bot commands</p>
                        </div>
                      </div>
                      {integrations.telegram.connected && (
                        <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">Connected</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <span className="text-sm font-medium text-gray-700">Order Notifications</span>
                        <button
                          onClick={() => setIntegrations(prev => ({
                            ...prev,
                            telegram: { ...prev.telegram, notifications: !prev.telegram.notifications }
                          }))}
                          className={`relative w-10 h-5 rounded-full transition-all duration-300 ${
                            integrations.telegram.notifications ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 ${
                            integrations.telegram.notifications ? 'left-5' : 'left-0.5'
                          }`} />
                        </button>
                      </div>
                      
                      {integrations.telegram.connected ? (
                        <button
                          onClick={() => window.open(integrations.telegram.botLink, '_blank')}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>Open Telegram Bot</span>
                        </button>
                      ) : (
                        <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200">
                          Connect Telegram
                        </button>
                      )}
                    </div>
                  </div>

                  {/* WhatsApp Integration */}
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 opacity-50" />
                    <div className="relative">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center">
                            <Smartphone className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">WhatsApp Business</h3>
                            <p className="text-gray-600 text-sm">Send bills and customer notifications</p>
                          </div>
                        </div>
                        <div className="bg-yellow-100 px-3 py-1 rounded-full">
                          <span className="text-sm font-medium text-yellow-700">Coming Soon</span>
                        </div>
                      </div>
                      
                      <div className="space-y-4 opacity-60">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <span className="text-sm font-medium text-gray-700">Auto-send Bills</span>
                          <div className="w-10 h-5 bg-gray-300 rounded-full"></div>
                        </div>
                        <button className="w-full bg-gray-300 text-gray-500 px-6 py-3 rounded-xl font-semibold cursor-not-allowed">
                          Not Available Yet
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Email Integration */}
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center">
                          <Mail className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">Email Notifications</h3>
                          <p className="text-gray-600 text-sm">Send receipts and reports via email</p>
                        </div>
                      </div>
                      {integrations.email.connected && (
                        <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">Connected</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-3">
                        {Object.entries(notifications).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <span className="text-sm font-medium text-gray-700 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <button
                              onClick={() => setNotifications(prev => ({ ...prev, [key]: !value }))}
                              className={`relative w-10 h-5 rounded-full transition-all duration-300 ${
                                value ? 'bg-purple-600' : 'bg-gray-300'
                              }`}
                            >
                              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 ${
                                value ? 'left-5' : 'left-0.5'
                              }`} />
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      <button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200">
                        {integrations.email.connected ? 'Manage Email Settings' : 'Connect Email'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                {/* Theme Selection */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Theme Preferences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { key: 'light', icon: Sun, title: 'Light Mode', desc: 'Clean and bright interface', gradient: 'from-yellow-400 to-orange-500' },
                      { key: 'dark', icon: Moon, title: 'Dark Mode', desc: 'Easy on the eyes', gradient: 'from-indigo-500 to-purple-600' },
                      { key: 'auto', icon: Monitor, title: 'Auto Mode', desc: 'Follows system preference', gradient: 'from-gray-400 to-gray-600' }
                    ].map(({ key, icon: Icon, title, desc, gradient }) => (
                      <button
                        key={key}
                        onClick={() => handleAppearanceChange('theme', key)}
                        className={`p-6 border-2 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] ${
                          theme === key
                            ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-center space-y-4">
                          <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-2xl mx-auto flex items-center justify-center`}>
                            <Icon className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-lg">{title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{desc}</p>
                          </div>
                          {theme === key && (
                            <div className="flex items-center justify-center">
                              <CheckCircle className="h-5 w-5 text-indigo-600" />
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Display Settings */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Display Settings</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Font Size */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4">Font Size</h4>
                      <div className="space-y-3">
                        {[
                          { key: 'small', label: 'Small', preview: 'text-sm' },
                          { key: 'medium', label: 'Medium', preview: 'text-base' },
                          { key: 'large', label: 'Large', preview: 'text-lg' }
                        ].map(({ key, label, preview }) => (
                          <button
                            key={key}
                            onClick={() => handleAppearanceChange('fontSize', key)}
                            className={`w-full p-4 border-2 rounded-xl text-left transition-all duration-200 ${
                              fontSize === key
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`font-medium ${preview}`}>{label}</span>
                              {fontSize === key && <CheckCircle className="h-4 w-4 text-indigo-600" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Compact Mode */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4">Layout Density</h4>
                      <div className="space-y-3">
                        <button
                          onClick={() => handleAppearanceChange('compactMode', !compactMode)}
                          className={`w-full p-4 border-2 rounded-xl text-left transition-all duration-200 ${
                            compactMode
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">Compact Mode</span>
                              <p className="text-sm text-gray-600">Reduce spacing for more content</p>
                            </div>
                            <div className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                              compactMode ? 'bg-indigo-600' : 'bg-gray-300'
                            }`}>
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${
                                compactMode ? 'left-7' : 'left-1'
                              }`} />
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Language Settings */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Language & Region</h3>
                  
                  <div className="flex items-center space-x-6">
                    <div className="flex-shrink-0">
                      <Globe className="h-8 w-8 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Interface Language</label>
                      <select
                        value={language}
                        onChange={(e) => handleAppearanceChange('language', e.target.value)}
                        className="w-full md:w-80 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/50 text-lg"
                      >
                        <option value="en">🇺🇸 English</option>
                        <option value="kn">🇮🇳 ಕನ್ನಡ (Kannada)</option>
                      </select>
                      <p className="text-sm text-gray-600 mt-2">Change the interface language for your dashboard</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Security Overview */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-8">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <Shield className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Security & Access</h2>
                      <p className="text-gray-600">Manage account security and access controls</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-green-50 rounded-xl border border-green-200">
                      <div className="flex items-center space-x-3 mb-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-900">Account Secured</span>
                      </div>
                      <p className="text-sm text-green-700">Your account has strong security settings enabled</p>
                    </div>
                    
                    <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-center space-x-3 mb-3">
                        <Lock className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-blue-900">Data Encrypted</span>
                      </div>
                      <p className="text-sm text-blue-700">All your business data is encrypted at rest</p>
                    </div>
                    
                    <div className="p-6 bg-purple-50 rounded-xl border border-purple-200">
                      <div className="flex items-center space-x-3 mb-3">
                        <Key className="h-5 w-5 text-purple-600" />
                        <span className="font-semibold text-purple-900">Access Controlled</span>
                      </div>
                      <p className="text-sm text-purple-700">Role-based permissions protect your data</p>
                    </div>
                  </div>
                </div>

                {/* Password & Authentication */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Password & Authentication</h3>
                  
                  <div className="space-y-6">
                    <button className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center space-x-2">
                      <Key className="h-4 w-4" />
                      <span>Change Password</span>
                    </button>
                    
                    <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-yellow-900">Two-Factor Authentication</h4>
                          <p className="text-sm text-yellow-700 mt-1">
                            Enable 2FA for additional security. This feature is coming soon.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Privacy */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Data Privacy & Control</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <span className="font-medium text-gray-900">Data Analytics</span>
                        <p className="text-sm text-gray-600">Help improve the platform with usage data</p>
                      </div>
                      <button className="relative w-12 h-6 bg-indigo-600 rounded-full">
                        <div className="absolute top-1 left-7 w-4 h-4 bg-white rounded-full transition-all duration-300" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <span className="font-medium text-gray-900">Marketing Communications</span>
                        <p className="text-sm text-gray-600">Receive updates and feature announcements</p>
                      </div>
                      <button className="relative w-12 h-6 bg-gray-300 rounded-full">
                        <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-300" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Toast Notification */}
        {showToast && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className={`flex items-center space-x-3 px-6 py-4 rounded-xl shadow-lg border backdrop-blur-sm transition-all duration-500 transform ${
              showToast.type === 'success' 
                ? 'bg-green-50/90 border-green-200 text-green-800'
                : showToast.type === 'error'
                ? 'bg-red-50/90 border-red-200 text-red-800'
                : 'bg-blue-50/90 border-blue-200 text-blue-800'
            }`}>
              <div className="flex-shrink-0">
                {showToast.type === 'success' && <CheckCircle className="h-5 w-5" />}
                {showToast.type === 'error' && <AlertTriangle className="h-5 w-5" />}
                {showToast.type === 'info' && <Bell className="h-5 w-5" />}
              </div>
              <span className="font-medium">{showToast.message}</span>
              <button
                onClick={() => setShowToast(null)}
                className="flex-shrink-0 hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Modals */}
        
        {/* Invite Staff Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all duration-300 scale-100">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Invite Team Member</h3>
                  <p className="text-gray-600 mt-1">Send an invitation to join your team</p>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Full Name</label>
                  <input
                    type="text"
                    value={newStaffForm.name}
                    onChange={(e) => setNewStaffForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    placeholder="Enter team member's name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Email Address</label>
                  <input
                    type="email"
                    value={newStaffForm.email}
                    onChange={(e) => setNewStaffForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Role</label>
                  <select
                    value={newStaffForm.role}
                    onChange={(e) => setNewStaffForm(prev => ({ ...prev, role: e.target.value as 'Admin' | 'Staff' }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  >
                    <option value="Staff">Staff Member</option>
                    <option value="Admin">Administrator</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    {newStaffForm.role === 'Admin' ? 'Full access to all features and settings' : 'Limited access to daily operations'}
                  </p>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-100">
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleInviteStaff}
                    disabled={!newStaffForm.name.trim() || !newStaffForm.email.trim()}
                    className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] disabled:cursor-not-allowed"
                  >
                    Send Invitation
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Staff Modal */}
        {editingStaff && (
          <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all duration-300 scale-100">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Edit Team Member</h3>
                  <p className="text-gray-600 mt-1">Update member information and role</p>
                </div>
                <button
                  onClick={() => setEditingStaff(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Full Name</label>
                  <input
                    type="text"
                    value={editingStaff.name}
                    onChange={(e) => setEditingStaff(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Role</label>
                  <select
                    value={editingStaff.role}
                    onChange={(e) => setEditingStaff(prev => prev ? { ...prev, role: e.target.value as 'Admin' | 'Staff' } : null)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  >
                    <option value="Staff">Staff Member</option>
                    <option value="Admin">Administrator</option>
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-100">
                  <button
                    onClick={() => setEditingStaff(null)}
                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => editingStaff && handleUpdateStaff(editingStaff.id, { name: editingStaff.name, role: editingStaff.role })}
                    className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Confirmation Modal */}
        {(removingStaff || showArchiveModal) && (
          <ConfirmationModal
            isOpen={true}
            title={removingStaff ? "Remove Team Member" : "Archive Data"}
            message={
              removingStaff 
                ? `Are you sure you want to remove ${removingStaff.name} from your team? This will revoke their access immediately and cannot be undone.`
                : `Are you sure you want to archive all data before ${archiveDate ? new Date(archiveDate).toLocaleDateString() : 'the selected date'}? This action is permanent and cannot be reversed.`
            }
            confirmWord={removingStaff ? "REMOVE" : "ARCHIVE"}
            onConfirm={removingStaff ? () => handleRemoveStaff(removingStaff.id) : handleArchiveData}
            onCancel={() => {
              setRemovingStaff(null);
              setShowArchiveModal(false);
            }}
            isDangerous={true}
          />
        )}
      </div>
    </div>
  );
};

// Enhanced Confirmation Modal Component
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmWord,
  onConfirm,
  onCancel,
  isDangerous = false,
  isLoading = false
}) => {
  const [inputValue, setInputValue] = useState('');
  
  const handleConfirm = () => {
    if (inputValue === confirmWord) {
      onConfirm();
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue === confirmWord) {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all duration-300 scale-100">
        <div className="flex items-start space-x-4 mb-6">
          {isDangerous && (
            <div className="p-3 bg-red-100 rounded-xl flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          )}
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
            <p className="text-gray-700 mt-2 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Type <span className={`font-bold px-2 py-1 rounded ${isDangerous ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'}`}>{confirmWord}</span> to confirm:
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200 ${
              isDangerous 
                ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                : 'border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
            } ${inputValue === confirmWord ? (isDangerous ? 'border-red-500 bg-red-50' : 'border-indigo-500 bg-indigo-50') : ''}`}
            placeholder={`Type ${confirmWord}`}
            autoFocus
          />
          {inputValue && inputValue !== confirmWord && (
            <p className="text-sm text-red-600 mt-2">Please type the exact word to confirm</p>
          )}
        </div>

        <div className="flex items-center justify-end space-x-4">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-xl font-semibold transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={inputValue !== confirmWord || isLoading}
            className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 transform hover:scale-[1.02] disabled:cursor-not-allowed ${
              isDangerous
                ? 'bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>Confirm {isDangerous ? 'Removal' : 'Action'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

export default Settings;