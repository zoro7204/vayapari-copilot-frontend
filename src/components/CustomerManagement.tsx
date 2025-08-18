import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Eye, Edit, Trash2, X, ArrowUpDown, Download, TrendingUp, Users, Calendar, Star, Phone, User, ShoppingBag, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';
import { useScrollLock } from './useScrollLock';

// Types
interface Customer {
  name: string;
  phone: string;
  totalOrders: number;
  totalSpend: number;
  lastPurchaseDate: string;
  id: string;
  status: 'Active' | 'Inactive';
  since: string;
}

interface CustomerDetail extends Customer {
  lifetimeSpend: number;
  averageOrderValue: number;
  orderHistory: OrderHistoryItem[];
}

interface OrderHistoryItem {
  orderId: string;
  date: string;
  items: string;
  amount: number;
  status: string;
}

// API Service Functions
const API_BASE = '/api';

const fetchCustomers = async (period: string): Promise<{customers: Customer[], growthData: any[]}> => {
  const response = await fetch(`${API_BASE}/customers?period=${period}`);
  if (!response.ok) throw new Error('Failed to fetch customers');
  return response.json(); // This now returns { customers: [...], growthData: [...] }
};

const fetchCustomerDetail = async (id: string): Promise<CustomerDetail> => {
  const response = await fetch(`${API_BASE}/customers/${encodeURIComponent(id)}`);
  if (!response.ok) throw new Error('Failed to fetch customer details');
  return response.json();
};

const createCustomer = async (customerData: { name: string; phone: string }): Promise<void> => {
  const response = await fetch(`${API_BASE}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customerData),
  });
  if (!response.ok) throw new Error('Failed to create customer');
};

const updateCustomer = async (id: string, customerData: { name: string; phone: string }): Promise<void> => {
  const response = await fetch(`${API_BASE}/customers/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customerData),
  });
  if (!response.ok) throw new Error('Failed to update customer');
};

const deleteCustomer = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/customers/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete customer');
};

