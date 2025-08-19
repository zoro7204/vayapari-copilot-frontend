import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Eye, Edit, Trash2, X, ArrowUpDown, Download, Upload, Package, AlertTriangle, XCircle, DollarSign, TrendingDown, Filter, ShoppingCart, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
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
  createdAt: string;
}

interface DeadStockItem extends InventoryItem {
  daysSinceLastSold: number;
  deadStockValue: number;
}

// Mock API Service Functions
const API_BASE = '/api';

const fetchInventoryItems = async (): Promise<InventoryItem[]> => {
  // Mock data for demonstration
  return [
    {
      id: '1',
      itemName: 'Cotton T-Shirt',
      category: 'Shirts',
      quantity: 15,
      costPrice: 200,
      sellingPrice: 350,
      lowStockThreshold: 10,
      lastSoldDate: '2024-08-18',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      itemName: 'Denim Jeans',
      category: 'Pants',
      quantity: 0,
      costPrice: 800,
      sellingPrice: 1200,
      lowStockThreshold: 5,
      lastSoldDate: '2024-08-15',
      createdAt: '2024-02-10'
    },
    {
      id: '3',
      itemName: 'Silk Saree',
      category: 'Sarees',
      quantity: 3,
      costPrice: 2500,
      sellingPrice: 4000,
      lowStockThreshold: 5,
      lastSoldDate: '2024-05-10',
      createdAt: '2024-01-20'
    },
    {
      id: '4',
      itemName: 'Formal Shirt',
      category: 'Shirts',
      quantity: 25,
      costPrice: 500,
      sellingPrice: 850,
      lowStockThreshold: 8,
      lastSoldDate: '2024-08-19',
      createdAt: '2024-03-05'
    },
    {
      id: '5',
      itemName: 'Summer Dress',
      category: 'Dresses',
      quantity: 8,
      costPrice: 400,
      sellingPrice: 650,
      lowStockThreshold: 12,
      lastSoldDate: '2024-08-17',
      createdAt: '2024-04-12'
    },
    {
      id: '6',
      itemName: 'Woolen Sweater',
      category: 'Sweaters',
      quantity: 12,
      costPrice: 600,
      sellingPrice: 950,
      lowStockThreshold: 6,
      lastSoldDate: '2024-03-20',
      createdAt: '2024-01-08'
    }
  ];
};

const createInventoryItem = async (itemData: Omit<InventoryItem, 'id' | 'createdAt'>): Promise<void> => {
  // Mock API call
  console.log('Creating item:', itemData);
};

const updateInventoryItem = async (id: string, itemData: Partial<InventoryItem>): Promise<void> => {
  // Mock API call
  console.log('Updating item:', id, itemData);
};

const deleteInventoryItem = async (id: string): Promise<void> => {
  // Mock API call
  console.log('Deleting item:', id);
};

