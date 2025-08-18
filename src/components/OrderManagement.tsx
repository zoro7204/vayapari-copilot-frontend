import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Search, MessageCircle, Eye, Edit, Trash2, X, ArrowUpDown, Download, TrendingUp, CreditCard, FolderSearch, PieChart, Users, Calendar, ShoppingCart, TrendingDown, ShoppingBag, Package, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { getOrdersData, createNewOrder, deleteOrder, updateOrderStatus, updateOrder } from '../services/api';
import { Order } from '../types';
import Papa from 'papaparse';

const OrderManagement: React.FC<{ setIsModalOpen: (isOpen: boolean) => void }> = ({ setIsModalOpen }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Order; direction: 'ascending' | 'descending' } | null>({ key: 'orderDate', direction: 'descending' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const [showChart, setShowChart] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchAndSetOrders = async () => {
    const liveOrders = await getOrdersData();
    
    const formattedOrders = liveOrders.filter(Boolean).map((order: any) => {
      // Logic to parse "1 x denim jeans" into quantity and name
      const itemString = order.items || '1 x unknown';
      const match = itemString.match(/^(\d+)\s+x\s+(.+)$/);
      let quantity = 1;
      let itemName = itemString;

      if (match) {
        quantity = parseInt(match[1], 10);
        itemName = match[2].trim();
      }

      return {
        id: order.orderId || order.id, // Use our new ORD-001 ID if it exists
        customerName: order.customer.name,      // <-- Corrected
        customerPhone: order.customer.phone,
        rate: order.rate,
        items: [{ name: itemName, quantity: quantity, price: order.amount / quantity }],
        totalAmount: order.amount,
        grossAmount: order.grossAmount,
        discount: order.discount,
        discountString: order.discountString,
        profit: order.profit,
        costPrice: order.costPrice,
        status: (order.status || 'pending').toLowerCase(),
        orderDate: order.date,
      };
    }).sort((a: Order, b: Order) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()); // Sort by date descending
    
    setOrders(formattedOrders);
  };
  useEffect(() => {
    fetchAndSetOrders().finally(() => setIsLoading(false));
  }, []);

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOpenNewOrderModal = () => setIsNewOrderModalOpen(true);
  const handleCloseNewOrderModal = () => setIsNewOrderModalOpen(false);

  const handleSaveOrder = async (orderData: any) => {
    try {
      await createNewOrder(orderData);
      handleCloseNewOrderModal();
      await fetchAndSetOrders();
    } catch (error) {
      console.error("Failed to save and refresh order list:", error);
    }
  };

  const handleViewDetails = (event: React.MouseEvent, order: Order) => {
    event.preventDefault();
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleDeleteOrder = async (orderIdToDelete: string) => {
    if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      try {
        await deleteOrder(orderIdToDelete);
        setOrders(prevOrders => prevOrders.filter(order => order.id !== orderIdToDelete));
      } catch (error) {
        console.error("Failed to delete order:", error);
        alert("Error: Could not delete the order.");
      }
    }
  };

  const handleOpenEditModal = (order: Order) => {
    setSelectedOrder(order);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedOrder(null);
  };

  const handleUpdateOrder = async (orderId: string, updates: Partial<Order>) => {
    try {
      await updateOrder(orderId, updates);
      handleCloseEditModal();
      await fetchAndSetOrders(); // Refresh the list
    } catch (error) {
      console.error("Failed to update and refresh order list:", error);
      // You could show an error message to the user here
    }
  };

  const requestSort = (key: keyof Order) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const processedOrders = useMemo(() => {
    let processedData = [...orders];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (dateFilter === 'today') {
      processedData = processedData.filter(order => new Date(order.orderDate).toDateString() === today.toDateString());
    } else if (dateFilter === 'week') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      processedData = processedData.filter(order => new Date(order.orderDate) >= startOfWeek);
    } else if (dateFilter === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      processedData = processedData.filter(order => new Date(order.orderDate) >= startOfMonth);
    } else if (dateFilter === 'custom' && selectedDate) {
      const selectedDateString = selectedDate.toDateString();
      processedData = processedData.filter(order => new Date(order.orderDate).toDateString() === selectedDateString);
    }

    processedData = processedData.filter(order => {
      const searchLower = searchTerm.toLowerCase();
      // Safely check if properties exist before calling .toLowerCase()
      const matchesSearch = (order.customerName?.toLowerCase().includes(searchLower) ||
                            order.id?.toLowerCase().includes(searchLower));
                            
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
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
  }, [orders, searchTerm, sortConfig, statusFilter, dateFilter, selectedDate]);

  // Chart data preparation
  const chartData = useMemo(() => {
    const now = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      return date;
    }).reverse();

    const salesData = last7Days.map(date => {
      const dayOrders = orders.filter(order => 
        new Date(order.orderDate).toDateString() === date.toDateString()
      );
      const totalSales = dayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: totalSales
      };
    });

    return salesData;
  }, [orders]);

  // Fixed pie chart data - properly group by item name and sum quantities
  const pieChartData = useMemo(() => {
    const itemQuantities = orders.reduce((acc, order) => {
      const itemName = order.items[0]?.name?.toLowerCase() || 'unknown';
      const quantity = order.items[0]?.quantity || 1;
      acc[itemName] = (acc[itemName] || 0) + quantity;
      return acc;
    }, {} as Record<string, number>);

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'];
    
    return Object.entries(itemQuantities)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 7)
      .map(([item, quantity], index) => ({
        name: item.charAt(0).toUpperCase() + item.slice(1),
        value: quantity,
        color: COLORS[index % COLORS.length]
      }));
  }, [orders]);

  const handleDownloadCsv = () => {
    const dataForCsv = processedOrders.map(order => ({
      'Order ID': order.id,
      'Date': new Date(order.orderDate).toLocaleDateString('en-IN'),
      'Customer Name': order.customerName,
      'Phone No': order.customerPhone,
      'Items': order.items[0]?.name || 'N/A',
      'Quantity': order.items[0]?.quantity || 1,
      'Gross Amount': order.grossAmount,
      'Discount': order.discount,
      'Final Amount': order.totalAmount,
      'Cost Price': order.costPrice,
      'Profit': order.profit,
      'Status': order.status,
    }));
    const csv = Papa.unparse(dataForCsv);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    
    let filename = 'orders';
    if (dateFilter === 'custom' && selectedDate) {
      filename = `orders-${selectedDate.toISOString().split('T')[0]}`;
    } else {
      filename = `orders-${dateFilter}-${new Date().toISOString().split('T')[0]}`;
    }
    
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    const originalOrders = orders;
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
    
    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to save status update. The change has been reverted.');
      setOrders(originalOrders);
    }
  };

  const sendWhatsAppBill = (order: Order) => {
    const message = `Hi ${order.customerName}! Your order ${order.id} for ₹${order.totalAmount} is ready. Thank you!`;
    const whatsappUrl = `https://wa.me/${order.customerPhone.replace(/\s+/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setDateFilter('custom');
    setShowDatePicker(false);
  };

  const handleFilterChange = (filter: string) => {
    setDateFilter(filter);
    if (filter !== 'custom') {
      setSelectedDate(null);
    }
  };

  const generateCalendar = () => {
    const now = new Date();
    const year = selectedDate?.getFullYear() || now.getFullYear();
    const month = selectedDate?.getMonth() || now.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    
    const days = [];
    
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return { days, year, month };
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const currentDate = selectedDate || new Date();
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  // Fixed summary statistics - properly handle unique customers
  // Fixed summary statistics - properly handle unique customers
// FINAL, CORRECTED summary statistics calculation
  const todayOrders = orders.filter(order => 
    new Date(order.orderDate).toDateString() === new Date().toDateString()
  );
  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  
  const monthOrders = orders.filter(order => {
    const orderDate = new Date(order.orderDate);
    const today = new Date();
    return orderDate.getMonth() === today.getMonth() && 
           orderDate.getFullYear() === today.getFullYear();
  });

  const customerMap = orders.reduce((acc, order) => {
    if (order.customerName && order.customerPhone) {
      const customerKey = `${order.customerName.toLowerCase().trim()}:${order.customerPhone}`;
      const existing = acc.get(customerKey);
      if (existing) {
        existing.total += order.totalAmount;
      } else {
        acc.set(customerKey, {
          name: order.customerName, // Keep original case for display
          total: order.totalAmount
        });
      }
    }
    return acc;
  }, new Map<string, { name: string; total: number }>());

  const uniqueCustomers = customerMap.size;

  const topCustomerEntry = [...customerMap.values()].reduce((max, current) => 
    (current.total > max.total) ? current : max, { name: 'N/A', total: 0 }
  );

  if (isLoading) return <div className="p-6 text-center">Loading orders...</div>;

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Order Management</h1>
          <p className="text-gray-600">Track and manage all your orders efficiently</p>
        </div>
        <button 
          onClick={handleDownloadCsv} 
          className="bg-gray-200 text-gray-800 px-4 py-3 rounded-lg font-medium hover:bg-gray-300 hover:shadow-md transition-all duration-200 flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Download CSV</span>
        </button>
      </div>
      
      {/* Summary Cards from Version 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue Today</p>
              <p className="text-3xl font-bold text-gray-900">₹{todayRevenue.toLocaleString()}</p>
              <p className="text-sm text-emerald-600 font-medium mt-1">
                <TrendingUp className="h-4 w-4 inline mr-1" />
                {todayOrders.length} orders
              </p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-lg">
              <TrendingUp className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Orders This Month</p>
              <p className="text-3xl font-bold text-gray-900">{monthOrders.length}</p>
              <p className="text-sm text-blue-600 font-medium mt-1">
                <ShoppingBag className="h-4 w-4 inline mr-1" />
                {orders.length} total
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Top Customer</p>
              <p className="text-xl font-bold text-gray-900 truncate">{topCustomerEntry.name}</p>
              <p className="text-sm text-amber-600 font-medium mt-1">
                <Star className="h-4 w-4 inline mr-1" />
                ₹{topCustomerEntry.total.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <Star className="h-8 w-8 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-3xl font-bold text-gray-900">{uniqueCustomers}</p>
              <p className="text-sm text-green-600 font-medium mt-1">
                <Users className="h-4 w-4 inline mr-1" />
                Unique customers
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      {(chartData.length > 0 || pieChartData.length > 0) && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Sales Analytics</h3>
              <p className="text-sm text-gray-600 mt-1">Visual breakdown of your sales and popular items</p>
            </div>
            <button
              onClick={() => setShowChart(!showChart)}
              className="px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
            >
              {showChart ? 'Hide Charts' : 'Show Charts'}
            </button>
          </div>
          
          {showChart && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Sales Bar Chart */}
              <div className="h-80">
                <h4 className="text-md font-medium text-gray-700 mb-4">Sales Over Last 7 Days</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Sales']} />
                    <Bar dataKey="sales" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Item Popularity Pie Chart */}
              <div className="h-80">
                <h4 className="text-md font-medium text-gray-700 mb-4">Top Selling Items (by Quantity)</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({name, percent}) => `${name} ${((percent ?? 0) * 100).toFixed(1)}%`}
                      labelLine={false}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} items`, 'Quantity']} />
                  </RechartsPieChart>
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
              placeholder="Search orders..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          
          {/* Status Filter Pills */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-600">Status:</span>
            {['all', 'pending', 'confirmed', 'processing', 'completed', 'cancelled'].map((status) => (
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

        {/* Date Filter Pills */}
        <div className="flex items-center space-x-2 mt-4">
          <span className="text-sm font-medium text-gray-600">Date:</span>
          <button 
            onClick={() => handleFilterChange('all')} 
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
              dateFilter === 'all' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
            }`}
          >
            All Time
          </button>
          <button 
            onClick={() => handleFilterChange('today')} 
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
              dateFilter === 'today' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
            }`}
          >
            Today
          </button>
          <button 
            onClick={() => handleFilterChange('week')} 
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
              dateFilter === 'week' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
            }`}
          >
            This Week
          </button>
          <button 
            onClick={() => handleFilterChange('month')} 
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
              dateFilter === 'month' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
            }`}
          >
            This Month
          </button>
          
          {/* Custom Date Picker */}
          <div className="relative" ref={datePickerRef}>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105 flex items-center space-x-2 ${
                dateFilter === 'custom'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>
                {selectedDate 
                  ? selectedDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
                  : 'Pick Date'
                }
              </span>
            </button>
            
            {showDatePicker && (
              <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-50 min-w-80">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  >
                    <ArrowUpDown className="h-4 w-4 rotate-90" />
                  </button>
                  <h3 className="font-semibold text-gray-800">
                    {new Date(
                      selectedDate?.getFullYear() || new Date().getFullYear(),
                      selectedDate?.getMonth() || new Date().getMonth()
                    ).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  >
                    <ArrowUpDown className="h-4 w-4 -rotate-90" />
                  </button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {generateCalendar().days.map((date, index) => (
                    <button
                      key={index}
                      onClick={() => date && handleDateSelect(date)}
                      disabled={!date}
                      className={`
                        p-2 text-sm rounded-md transition-all duration-200 hover:scale-105
                        ${!date 
                          ? 'invisible' 
                          : date.toDateString() === selectedDate?.toDateString()
                            ? 'bg-indigo-600 text-white shadow-md'
                            : date.toDateString() === new Date().toDateString()
                              ? 'bg-indigo-100 text-indigo-600 font-medium'
                              : 'hover:bg-gray-100 text-gray-700'
                        }
                      `}
                    >
                      {date?.getDate()}
                    </button>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
                  <button
                    onClick={() => handleDateSelect(new Date())}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-200"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => {
                      setShowDatePicker(false);
                      setDateFilter('all');
                      setSelectedDate(null);
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-800">
                  <button onClick={() => requestSort('id')} className="flex items-center space-x-1 hover:text-indigo-600 transition-colors duration-200">
                    <span>Order ID</span>
                    <ArrowUpDown className={`h-4 w-4 transition-colors duration-200 ${
                      sortConfig?.key === 'id' ? 'text-indigo-600' : 'text-gray-400'
                    }`} />
                  </button>
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-800">
                  <button onClick={() => requestSort('customerName')} className="flex items-center space-x-1 hover:text-indigo-600 transition-colors duration-200">
                    <span>Customer Name</span>
                    <ArrowUpDown className={`h-4 w-4 transition-colors duration-200 ${
                      sortConfig?.key === 'customerName' ? 'text-indigo-600' : 'text-gray-400'
                    }`} />
                  </button>
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-800">Phone No</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-800">Items</th>
                <th className="text-right py-4 px-6 font-semibold text-gray-800">
                  <button onClick={() => requestSort('totalAmount')} className="flex items-center space-x-1 ml-auto hover:text-indigo-600 transition-colors duration-200">
                    <span>Amount</span>
                    <ArrowUpDown className={`h-4 w-4 transition-colors duration-200 ${
                      sortConfig?.key === 'totalAmount' ? 'text-indigo-600' : 'text-gray-400'
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
                <th className="text-left py-4 px-6 font-semibold text-gray-800">
                  <button onClick={() => requestSort('orderDate')} className="flex items-center space-x-1 hover:text-indigo-600 transition-colors duration-200">
                    <span>Date</span>
                    <ArrowUpDown className={`h-4 w-4 transition-colors duration-200 ${
                      sortConfig?.key === 'orderDate' ? 'text-indigo-600' : 'text-gray-400'
                    }`} />
                  </button>
                </th>
                <th className="text-center py-4 px-6 font-semibold text-gray-800">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {processedOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="py-4 px-6">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {order.id}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-medium text-gray-900">{order.customerName}</p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-sm text-gray-500">{order.customerPhone}</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-gray-600">
                      {`${order.items[0]?.quantity || ''} x ${order.items[0]?.name || 'N/A'}`}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="font-semibold text-gray-900">₹{order.totalAmount.toLocaleString()}</span>
                  </td>
                  <td className="py-4 px-6">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                      className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${getStatusColor(order.status)}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {new Date(order.orderDate).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center space-x-2">
                      <button 
                        onClick={() => sendWhatsAppBill(order)} 
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 group" 
                        title="Send WhatsApp Bill"
                      >
                        <MessageCircle className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      </button>
                      <button 
                        onClick={(e) => handleViewDetails(e, order)} 
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group" 
                        title="View Details"
                      >
                        <Eye className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      </button>
                      <button
                      onClick={() => handleOpenEditModal(order)} 
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200 group" 
                        title="Edit Order"
                      >
                        <Edit className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      </button>
                      <button 
                        onClick={() => handleDeleteOrder(order.id)} 
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group" 
                        title="Delete Order"
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

      {/* Enhanced Empty State */}
      {processedOrders.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100 mt-6">
          <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <Package className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
              ? "Try adjusting your search or filter criteria to find what you're looking for."
              : "Get started by creating your first order."
            }
          </p>
            <button 
              onClick={handleOpenNewOrderModal}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors inline-flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Create Your First Order</span>
            </button>
          
        </div>
      )}

      {/* Modals */}
      {isDetailsModalOpen && selectedOrder && (
        <OrderDetailsModal order={selectedOrder} onClose={handleCloseModal} />
      )}
      
      {isNewOrderModalOpen && (
        <NewOrderModal onClose={handleCloseNewOrderModal} onSave={handleSaveOrder} />
      )}

      {isEditModalOpen && selectedOrder && (
        <EditOrderModal 
          order={selectedOrder} 
          onClose={handleCloseEditModal} 
          onSave={handleUpdateOrder} 
        />
      )}

      {/* Enhanced Floating Action Button */}
      <button
        onClick={handleOpenNewOrderModal}
        className="fixed bottom-8 right-8 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all duration-200 hover:scale-110 z-40"
        title="Create New Order"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
};

export default OrderManagement;

// =======================================================
//  Enhanced Order Details Modal
// =======================================================
const OrderDetailsModal = ({ order, onClose }: { order: Order | null, onClose: () => void }) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg transform transition-all duration-300 scale-100 animate-fade-in-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Order Details</h2>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <span className="text-sm text-gray-500">Order ID</span>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {order.id}
            </span>
          </div>
          
          <div className="border-b pb-4">
            <p className="text-sm text-gray-500 mb-1">Customer</p>
            <p className="font-semibold text-gray-900 text-lg">{order.customerName}</p>
            <p className="text-gray-600">{order.customerPhone}</p>
          </div>
          
          <div className="border-b pb-4">
            <p className="text-sm text-gray-500 mb-1">Items</p>
            <p className="font-semibold text-gray-900">{order.items[0]?.name || 'N/A'}</p>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-md">
            <p className="text-gray-600">Gross Amount:</p>
            <p className="font-medium text-gray-900 text-right">₹{order.grossAmount.toLocaleString('en-IN')}</p>
            
            <p className="text-gray-600">Discount:</p>
            <p className="font-medium text-red-600 text-right">
              - ₹{order.discount.toLocaleString('en-IN')}
              {order.discountString && ` (${order.discountString})`}
            </p>

            <p className="text-gray-600 font-bold border-t pt-2 mt-1">Final Amount:</p>
            <p className="font-bold text-gray-900 text-right border-t pt-2 mt-1">₹{order.totalAmount.toLocaleString('en-IN')}</p>
            
            <p className="text-gray-600">Cost Price:</p>
            <p className="font-medium text-gray-900 text-right">₹{order.costPrice.toLocaleString('en-IN')}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-x-4 pt-3 border-t">
            <p className="text-gray-800 font-bold text-lg">Profit:</p>
            <p className="font-bold text-emerald-600 text-lg text-right">₹{order.profit.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// =======================================================
//  Enhanced New Order Modal
// =======================================================
interface NewOrderModalProps {
  onClose: () => void;
  onSave: (orderData: any) => Promise<void>;
}

const NewOrderModal = ({ onClose, onSave }: NewOrderModalProps) => {
  const [item, setItem] = useState('');
  const [qty, setQty] = useState(1);
  const [rate, setRate] = useState('');
  const [discount, setDiscount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!item || !qty || !rate) {
      setError('Item, Quantity, and Rate are required.');
      return;
    }
    setIsSaving(true);
    setError('');
    
    const orderData = {
      item,
      qty: qty,
      rate: parseFloat(rate),
      discount: discount.trim(),
      customerName,
      customerPhone
    };

    try {
      await onSave(orderData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-200 scale-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Create New Order</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
            <input 
              type="text" 
              placeholder="e.g., Denim Jeans" 
              value={item} 
              onChange={(e) => setItem(e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
              <input 
                type="number" 
                placeholder="1" 
                value={qty} 
                onChange={(e) => setQty(parseInt(e.target.value) || 1)} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rate *</label>
              <input 
                type="number" 
                placeholder="0.00" 
                value={rate} 
                onChange={(e) => setRate(e.target.value)} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount</label>
            <input 
              type="text" 
              placeholder="e.g., 100 or 10%" 
              value={discount} 
              onChange={(e) => setDiscount(e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
            <input 
              type="text" 
              placeholder="Customer Name" 
              value={customerName} 
              onChange={(e) => setCustomerName(e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone</label>
            <input 
              type="text" 
              placeholder="+91 98765 43210" 
              value={customerPhone} 
              onChange={(e) => setCustomerPhone(e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
            />
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        
        <div className="flex justify-end gap-3 mt-6">
          <button 
            onClick={onClose} 
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="px-6 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors inline-flex items-center space-x-2"
          >
            {isSaving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            <span>{isSaving ? 'Saving...' : 'Save Order'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// =======================================================
//  Enhanced Edit Order Modal (with Financial Fields)
// =======================================================
interface EditOrderModalProps {
  order: Order;
  onClose: () => void;
  onSave: (orderId: string, updates: any) => Promise<void>;
}

const EditOrderModal = ({ order, onClose, onSave }: EditOrderModalProps) => {
  // State for all editable fields, pre-filled with the order's data
  const [item, setItem] = useState(order.items[0]?.name || '');
  const [qty, setQty] = useState(order.items[0]?.quantity || 1);
  const [rate, setRate] = useState(order.rate || 0);
  const [discount, setDiscount] = useState(order.discountString || '');
  const [customerName, setCustomerName] = useState(order.customerName);
  const [customerPhone, setCustomerPhone] = useState(order.customerPhone);
  const [status, setStatus] = useState(order.status);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!item || !qty || !rate) {
      setError('Item, Quantity, and Rate are required.');
      return;
    }
    setIsSaving(true);
    setError('');
    
    // Consolidate all the updated data into one object
    const updates = {
      item,
      qty,
      rate,
      discount,
      customerName,
      customerPhone,
      status,
    };

    try {
      await onSave(order.id, updates);
      onClose();
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
          <h2 className="text-2xl font-bold text-gray-800">Edit Order</h2>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
            <input 
              type="text" 
              value={item} 
              onChange={(e) => setItem(e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
              <input 
                type="number" 
                value={qty} 
                onChange={(e) => setQty(parseInt(e.target.value) || 1)} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rate *</label>
              <input 
                type="number" 
                value={rate} 
                onChange={(e) => setRate(parseFloat(e.target.value) || 0)} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount</label>
            <input 
              type="text" 
              placeholder="e.g., 100 or 10%" 
              value={discount} 
              onChange={(e) => setDiscount(e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
            />
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
            <input 
              type="text" 
              value={customerName} 
              onChange={(e) => setCustomerName(e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone</label>
            <input 
              type="text"
              value={customerPhone} 
              onChange={(e) => setCustomerPhone(e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select 
              value={status}
              onChange={(e) => setStatus(e.target.value as Order['status'])}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        
        <div className="flex justify-end gap-3 mt-6">
          <button 
            onClick={onClose} 
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="px-6 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors inline-flex items-center space-x-2"
          >
            {isSaving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};