const CustomerManagement: React.FC<{ setIsModalOpen: (isOpen: boolean) => void }> = ({ setIsModalOpen }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Customer; direction: 'ascending' | 'descending' } | null>({ key: 'totalSpend', direction: 'descending' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [showChart, setShowChart] = useState(true);
  const [growthData, setGrowthData] = useState<{ date: string; newCustomers: number }[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Modal states
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<CustomerDetail | null>(null);
  const [periodFilter, setPeriodFilter] = useState('all'); // 'all', 'month', 'week', 'today'

  // This will watch your modal states and apply the scroll lock when any are true
  useScrollLock(isProfileModalOpen || isNewCustomerModalOpen || isEditModalOpen);

  useEffect(() => {
  setIsLoading(true);
  fetchCustomers(periodFilter)
    .then(data => {
      setCustomers(data.customers);
      setGrowthData(data.growthData);
    })
    .catch(error => console.error('Failed to fetch customers:', error))
    .finally(() => setIsLoading(false));
}, [periodFilter, refreshTrigger]);
  
  const handleOpenNewCustomerModal = () => setIsNewCustomerModalOpen(true);
  const handleCloseNewCustomerModal = () => setIsNewCustomerModalOpen(false);

  const handleSaveCustomer = async (customerData: any) => {
    try {
      await createCustomer(customerData);
      handleCloseNewCustomerModal();
      setRefreshTrigger(t => t + 1);
    } catch (error) {
      console.error("Failed to save and refresh customer list:", error);
    }
  };

  const handleViewProfile = async (event: React.MouseEvent, customer: Customer) => {
    event.stopPropagation(); // <-- This is the critical line that stops the event bubble
    try {
      setIsLoading(true);
      const customerDetail = await fetchCustomerDetail(customer.id);
      setSelectedCustomerDetail(customerDetail);
      setIsProfileModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch customer details:", error);
      alert("Error: Could not load customer profile.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false);
    setSelectedCustomerDetail(null);
  };

  const handleDeleteCustomer = async (customerToDelete: Customer) => {
    if (window.confirm(`Are you sure you want to delete ${customerToDelete.name}? This action cannot be undone.`)) {
      try {
        await deleteCustomer(customerToDelete.id);
        setCustomers(prevCustomers => prevCustomers.filter(customer => customer.id !== customerToDelete.id));
      } catch (error) {
        console.error("Failed to delete customer:", error);
        alert("Error: Could not delete the customer.");
      }
    }
  };

  const handleOpenEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleUpdateCustomer = async (customerId: string, updates: any) => {
    try {
      await updateCustomer(customerId, updates);
      handleCloseEditModal();
      setRefreshTrigger(t => t + 1);
    } catch (error) {
      console.error("Failed to update and refresh customer list:", error);
    }
  };

  const requestSort = (key: keyof Customer) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const processedCustomers = useMemo(() => {
    let processedData = [...customers];
    
    processedData = processedData.filter(customer => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (customer.name?.toLowerCase().includes(searchLower) ||
                            customer.phone?.toLowerCase().includes(searchLower));
                            
      const matchesStatus = statusFilter === 'all' || customer.status.toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
    
    if (sortConfig !== null) {
      processedData.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return 1;
        if (bValue === undefined) return -1;
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return processedData;
  }, [customers, searchTerm, sortConfig, statusFilter]);

  // Chart data preparation
  const topCustomersChartData = useMemo(() => {
    return customers
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, 5)
      .map(customer => ({
        name: customer.name.length > 10 ? customer.name.substring(0, 10) + '...' : customer.name,
        revenue: customer.totalSpend
      }));
  }, [customers]);

  const customerGrowthData = useMemo(() => {
    const now = new Date();
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return date;
    }).reverse();

    return last6Months.map(date => {
      const monthCustomers = customers.filter(customer => {
        const customerDate = new Date(customer.since);
        return customerDate.getMonth() === date.getMonth() && 
               customerDate.getFullYear() === date.getFullYear();
      }).length;
      
      return {
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        customers: monthCustomers
      };
    });
  }, [customers]);

  const handleDownloadCsv = () => {
    const dataForCsv = processedCustomers.map(customer => ({
      'Customer Name': customer.name,
      'Phone Number': customer.phone,
      'Total Orders': customer.totalOrders,
      'Total Spend': customer.totalSpend,
      'Last Purchase Date': new Date(customer.lastPurchaseDate).toLocaleDateString('en-IN'),
      'Status': customer.status,
      'Customer Since': customer.since,
    }));
    
    const csv = Papa.unparse(dataForCsv);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    
    let filename = 'customers';
    if (statusFilter !== 'all') {
      filename = `customers-${statusFilter}`;
    }
    filename += `-${new Date().toISOString().split('T')[0]}`;
    
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-emerald-100 text-emerald-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCustomerTag = (customer: Customer) => {
    if (customer.totalSpend > 10000) return { label: 'VIP', color: 'bg-purple-100 text-purple-800' };
    if (customer.totalOrders === 1) return { label: 'New', color: 'bg-blue-100 text-blue-800' };
    if (customer.status === 'Inactive') return { label: 'Inactive', color: 'bg-gray-100 text-gray-800' };
    return null;
  };

  // Summary Statistics
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'Active').length;
  
  const thisMonth = new Date();
  const newCustomersThisMonth = customers.filter(customer => {
    const customerDate = new Date(customer.since);
    return customerDate.getMonth() === thisMonth.getMonth() && 
           customerDate.getFullYear() === thisMonth.getFullYear();
  }).length;
  
  const topCustomer = customers.reduce((max, current) => 
    (current.totalSpend > max.totalSpend) ? current : max, 
    { name: 'N/A', totalSpend: 0 }
  );

  if (isLoading) return <div className="p-6 text-center">Loading customers...</div>;

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Customer Management</h1>
          <p className="text-gray-600">Manage and track all your customers efficiently</p>
        </div>
        <button 
          onClick={handleDownloadCsv} 
          className="bg-gray-200 text-gray-800 px-4 py-3 rounded-lg font-medium hover:bg-gray-300 hover:shadow-md transition-all duration-200 flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Download CSV</span>
        </button>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-3xl font-bold text-gray-900">{totalCustomers}</p>
              <p className="text-sm text-indigo-600 font-medium mt-1">
                <Users className="h-4 w-4 inline mr-1" />
                All time
              </p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Users className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Customers</p>
              <p className="text-3xl font-bold text-gray-900">{activeCustomers}</p>
              <p className="text-sm text-emerald-600 font-medium mt-1">
                <Activity className="h-4 w-4 inline mr-1" />
                Currently active
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
              <Activity className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">New This Month</p>
              <p className="text-3xl font-bold text-gray-900">{newCustomersThisMonth}</p>
              <p className="text-sm text-blue-600 font-medium mt-1">
                <Calendar className="h-4 w-4 inline mr-1" />
                New customers
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Top Customer</p>
              <p className="text-xl font-bold text-gray-900 truncate">{topCustomer.name}</p>
              <p className="text-sm text-amber-600 font-medium mt-1">
                <Star className="h-4 w-4 inline mr-1" />
                ₹{topCustomer.totalSpend.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <Star className="h-8 w-8 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      {(topCustomersChartData.length > 0 || customerGrowthData.length > 0) && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Customer Analytics</h3>
              <p className="text-sm text-gray-600 mt-1">Visual breakdown of your top customers and growth trends</p>
            </div>
            <button
              onClick={() => setShowChart(!showChart)}
              className="px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
            >
              {showChart ? 'Hide Charts' : 'Show Charts'}
            </button>
          </div>
          
          <div className="flex items-center space-x-2 mb-6 border-b pb-4">
            <span className="text-sm font-medium text-gray-600">Period:</span>
            {['today', 'week', 'month', 'all'].map((period) => (
              <button 
                key={period}
                onClick={() => setPeriodFilter(period)} 
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  periodFilter === period 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {period === 'all' ? 'All Time' : period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>

          {showChart && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Customers Bar Chart */}
              <div className="h-80">
                <h4 className="text-md font-medium text-gray-700 mb-4">Top 5 Customers by Revenue</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCustomersChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Customer Growth Line Chart */}
              <div className="h-80">
                <h4 className="text-md font-medium text-gray-700 mb-4">Customer Growth Over Time</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={growthData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip formatter={(value) => [`${value} customers`, 'New Customers']} />
                    <Line 
                      type="monotone" 
                      dataKey="newCustomers" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Search and Filter Bar */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1 relative max-w-xs">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search customers..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          
          {/* Status Filter Pills */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-600">Status:</span>
            {['all', 'active', 'inactive'].map((status) => (
              <button 
                key={status}
                onClick={() => setStatusFilter(status)} 
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                  statusFilter === status 
                    ? 'bg-indigo-600 text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                }`}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Customers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-800">
                  <button onClick={() => requestSort('name')} className="flex items-center space-x-1 hover:text-indigo-600 transition-colors duration-200">
                    <span>Customer Name</span>
                    <ArrowUpDown className={`h-4 w-4 transition-colors duration-200 ${
                      sortConfig?.key === 'name' ? 'text-indigo-600' : 'text-gray-400'
                    }`} />
                  </button>
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-800">Phone Number</th>
                <th className="text-right py-4 px-6 font-semibold text-gray-800">
                  <button onClick={() => requestSort('totalOrders')} className="flex items-center space-x-1 ml-auto hover:text-indigo-600 transition-colors duration-200">
                    <span>Total Orders</span>
                    <ArrowUpDown className={`h-4 w-4 transition-colors duration-200 ${
                      sortConfig?.key === 'totalOrders' ? 'text-indigo-600' : 'text-gray-400'
                    }`} />
                  </button>
                </th>
                <th className="text-right py-4 px-6 font-semibold text-gray-800">
                  <button onClick={() => requestSort('totalSpend')} className="flex items-center space-x-1 ml-auto hover:text-indigo-600 transition-colors duration-200">
                    <span>Total Spend</span>
                    <ArrowUpDown className={`h-4 w-4 transition-colors duration-200 ${
                      sortConfig?.key === 'totalSpend' ? 'text-indigo-600' : 'text-gray-400'
                    }`} />
                  </button>
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-800">
                  <button onClick={() => requestSort('lastPurchaseDate')} className="flex items-center space-x-1 hover:text-indigo-600 transition-colors duration-200">
                    <span>Last Purchase</span>
                    <ArrowUpDown className={`h-4 w-4 transition-colors duration-200 ${
                      sortConfig?.key === 'lastPurchaseDate' ? 'text-indigo-600' : 'text-gray-400'
                    }`} />
                  </button>
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-800">
                  <button onClick={() => requestSort('status')} className="flex items-center space-x-1 hover:text-indigo-600 transition-colors duration-200">
                    <span>Status</span>
                    <ArrowUpDown className={`h-4 w-4 transition-colors duration-200 ${
                      sortConfig?.key === 'status' ? 'text-indigo-600' : 'text-gray-400'
                    }`} />
                  </button>
                </th>
                <th className="text-center py-4 px-6 font-semibold text-gray-800">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {processedCustomers.map((customer) => {
                const tag = getCustomerTag(customer);
                return (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-indigo-600" />
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{customer.name}</p>
                          {tag && (
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${tag.color}`}>
                              {tag.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        {customer.phone}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        <ShoppingBag className="h-4 w-4 mr-1" />
                        {customer.totalOrders}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="font-semibold text-gray-900">₹{customer.totalSpend.toLocaleString()}</span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {new Date(customer.lastPurchaseDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={(e) => handleViewProfile(e, customer)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group" 
                          title="View Profile"
                        >
                          <Eye className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(customer)} 
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200 group" 
                          title="Edit Customer"
                        >
                          <Edit className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        </button>
                        <button 
                          onClick={() => handleDeleteCustomer(customer)} 
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group" 
                          title="Delete Customer"
                        >
                          <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      \{/* Enhanced Empty State */}
      {processedCustomers.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100 mt-6">
          <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <Users className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No customers found</h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            {searchTerm || statusFilter !== 'all' 
              ? "Try adjusting your search or filter criteria to find what you're looking for."
              : "Get started by adding your first customer."
            }
          </p>
          <button 
            onClick={handleOpenNewCustomerModal}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors inline-flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Your First Customer</span>
          </button>
        </div>
      )}
      {/* NOTE: The extra closing brackets have been removed from here.
        Now, the modals and button are part of the same return block.
      */}

      {/* Modals */}
      {isProfileModalOpen && selectedCustomerDetail && (
        <CustomerProfileModal customer={selectedCustomerDetail} onClose={handleCloseProfileModal} />
      )}
      
      {isNewCustomerModalOpen && (
        <NewCustomerModal onClose={handleCloseNewCustomerModal} onSave={handleSaveCustomer} />
      )}

      {isEditModalOpen && selectedCustomer && (
        <EditCustomerModal 
          customer={selectedCustomer} 
          onClose={handleCloseEditModal} 
          onSave={handleUpdateCustomer} 
        />
      )}

      {/* Enhanced Floating Action Button */}
      <button
        onClick={handleOpenNewCustomerModal}
        className="fixed bottom-8 right-8 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all duration-200 hover:scale-110 z-40"
        title="Add New Customer"
      >
        <Plus className="h-6 w-6" />
      </button>

    </div> // This is the final closing div for the component's main container
  );
};

export default CustomerManagement;

// =======================================================
//  Enhanced Customer Profile Modal
// =======================================================
const CustomerProfileModal = ({ customer, onClose }: { customer: CustomerDetail | null, onClose: () => void }) => {
  if (!customer) return null;

  // --- ADD THIS useEffect HOOK ---
  React.useEffect(() => {
    // When the modal opens, hide the scrollbar on the body
    document.body.style.overflow = 'hidden';

    // When the modal closes, restore the scrollbar
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []); // The empty array ensures this only runs when the modal opens and closes

  const getCustomerTag = (customer: CustomerDetail) => {
    if (customer.lifetimeSpend > 10000) return { label: 'VIP', color: 'bg-purple-100 text-purple-800' };
    if (customer.orderHistory.length === 1) return { label: 'New', color: 'bg-blue-100 text-blue-800' };
    if (customer.status === 'Inactive') return { label: 'Inactive', color: 'bg-gray-100 text-gray-800' };
    return null;
  };

  const tag = getCustomerTag(customer);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 backdrop-blur-sm"
    onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 animate-fade-in-up"
      onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{customer.name}</h2>
              <div className="flex items-center space-x-3 mt-2">
                <span className="text-gray-600 flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  {customer.phone}
                </span>
                {tag && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${tag.color}`}>
                    {tag.label}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Customer Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl border border-indigo-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-700">Lifetime Spend</p>
                <p className="text-2xl font-bold text-indigo-900">₹{customer.lifetimeSpend.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-indigo-200 rounded-lg">
                <Star className="h-6 w-6 text-indigo-700" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700">Average Order Value</p>
                <p className="text-2xl font-bold text-emerald-900">₹{customer.averageOrderValue.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-emerald-200 rounded-lg">
                <TrendingUp className="h-6 w-6 text-emerald-700" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">Total Orders</p>
                <p className="text-2xl font-bold text-amber-900">{customer.orderHistory.length}</p>
              </div>
              <div className="p-3 bg-amber-200 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-amber-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Order History */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Order History
          </h3>
          
          {customer.orderHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white border border-gray-200 rounded-t-lg">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Order ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Items</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white border-l border-r border-b border-gray-200 rounded-b-lg">
                  {customer.orderHistory.map((order, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="py-3 px-4">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                          {order.orderId}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(order.date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {order.items}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">
                        ₹{order.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status.toLowerCase() === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                          order.status.toLowerCase() === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          order.status.toLowerCase() === 'pending' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No order history available</p>
            </div>
          )}
        </div>
        
        {/* Customer Info */}
        <div className="mt-6 p-6 bg-blue-50 rounded-xl border border-blue-200">
          <h4 className="text-lg font-semibold text-blue-900 mb-3">Customer Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700 font-medium">Status:</span>
              <span className="ml-2 text-blue-900">{customer.status}</span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Customer Since:</span>
              <span className="ml-2 text-blue-900">{customer.since}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =======================================================
//  Enhanced New Customer Modal
// =======================================================
interface NewCustomerModalProps {
  onClose: () => void;
  onSave: (customerData: any) => Promise<void>;
}

const NewCustomerModal = ({ onClose, onSave }: NewCustomerModalProps) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      setError('Customer name and phone number are required.');
      return;
    }
    setIsSaving(true);
    setError('');
    
    const customerData = { name: name.trim(), phone: phone.trim() };

    try {
      await onSave(customerData);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md transform transition-all duration-300 scale-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Add New Customer</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
            <input 
              type="text" 
              placeholder="Enter customer name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
            <input 
              type="tel" 
              placeholder="+91 98765 43210" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
            />
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        
        <div className="flex justify-end gap-3 mt-8">
          <button 
            onClick={onClose} 
            className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="px-6 py-3 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors inline-flex items-center space-x-2 font-medium"
          >
            {isSaving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            <span>{isSaving ? 'Adding...' : 'Add Customer'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// =======================================================
//  Enhanced Edit Customer Modal
// =======================================================
interface EditCustomerModalProps {
  customer: Customer;
  onClose: () => void;
  onSave: (customerId: string, updates: any) => Promise<void>;
}

const EditCustomerModal = ({ customer, onClose, onSave }: EditCustomerModalProps) => {
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      setError('Customer name and phone number are required.');
      return;
    }
    setIsSaving(true);
    setError('');
    
    const updates = { name: name.trim(), phone: phone.trim() };

    try {
      await onSave(customer.id, updates);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md transform transition-all duration-300 scale-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Edit Customer</h2>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
            <input 
              type="tel" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
            />
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        
        <div className="flex justify-end gap-3 mt-8">
          <button 
            onClick={onClose} 
            className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="px-6 py-3 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors inline-flex items-center space-x-2 font-medium"
          >
            {isSaving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};