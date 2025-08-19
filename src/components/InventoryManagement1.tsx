import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Eye, Edit, Trash2, X, ArrowUpDown, Download, Upload, TrendingDown, Package, AlertTriangle, DollarSign, BarChart3, PieChart, Box, Tag, IndianRupee, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,Pie, Legend, PieChart as RechartsPieChart, Cell, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';

// Types
interface InventoryItem {
  id: string;
  itemName: string;
  category: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  lowStockThreshold: number;
  lastSoldDate?: string;
}

interface InventoryItemDetail extends InventoryItem {
  totalValue: number;
  profitMargin: number;
  daysSinceLastSold: number;
  stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

// API Service Functions
const API_BASE = '/api';

const fetchInventoryItems = async (): Promise<InventoryItem[]> => {
  const response = await fetch(`${API_BASE}/inventory`);
  if (!response.ok) throw new Error('Failed to fetch inventory items');
  return response.json();
};

const createInventoryItem = async (itemData: Omit<InventoryItem, 'id'>): Promise<void> => {
  const response = await fetch(`${API_BASE}/inventory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(itemData),
  });
  if (!response.ok) throw new Error('Failed to create inventory item');
};

const updateInventoryItem = async (id: string, itemData: Partial<InventoryItem>): Promise<void> => {
  const response = await fetch(`${API_BASE}/inventory/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(itemData),
  });
  if (!response.ok) throw new Error('Failed to update inventory item');
};

const deleteInventoryItem = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/inventory/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete inventory item');
};