const InventoryManagement: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
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
      .then(data => setItems(data))
      .catch(error => console.error('Failed to fetch inventory items:', error))
      .finally(() => setIsLoading(false));
  }, [refreshTrigger]);

  const handleOpenNewItemModal = () => setIsNewItemModalOpen(true);
  const handleCloseNewItemModal = () => setIsNewItemModalOpen(false);

  const handleSaveItem = async (itemData: Omit<InventoryItem, 'id' | 'createdAt'>) => {
    try {
      await createInventoryItem(itemData);
      handleCloseNewItemModal();
      setRefreshTrigger(t => t + 1);
    } catch (error) {
      console.error("Failed to save item:", error);
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

  const handleUpdateItem = async (itemId: string, updates: Partial<InventoryItem>) => {
    try {
      await updateInventoryItem(itemId, updates);
      handleCloseEditModal();
      setRefreshTrigger(t => t + 1);
    } catch (error) {
      console.error("Failed to update item:", error);
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
    if (!selectedItem) return;
    
    try {
      await deleteInventoryItem(selectedItem.id);
      setItems(prevItems => prevItems.filter(item => item.id !== selectedItem.id));
      handleCloseDeleteModal();
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  const requestSort = (key: keyof InventoryItem) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getItemStatus = (item: InventoryItem) => {
    if (item.quantity === 0) return 'out-of-stock';
    if (item.quantity <= item.lowStockThreshold) return 'low-stock';
    return 'in-stock';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock': return 'bg-emerald-100 text-emerald-800';
      case 'low-stock': return 'bg-amber-100 text-amber-800';
      case 'out-of-stock': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const processedItems = useMemo(() => {
    let processedData = [...items];
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      processedData = processedData.filter(item => 
        item.itemName.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by category
    if (categoryFilter !== 'all') {
      processedData = processedData.filter(item => item.category === categoryFilter);
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      processedData = processedData.filter(item => getItemStatus(item) === statusFilter);
    }
    
    // Sort
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
  }, [items, searchTerm, sortConfig, categoryFilter, statusFilter]);

  // Analytics calculations
  const totalInventoryValue = useMemo(() => 
    items.reduce((total, item) => total + (item.quantity * item.costPrice), 0)
  , [items]);

  const lowStockItems = useMemo(() => 
    items.filter(item => item.quantity > 0 && item.quantity <= item.lowStockThreshold)
  , [items]);

  const outOfStockItems = useMemo(() => 
    items.filter(item => item.quantity === 0)
  , [items]);

  const deadStockItems = useMemo(() => {
    const currentDate = new Date();
    const ninetyDaysAgo = new Date(currentDate.getTime() - (90 * 24 * 60 * 60 * 1000));
    
    return items.filter(item => {
      if (!item.lastSoldDate) return true;
      const lastSoldDate = new Date(item.lastSoldDate);
      return lastSoldDate < ninetyDaysAgo;
    }).map(item => ({
      ...item,
      daysSinceLastSold: item.lastSoldDate ? 
        Math.floor((currentDate.getTime() - new Date(item.lastSoldDate).getTime()) / (1000 * 60 * 60 * 24)) : 
        Math.floor((currentDate.getTime() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
      deadStockValue: item.quantity * item.costPrice
    }));
  }, [items]);

  const deadStockValue = deadStockItems.reduce((total, item) => total + item.deadStockValue, 0);

  const categories = useMemo(() => 
    Array.from(new Set(items.map(item => item.category)))
  , [items]);

  // Chart data
  const categoryValueData = useMemo(() => {
    const categoryValues = items.reduce((acc, item) => {
      const value = item.quantity * item.costPrice;
      acc[item.category] = (acc[item.category] || 0) + value;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryValues).map(([category, value]) => ({
      name: category,
      value: value
    }));
  }, [items]);

  const stockHealthData = useMemo(() => {
    const statusCounts = items.reduce((acc, item) => {
      const status = getItemStatus(item);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'In Stock', count: statusCounts['in-stock'] || 0, color: '#10B981' },
      { name: 'Low Stock', count: statusCounts['low-stock'] || 0, color: '#F59E0B' },
      { name: 'Out of Stock', count: statusCounts['out-of-stock'] || 0, color: '#EF4444' }
    ];
  }, [items]);

  const handleDownloadCsv = () => {
    const dataForCsv = processedItems.map(item => ({
      'Item Name': item.itemName,
      'Category': item.category,
      'Quantity': item.quantity,
      'Cost Price': item.costPrice,
      'Selling Price': item.sellingPrice,
      'Low Stock Threshold': item.lowStockThreshold,
      'Status': getItemStatus(item),
      'Total Value': item.quantity * item.costPrice,
      'Last Sold': item.lastSoldDate || 'Never'
    }));
    
    const csv = Papa.unparse(dataForCsv);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `inventory-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  if (isLoading) return <div className="p-6 text-center">Loading inventory...</div>;

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Inventory Command Center</h1>
          <p className="text-gray-600">Monitor and manage your complete inventory efficiently</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleDownloadCsv} 
            className="bg-gray-200 text-gray-800 px-4 py-3 rounded-lg font-medium hover:bg-gray-300 hover:shadow-md transition-all duration-200 flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Download CSV</span>
          </button>
          <button className="bg-blue-200 text-blue-800 px-4 py-3 rounded-lg font-medium hover:bg-blue-300 hover:shadow-md transition-all duration-200 flex items-center space-x-2">
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
                <DollarSign className="h-4 w-4 inline mr-1" />
                Current stock value
              </p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Package className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer"
             onClick={() => setStatusFilter('low-stock')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="text-3xl font-bold text-gray-900">{lowStockItems.length}</p>
              <p className="text-sm text-amber-600 font-medium mt-1">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                Needs restocking
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer"
             onClick={() => setStatusFilter('out-of-stock')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-3xl font-bold text-gray-900">{outOfStockItems.length}</p>
              <p className="text-sm text-red-600 font-medium mt-1">
                <XCircle className="h-4 w-4 inline mr-1" />
                Urgent action needed
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="h-8 w-8 text-red-600" />
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
                {deadStockItems.length} items (90+ days)
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingDown className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex gap-6">
        {/* Left Side - Table (70%) */}
        <div className="flex-1 min-w-0">
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

              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600">Status:</span>
                {['all', 'in-stock', 'low-stock', 'out-of-stock'].map((status) => (
                  <button 
                    key={status}
                    onClick={() => setStatusFilter(status)} 
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      statusFilter === status 
                        ? 'bg-indigo-600 text-white shadow-lg' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status === 'all' ? 'All' : 
                     status === 'in-stock' ? 'In Stock' :
                     status === 'low-stock' ? 'Low Stock' : 'Out of Stock'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-gray-800">
                      <button onClick={() => requestSort('itemName')} className="flex items-center space-x-1 hover:text-indigo-600 transition-colors duration-200">
                        <span>Item Name</span>
                        <ArrowUpDown className={`h-4 w-4 ${sortConfig?.key === 'itemName' ? 'text-indigo-600' : 'text-gray-400'}`} />
                      </button>
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-800">Category</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-800">
                      <button onClick={() => requestSort('quantity')} className="flex items-center space-x-1 ml-auto hover:text-indigo-600 transition-colors duration-200">
                        <span>Quantity</span>
                        <ArrowUpDown className={`h-4 w-4 ${sortConfig?.key === 'quantity' ? 'text-indigo-600' : 'text-gray-400'}`} />
                      </button>
                    </th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-800">
                      <button onClick={() => requestSort('costPrice')} className="flex items-center space-x-1 ml-auto hover:text-indigo-600 transition-colors duration-200">
                        <span>Cost Price</span>
                        <ArrowUpDown className={`h-4 w-4 ${sortConfig?.key === 'costPrice' ? 'text-indigo-600' : 'text-gray-400'}`} />
                      </button>
                    </th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-800">Selling Price</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-800">Threshold</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-800">Status</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-800">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {processedItems.map((item) => {
                    const status = getItemStatus(item);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                <Package className="h-5 w-5 text-indigo-600" />
                              </div>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{item.itemName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600">{item.category}</td>
                        <td className="py-4 px-6 text-right">
                          <span className="font-semibold text-gray-900">{item.quantity}</span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="font-semibold text-gray-900">₹{item.costPrice.toLocaleString()}</span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="font-semibold text-gray-900">₹{item.sellingPrice.toLocaleString()}</span>
                        </td>
                        <td className="py-4 px-6 text-right text-sm text-gray-600">{item.lowStockThreshold}</td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                            {status === 'in-stock' ? 'In Stock' :
                             status === 'low-stock' ? 'Low Stock' : 'Out of Stock'}
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
                    );
                  })}
                </tbody>
              </table>
            </div>

            {processedItems.length === 0 && (
              <div className="text-center py-16">
                <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <Package className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No items found</h3>
                <p className="text-gray-500 mb-8">
                  {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' 
                    ? "Try adjusting your search or filter criteria."
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
        </div>

        {/* Right Side - Analytics Sidebar (30%) */}
        <div className="w-96 space-y-6">
          {/* Inventory Value by Category - Pie Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Value by Category
            </h3>
            {categoryValueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryValueData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {categoryValueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Value']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No data available</p>
              </div>
            )}
          </div>

          {/* Stock Health - Bar Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Stock Health
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stockHealthData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top 5 Dead Stock Items */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <TrendingDown className="h-5 w-5 mr-2" />
              Top Dead Stock Items
            </h3>
            {deadStockItems.length > 0 ? (
              <div className="space-y-3">
                {deadStockItems
                  .sort((a, b) => b.deadStockValue - a.deadStockValue)
                  .slice(0, 5)
                  .map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{item.itemName}</p>
                        <p className="text-xs text-gray-600">{item.daysSinceLastSold} days ago</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{item.deadStockValue.toLocaleString()}</p>
                        <p className="text-xs text-gray-600">{item.quantity} units</p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TrendingDown className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No dead stock items</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {isNewItemModalOpen && (
        <NewItemModal onClose={handleCloseNewItemModal} onSave={handleSaveItem} />
      )}

      {isEditModalOpen && selectedItem && (
        <EditItemModal 
          item={selectedItem} 
          onClose={handleCloseEditModal} 
          onSave={handleUpdateItem} 
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
  onSave: (itemData: Omit<InventoryItem, 'id' | 'createdAt'>) => Promise<void>;
}

const NewItemModal = ({ onClose, onSave }: NewItemModalProps) => {
  const [formData, setFormData] = useState({
    itemName: '',
    category: '',
    quantity: 0,
    costPrice: 0,
    sellingPrice: 0,
    lowStockThreshold: 0,
    lastSoldDate: ''
  });
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.itemName.trim() || !formData.category.trim()) {
      setError('Item name and category are required.');
      return;
    }
    
    if (formData.costPrice <= 0 || formData.sellingPrice <= 0) {
      setError('Cost price and selling price must be greater than 0.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await onSave({
        itemName: formData.itemName.trim(),
        category: formData.category.trim(),
        quantity: formData.quantity,
        costPrice: formData.costPrice,
        sellingPrice: formData.sellingPrice,
        lowStockThreshold: formData.lowStockThreshold,
        lastSoldDate: formData.lastSoldDate || undefined
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save item.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Item Name *</label>
              <input 
                type="text" 
                placeholder="Enter item name" 
                value={formData.itemName} 
                onChange={(e) => handleInputChange('itemName', e.target.value)} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <input 
                type="text" 
                placeholder="e.g., Shirts, Pants, Sarees" 
                value={formData.category} 
                onChange={(e) => handleInputChange('category', e.target.value)} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
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
                required
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
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Sold Date (Optional)</label>
            <input 
              type="date" 
              value={formData.lastSoldDate} 
              onChange={(e) => handleInputChange('lastSoldDate', e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
            />
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose} 
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSaving} 
              className="px-6 py-3 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors inline-flex items-center space-x-2 font-medium"
            >
              {isSaving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              <span>{isSaving ? 'Adding...' : 'Add Item'}</span>
            </button>
          </div>
        </form>
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
  onSave: (itemId: string, updates: Partial<InventoryItem>) => Promise<void>;
}

const EditItemModal = ({ item, onClose, onSave }: EditItemModalProps) => {
  const [formData, setFormData] = useState({
    itemName: item.itemName,
    category: item.category,
    quantity: item.quantity,
    costPrice: item.costPrice,
    sellingPrice: item.sellingPrice,
    lowStockThreshold: item.lowStockThreshold,
    lastSoldDate: item.lastSoldDate || ''
  });
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.itemName.trim() || !formData.category.trim()) {
      setError('Item name and category are required.');
      return;
    }
    
    if (formData.costPrice <= 0 || formData.sellingPrice <= 0) {
      setError('Cost price and selling price must be greater than 0.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await onSave(item.id, {
        itemName: formData.itemName.trim(),
        category: formData.category.trim(),
        quantity: formData.quantity,
        costPrice: formData.costPrice,
        sellingPrice: formData.sellingPrice,
        lowStockThreshold: formData.lowStockThreshold,
        lastSoldDate: formData.lastSoldDate || undefined
      });
    } catch (err: any) {
      setError(err.message || 'Failed to update item.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Edit Item</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Item Name *</label>
              <input 
                type="text" 
                value={formData.itemName} 
                onChange={(e) => handleInputChange('itemName', e.target.value)} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <input 
                type="text" 
                value={formData.category} 
                onChange={(e) => handleInputChange('category', e.target.value)} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
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
                required
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
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Sold Date (Optional)</label>
            <input 
              type="date" 
              value={formData.lastSoldDate} 
              onChange={(e) => handleInputChange('lastSoldDate', e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
            />
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose} 
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSaving} 
              className="px-6 py-3 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors inline-flex items-center space-x-2 font-medium"
            >
              {isSaving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
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
          <h2 className="text-2xl font-bold text-gray-800">Delete Item</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{item.itemName}</h3>
              <p className="text-sm text-gray-600">{item.category}</p>
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 text-sm">
              <strong>Warning:</strong> This action cannot be undone. The item and all its data will be permanently deleted.
            </p>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Current Quantity:</strong> {item.quantity} units</p>
            <p><strong>Value:</strong> ₹{(item.quantity * item.costPrice).toLocaleString()}</p>
          </div>
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