const InventoryManagement: React.FC = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof InventoryItem; direction: 'ascending' | 'descending' } | null>({ key: 'itemName', direction: 'ascending' });
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Modal states
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetchInventoryItems()
      .then(setInventoryItems)
      .catch(error => console.error('Failed to fetch inventory items:', error))
      .finally(() => setIsLoading(false));
  }, [refreshTrigger]);

  // Enhanced inventory items with calculated fields
  const enhancedInventoryItems = useMemo(() => {
    return inventoryItems.map(item => {
      const stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock' = 
        item.quantity === 0 ? 'Out of Stock' :
        item.quantity <= item.lowStockThreshold ? 'Low Stock' :
        'In Stock';
      
      const daysSinceLastSold = item.lastSoldDate 
        ? Math.floor((Date.now() - new Date(item.lastSoldDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        ...item,
        totalValue: item.quantity * item.costPrice,
        profitMargin: ((item.sellingPrice - item.costPrice) / item.costPrice * 100),
        daysSinceLastSold,
        stockStatus
      };
    });
  }, [inventoryItems]);

  // Get unique categories for filter
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(inventoryItems.map(item => item.category))];
    return uniqueCategories.sort();
  }, [inventoryItems]);

  // KPI Calculations
  const totalInventoryValue = enhancedInventoryItems.reduce((sum, item) => sum + item.totalValue, 0);
  const lowStockItems = enhancedInventoryItems.filter(item => item.stockStatus === 'Low Stock').length;
  const outOfStockItems = enhancedInventoryItems.filter(item => item.stockStatus === 'Out of Stock').length;
  const deadStockValue = enhancedInventoryItems
    .filter(item => item.daysSinceLastSold > 90)
    .reduce((sum, item) => sum + item.totalValue, 0);

  const handleOpenNewItemModal = () => setIsNewItemModalOpen(true);
  const handleCloseNewItemModal = () => setIsNewItemModalOpen(false);

  const handleSaveItem = async (itemData: any) => {
    try {
      await createInventoryItem(itemData);
      handleCloseNewItemModal();
      setRefreshTrigger(t => t + 1);
    } catch (error) {
      console.error("Failed to save and refresh inventory:", error);
    }
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedItem(null);
  };

  const handleUpdateItem = async (itemId: string, updates: any) => {
    try {
      await updateInventoryItem(itemId, updates);
      handleCloseEditModal();
      setRefreshTrigger(t => t + 1);
    } catch (error) {
      console.error("Failed to update and refresh inventory:", error);
    }
  };

  const handleOpenDeleteModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedItem(null);
  };

  const handleDeleteItem = async () => {
    if (selectedItem) {
      try {
        await deleteInventoryItem(selectedItem.id);
        setInventoryItems(prevItems => prevItems.filter(item => item.id !== selectedItem.id));
        handleCloseDeleteModal();
      } catch (error) {
        console.error("Failed to delete item:", error);
        alert("Error: Could not delete the item.");
      }
    }
  };

  const requestSort = (key: keyof InventoryItem) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const processedItems = useMemo(() => {
    let processedData = [...enhancedInventoryItems];
    
    // Apply filters
    processedData = processedData.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = item.itemName.toLowerCase().includes(searchLower) ||
                           item.category.toLowerCase().includes(searchLower);
                            
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || item.stockStatus.toLowerCase().replace(' ', '') === statusFilter;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
    
    // Apply sorting
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
  }, [enhancedInventoryItems, searchTerm, sortConfig, categoryFilter, statusFilter]);

  // Chart data preparation
  const inventoryValueByCategory = useMemo(() => {
    const categoryData: { [key: string]: number } = {};
    enhancedInventoryItems.forEach(item => {
      categoryData[item.category] = (categoryData[item.category] || 0) + item.totalValue;
    });
    
    return Object.entries(categoryData).map(([category, value]) => ({
      name: category,
      value
    }));
  }, [enhancedInventoryItems]);

  const stockHealthData = useMemo(() => {
    const statusCounts = {
      'In Stock': 0,
      'Low Stock': 0,
      'Out of Stock': 0
    };
    
    enhancedInventoryItems.forEach(item => {
      statusCounts[item.stockStatus]++;
    });
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count
    }));
  }, [enhancedInventoryItems]);

  const topDeadStockItems = useMemo(() => {
    return enhancedInventoryItems
      .filter(item => item.daysSinceLastSold > 90)
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);
  }, [enhancedInventoryItems]);

  const handleDownloadCsv = () => {
    const dataForCsv = processedItems.map(item => ({
      'Item Name': item.itemName,
      'Category': item.category,
      'Quantity': item.quantity,
      'Cost Price': item.costPrice,
      'Selling Price': item.sellingPrice,
      'Low Stock Threshold': item.lowStockThreshold,
      'Total Value': item.totalValue,
      'Status': item.stockStatus,
    }));
    
    const csv = Papa.unparse(dataForCsv);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    
    let filename = 'inventory';
    if (categoryFilter !== 'all') {
      filename = `inventory-${categoryFilter}`;
    }
    filename += `-${new Date().toISOString().split('T')[0]}`;
    
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock': return 'bg-emerald-100 text-emerald-800';
      case 'Low Stock': return 'bg-orange-100 text-orange-800';
      case 'Out of Stock': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  if (isLoading) return <div className="p-6 text-center">Loading inventory...</div>;

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content Area */}
        <div className="flex-1 lg:w-2/3">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Inventory Command Center</h1>
              <p className="text-gray-600">Monitor and manage your stock efficiently</p>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleDownloadCsv} 
                className="bg-gray-200 text-gray-800 px-4 py-3 rounded-lg font-medium hover:bg-gray-300 hover:shadow-md transition-all duration-200 flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
              <button 
                className="bg-blue-200 text-blue-800 px-4 py-3 rounded-lg font-medium hover:bg-blue-300 hover:shadow-md transition-all duration-200 flex items-center space-x-2"
              >
                <Upload className="h-4 w-4" />
                <span>Upload CSV</span>
              </button>
            </div>
          </div>
          
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Inventory Value</p>
                  <p className="text-3xl font-bold text-gray-900">₹{totalInventoryValue.toLocaleString()}</p>
                  <p className="text-sm text-indigo-600 font-medium mt-1">
                    <IndianRupee className="h-4 w-4 inline mr-1" />
                    Total worth
                  </p>
                </div>
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <DollarSign className="h-8 w-8 text-indigo-600" />
                </div>
              </div>
            </div>

            <div 
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer"
              onClick={() => setStatusFilter('lowstock')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                  <p className="text-3xl font-bold text-gray-900">{lowStockItems}</p>
                  <p className="text-sm text-orange-600 font-medium mt-1">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    Need attention
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </div>

            <div 
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer"
              onClick={() => setStatusFilter('outofstock')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                  <p className="text-3xl font-bold text-gray-900">{outOfStockItems}</p>
                  <p className="text-sm text-red-600 font-medium mt-1">
                    <Package className="h-4 w-4 inline mr-1" />
                    Urgent restock
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <Package className="h-8 w-8 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Dead Stock Value</p>
                  <p className="text-3xl font-bold text-gray-900">₹{deadStockValue.toLocaleString()}</p>
                  <p className="text-sm text-purple-600 font-medium mt-1">
                    <TrendingDown className="h-4 w-4 inline mr-1" />
                    90+ days old
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingDown className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
              <div className="flex-1 relative max-w-xs">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search items..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              
              {/* Category Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              {/* Status Filter Pills */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600">Status:</span>
                {['all', 'instock', 'lowstock', 'outofstock'].map((status) => (
                  <button 
                    key={status}
                    onClick={() => setStatusFilter(status)} 
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                      statusFilter === status 
                        ? 'bg-indigo-600 text-white shadow-lg' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                    }`}
                  >
                    {status === 'all' ? 'All' : 
                     status === 'instock' ? 'In Stock' :
                     status === 'lowstock' ? 'Low Stock' : 'Out of Stock'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-gray-800">
                      <button onClick={() => requestSort('itemName')} className="flex items-center space-x-1 hover:text-indigo-600 transition-colors duration-200">
                        <span>Item Name</span>
                        <ArrowUpDown className={`h-4 w-4 transition-colors duration-200 ${
                          sortConfig?.key === 'itemName' ? 'text-indigo-600' : 'text-gray-400'
                        }`} />
                      </button>
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-800">
                      <button onClick={() => requestSort('category')} className="flex items-center space-x-1 hover:text-indigo-600 transition-colors duration-200">
                        <span>Category</span>
                        <ArrowUpDown className={`h-4 w-4 transition-colors duration-200 ${
                          sortConfig?.key === 'category' ? 'text-indigo-600' : 'text-gray-400'
                        }`} />
                      </button>
                    </th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-800">
                      <button onClick={() => requestSort('quantity')} className="flex items-center space-x-1 ml-auto hover:text-indigo-600 transition-colors duration-200">
                        <span>Quantity</span>
                        <ArrowUpDown className={`h-4 w-4 transition-colors duration-200 ${
                          sortConfig?.key === 'quantity' ? 'text-indigo-600' : 'text-gray-400'
                        }`} />
                      </button>
                    </th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-800">
                      <button onClick={() => requestSort('costPrice')} className="flex items-center space-x-1 ml-auto hover:text-indigo-600 transition-colors duration-200">
                        <span>Cost Price</span>
                        <ArrowUpDown className={`h-4 w-4 transition-colors duration-200 ${
                          sortConfig?.key === 'costPrice' ? 'text-indigo-600' : 'text-gray-400'
                        }`} />
                      </button>
                    </th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-800">
                      <button onClick={() => requestSort('sellingPrice')} className="flex items-center space-x-1 ml-auto hover:text-indigo-600 transition-colors duration-200">
                        <span>Selling Price</span>
                        <ArrowUpDown className={`h-4 w-4 transition-colors duration-200 ${
                          sortConfig?.key === 'sellingPrice' ? 'text-indigo-600' : 'text-gray-400'
                        }`} />
                      </button>
                    </th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-800">Low Stock</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-800">Status</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-800">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {processedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Box className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.itemName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center text-sm text-gray-600">
                          <Tag className="h-4 w-4 mr-2" />
                          {item.category}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="font-semibold text-gray-900">{item.quantity}</span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="font-medium text-gray-900">₹{item.costPrice.toLocaleString()}</span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="font-medium text-gray-900">₹{item.sellingPrice.toLocaleString()}</span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="text-sm text-gray-600">{item.lowStockThreshold}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.stockStatus)}`}>
                          {item.stockStatus}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleOpenEditModal(item)} 
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200 group" 
                            title="Edit Item"
                          >
                            <Edit className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          </button>
                          <button 
                            onClick={() => handleOpenDeleteModal(item)} 
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group" 
                            title="Delete Item"
                          >
                            <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Empty State */}
          {processedItems.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100 mt-6">
              <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <Package className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                  ? "Try adjusting your search or filter criteria to find what you're looking for."
                  : "Get started by adding your first inventory item."
                }
              </p>
              <button 
                onClick={handleOpenNewItemModal}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors inline-flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Add Your First Item</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar - Analytics */}
        <div className="lg:w-1/3 space-y-6">
          {/* Inventory Value by Category */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Inventory Value by Category
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={inventoryValueByCategory}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {inventoryValueByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Value']} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stock Health */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Stock Health Overview
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockHealthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip formatter={(value) => [`${value} items`, 'Count']} />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Dead Stock Items */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <TrendingDown className="h-5 w-5 mr-2" />
              Top Dead Stock Items
            </h3>
            <div className="space-y-3">
              {topDeadStockItems.length > 0 ? (
                topDeadStockItems.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{item.itemName}</p>
                      <p className="text-xs text-gray-600">{item.category}</p>
                      <p className="text-xs text-purple-600">{item.daysSinceLastSold} days old</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">₹{item.totalValue.toLocaleString()}</p>
                      <p className="text-xs text-gray-600">{item.quantity} units</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingDown className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No dead stock items</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isNewItemModalOpen && (
        <NewItemModal onClose={handleCloseNewItemModal} onSave={handleSaveItem} categories={categories} />
      )}

      {isEditModalOpen && selectedItem && (
        <EditItemModal 
          item={selectedItem} 
          onClose={handleCloseEditModal} 
          onSave={handleUpdateItem}
          categories={categories}
        />
      )}

      {isDeleteModalOpen && selectedItem && (
        <DeleteConfirmationModal 
          item={selectedItem} 
          onClose={handleCloseDeleteModal} 
          onConfirm={handleDeleteItem}
        />
      )}

      {/* Floating Action Button */}
      <button
        onClick={handleOpenNewItemModal}
        className="fixed bottom-8 right-8 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all duration-200 hover:scale-110 z-40"
        title="Add New Item"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
};

export default InventoryManagement;

// =======================================================
//  New Item Modal
// =======================================================
interface NewItemModalProps {
  onClose: () => void;
  onSave: (itemData: any) => Promise<void>;
  categories: string[];
}

const NewItemModal = ({ onClose, onSave, categories }: NewItemModalProps) => {
  const [formData, setFormData] = useState({
    itemName: '',
    category: '',
    quantity: 0,
    costPrice: 0,
    sellingPrice: 0,
    lowStockThreshold: 5,
  });
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.itemName.trim() || !formData.category.trim()) {
      setError('Item name and category are required.');
      return;
    }
    if (formData.costPrice < 0 || formData.sellingPrice < 0 || formData.quantity < 0) {
      setError('Prices and quantity cannot be negative.');
      return;
    }
    setIsSaving(true);
    setError('');
    
    try {
      await onSave(formData);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Add New Item</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Item Name *</label>
            <input 
              type="text" 
              placeholder="Enter item name" 
              value={formData.itemName} 
              onChange={(e) => handleInputChange('itemName', e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              <option value="__new__">+ Add New Category</option>
            </select>
            {formData.category === '__new__' && (
              <input 
                type="text" 
                placeholder="Enter new category" 
                onChange={(e) => handleInputChange('category', e.target.value)} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all mt-2" 
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
            <input 
              type="number" 
              min="0"
              placeholder="0" 
              value={formData.quantity} 
              onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Low Stock Threshold</label>
            <input 
              type="number" 
              min="0"
              placeholder="5" 
              value={formData.lowStockThreshold} 
              onChange={(e) => handleInputChange('lowStockThreshold', parseInt(e.target.value) || 0)} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cost Price (₹) *</label>
            <input 
              type="number" 
              min="0"
              step="0.01"
              placeholder="0.00" 
              value={formData.costPrice} 
              onChange={(e) => handleInputChange('costPrice', parseFloat(e.target.value) || 0)} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Selling Price (₹) *</label>
            <input 
              type="number" 
              min="0"
              step="0.01"
              placeholder="0.00" 
              value={formData.sellingPrice} 
              onChange={(e) => handleInputChange('sellingPrice', parseFloat(e.target.value) || 0)} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
            />
          </div>
        </div>

        {/* Profit Margin Display */}
        {formData.costPrice > 0 && formData.sellingPrice > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-700">Profit Margin:</span>
              <span className="text-lg font-bold text-blue-900">
                {(((formData.sellingPrice - formData.costPrice) / formData.costPrice) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-blue-600">Profit per unit:</span>
              <span className="text-sm font-semibold text-blue-800">
                ₹{(formData.sellingPrice - formData.costPrice).toFixed(2)}
              </span>
            </div>
          </div>
        )}
        
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
            <span>{isSaving ? 'Adding...' : 'Add Item'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// =======================================================
//  Edit Item Modal
// =======================================================
interface EditItemModalProps {
  item: InventoryItem;
  onClose: () => void;
  onSave: (itemId: string, updates: any) => Promise<void>;
  categories: string[];
}

const EditItemModal = ({ item, onClose, onSave, categories }: EditItemModalProps) => {
  const [formData, setFormData] = useState({
    itemName: item.itemName,
    category: item.category,
    quantity: item.quantity,
    costPrice: item.costPrice,
    sellingPrice: item.sellingPrice,
    lowStockThreshold: item.lowStockThreshold,
  });
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.itemName.trim() || !formData.category.trim()) {
      setError('Item name and category are required.');
      return;
    }
    if (formData.costPrice < 0 || formData.sellingPrice < 0 || formData.quantity < 0) {
      setError('Prices and quantity cannot be negative.');
      return;
    }
    setIsSaving(true);
    setError('');
    
    try {
      await onSave(item.id, formData);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Edit Item</h2>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Item Name *</label>
            <input 
              type="text" 
              value={formData.itemName} 
              onChange={(e) => handleInputChange('itemName', e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              <option value="__new__">+ Add New Category</option>
            </select>
            {formData.category === '__new__' && (
              <input 
                type="text" 
                placeholder="Enter new category" 
                onChange={(e) => handleInputChange('category', e.target.value)} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all mt-2" 
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
            <input 
              type="number" 
              min="0"
              value={formData.quantity} 
              onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Low Stock Threshold</label>
            <input 
              type="number" 
              min="0"
              value={formData.lowStockThreshold} 
              onChange={(e) => handleInputChange('lowStockThreshold', parseInt(e.target.value) || 0)} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cost Price (₹) *</label>
            <input 
              type="number" 
              min="0"
              step="0.01"
              value={formData.costPrice} 
              onChange={(e) => handleInputChange('costPrice', parseFloat(e.target.value) || 0)} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Selling Price (₹) *</label>
            <input 
              type="number" 
              min="0"
              step="0.01"
              value={formData.sellingPrice} 
              onChange={(e) => handleInputChange('sellingPrice', parseFloat(e.target.value) || 0)} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
            />
          </div>
        </div>

        {/* Profit Margin Display */}
        {formData.costPrice > 0 && formData.sellingPrice > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-700">Profit Margin:</span>
              <span className="text-lg font-bold text-blue-900">
                {(((formData.sellingPrice - formData.costPrice) / formData.costPrice) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-blue-600">Profit per unit:</span>
              <span className="text-sm font-semibold text-blue-800">
                ₹{(formData.sellingPrice - formData.costPrice).toFixed(2)}
              </span>
            </div>
          </div>
        )}
        
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

// =======================================================
//  Delete Confirmation Modal
// =======================================================
interface DeleteConfirmationModalProps {
  item: InventoryItem;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmationModal = ({ item, onClose, onConfirm }: DeleteConfirmationModalProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-red-600">Delete Item</h2>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center space-x-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Box className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div>
              <p className="font-medium text-gray-900">{item.itemName}</p>
              <p className="text-sm text-gray-600">{item.category}</p>
              <p className="text-sm text-red-600">Quantity: {item.quantity} | Value: ₹{(item.quantity * item.costPrice).toLocaleString()}</p>
            </div>
          </div>
          <p className="text-gray-600 mt-4">
            Are you sure you want to delete this item? This action cannot be undone and will permanently remove the item from your inventory.
          </p>
        </div>
        
        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="px-6 py-3 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Delete Item
          </button>
        </div>
      </div>
    </div>
  );
};