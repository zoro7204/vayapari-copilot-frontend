import React, { useState, useEffect, useMemo } from 'react';
import { NewOrderPayload } from '../types';
import { createNewOrder, createNewExpense } from '../services/api';
import { NewOrderModal } from './OrderManagement';
import { NewExpenseModal } from './ExpenseManagement';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, 
  Package, AlertTriangle, Star, Eye, MessageCircle, Calendar,
  BarChart3, PieChart as PieChartIcon, Activity, ArrowUp, ArrowDown,X, Plus, CheckCircle  
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, LineChart, Line, ComposedChart, Cell,
  PieChart, Pie
} from 'recharts';

// Types
interface NewExpensePayload {
  item: string;
  category: string;
  amount: number;
}

interface OpportunityOrRisk {
  id: string;
  type: 'opportunity' | 'risk';
  message: string;
}

interface KPI {
  value: number;
  change: number;
}
interface KPIs {
  totalRevenue: KPI;
  netProfit: KPI;
  grossMargin: KPI;
  totalExpenses: KPI;
  totalOrders: KPI;
  averageOrderValue: KPI;
  newCustomers: KPI;
}
interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  status: string;
  orderDate: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  // Add all the missing properties below
  grossAmount: number;
  discount: number;
  discountString: string;
  costPrice: number;
  profit: number;
}
interface CustomerSpotlight {
  name: string;
  spend: number;
}
interface Alert {
  id: string;
  type: 'opportunity' | 'risk';
  message: string;
}
interface DashboardData {
  kpis: KPIs;
  charts: {
    topProducts: TopProduct[];
    financialPerformance?: Array<{
      period: string;
      revenue: number;
      expenses: number;
      netProfit: number;
    }>;
  };
  modules: {
    recentOrders: Order[];
    lowStockItems: string;
    customerSpotlight: CustomerSpotlight;
    alerts: Alert[];
    opportunitiesAndRisks: OpportunityOrRisk[];
  };
}
type TimePeriod = 'today' | 'yesterday' | 'week' | 'month' | 'all';

interface DashboardProps {
  shopName: string;
}

const Dashboard: React.FC<DashboardProps> = ({ shopName }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('today');
  const [topProductsView, setTopProductsView] = useState<'quantity' | 'revenue'>('quantity');
  const [error, setError] = useState<string | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isNewExpenseModalOpen, setIsNewExpenseModalOpen] = useState(false);
  const { chartData, domainMax } = useMemo(() => {
    const products = data?.charts?.topProducts;
    if (!products || products.length === 0) {
      return { chartData: [], domainMax: 10 }; // Default for empty state
    }

    const maxValue = Math.max(...products.map(p => p[topProductsView]));
    // Add 10% padding so the bar doesn't touch the edge and round up
    const newDomainMax = Math.ceil(maxValue * 1.1); 

    return { chartData: products, domainMax: newDomainMax };
  }, [data, topProductsView]);

  // Real API call to the backend
  const fetchDashboardData = async (period: TimePeriod): Promise<DashboardData> => {
    // The API_BASE constant is not defined in this component, so we use the relative path directly.
    const response = await fetch(`/api/dashboard?period=${period}`);
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data from the server.');
    }
    return response.json();
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const dashboardData = await fetchDashboardData(selectedPeriod);
        
        // Add mock alerts if not present in the API response
        if (!dashboardData.modules.alerts) {
          dashboardData.modules.alerts = [
            { id: '1', type: 'opportunity', message: 'Revenue up 15% vs Last Week' },
            { id: '2', type: 'risk', message: 'Low stock: 2 items' },
            { id: '3', type: 'opportunity', message: 'New customer acquisition increased by 20%' },
            { id: '4', type: 'risk', message: 'Customer complaints up 5% this week' },
          ];
        }
        
        setData(dashboardData);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard data fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [selectedPeriod]);

  const periodLabels = {
    today: 'Today',
    yesterday: 'Yesterday',
    week: 'This Week', 
    month: 'This Month',
    all: 'All Time'
  };

  // Generate sparkline data for KPI cards
  const generateSparklineData = (value: number, change: number) => {
    const points = 8;
    const data = [];
    const baseValue = value / (1 + change / 100);
    
    for (let i = 0; i < points; i++) {
      const progress = i / (points - 1);
      const randomVariation = (Math.random() - 0.5) * 0.1;
      const trendValue = baseValue + (baseValue * change / 100 * progress) + (baseValue * randomVariation);
      data.push({ value: Math.max(0, trendValue) });
    }
    
    return data;
  };

  const sendWhatsAppBill = (order: Order) => {
    const message = `Hi ${order.customerName}! Your order ${order.id} for ₹${order.totalAmount} is ready. Thank you!`;
    const whatsappUrl = `https://wa.me/${order.customerPhone.replace(/\s+/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleViewOrderDetails = (order: Order) => {
  setViewingOrder(order);
};

const handleCloseModal = () => {
  setViewingOrder(null);
};

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading your business insights...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <div className="text-center py-16">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Unable to load dashboard</h3>
          <p className="text-gray-600 mb-4">{error || 'Something went wrong while loading your data.'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{shopName} Dashboard</h1>
          <p className="text-gray-600">How is your business doing right now?</p>
        </div>
      {/* Master Time Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-600">Time Period:</span>
          {(Object.keys(periodLabels) as TimePeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                selectedPeriod === period
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md border border-gray-200'
              }`}
            >
              {periodLabels[period]}
            </button>
          ))}
        </div>
      </div>

      {/* --- Full-Width Components --- */}
      <div className="flex flex-col gap-6">
        
        {/* Your "KPI Cards" Grid Goes Here */}
        {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6 mb-8">
        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <DollarSign className="h-8 w-8 text-emerald-600" />
            </div>
            <div className={`flex items-center text-sm font-medium ${
              data.kpis.totalRevenue.change >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {data.kpis.totalRevenue.change >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              <span>{Math.abs(data.kpis.totalRevenue.change).toFixed(1)}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">₹{data.kpis.totalRevenue.value.toLocaleString()}</p>
            <div className="mt-3 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={generateSparklineData(data.kpis.totalRevenue.value, data.kpis.totalRevenue.change)}>
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10B981" 
                    strokeWidth={2} 
                    dot={false}
                    strokeDasharray="none"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Net Profit */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <div className={`flex items-center text-sm font-medium ${
              data.kpis.netProfit.change >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {data.kpis.netProfit.change >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              <span>{Math.abs(data.kpis.netProfit.change).toFixed(1)}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Net Profit</p>
            <p className="text-2xl font-bold text-gray-900">₹{data.kpis.netProfit.value.toLocaleString()}</p>
            <div className="mt-3 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={generateSparklineData(data.kpis.netProfit.value, data.kpis.netProfit.change)}>
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3B82F6" 
                    strokeWidth={2} 
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Gross Margin */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
            <div className={`flex items-center text-sm font-medium ${
              data.kpis.grossMargin.change >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {data.kpis.grossMargin.change >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              <span>{Math.abs(data.kpis.grossMargin.change).toFixed(1)}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Gross Margin</p>
            <p className="text-2xl font-bold text-gray-900">{data.kpis.grossMargin.value.toFixed(1)}%</p>
            <div className="mt-3 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={generateSparklineData(data.kpis.grossMargin.value, data.kpis.grossMargin.change)}>
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8B5CF6" 
                    strokeWidth={2} 
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Total Expenses */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
            <div className={`flex items-center text-sm font-medium ${
              data.kpis.totalExpenses.change >= 0 ? 'text-red-600' : 'text-emerald-600'
            }`}>
              {data.kpis.totalExpenses.change >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              <span>{Math.abs(data.kpis.totalExpenses.change).toFixed(1)}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total Expenses</p>
            <p className="text-2xl font-bold text-gray-900">₹{data.kpis.totalExpenses.value.toLocaleString()}</p>
            <div className="mt-3 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={generateSparklineData(data.kpis.totalExpenses.value, data.kpis.totalExpenses.change)}>
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#EF4444" 
                    strokeWidth={2} 
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Total Orders */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-100 rounded-lg">
              <ShoppingCart className="h-8 w-8 text-amber-600" />
            </div>
            <div className={`flex items-center text-sm font-medium ${
              data.kpis.totalOrders.change >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {data.kpis.totalOrders.change >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              <span>{Math.abs(data.kpis.totalOrders.change).toFixed(1)}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">{data.kpis.totalOrders.value}</p>
            <div className="mt-3 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={generateSparklineData(data.kpis.totalOrders.value, data.kpis.totalOrders.change)}>
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#F59E0B" 
                    strokeWidth={2} 
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Average Order Value */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-cyan-100 rounded-lg">
              <Package className="h-8 w-8 text-cyan-600" />
            </div>
            <div className={`flex items-center text-sm font-medium ${
              data.kpis.averageOrderValue.change >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {data.kpis.averageOrderValue.change >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              <span>{Math.abs(data.kpis.averageOrderValue.change).toFixed(1)}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Avg Order Value</p>
            <p className="text-2xl font-bold text-gray-900">₹{data.kpis.averageOrderValue.value.toLocaleString()}</p>
            <div className="mt-3 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={generateSparklineData(data.kpis.averageOrderValue.value, data.kpis.averageOrderValue.change)}>
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#06B6D4" 
                    strokeWidth={2} 
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* New Customers */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Users className="h-8 w-8 text-indigo-600" />
            </div>
            <div className={`flex items-center text-sm font-medium ${
              data.kpis.newCustomers.change >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {data.kpis.newCustomers.change >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              <span>{Math.abs(data.kpis.newCustomers.change).toFixed(1)}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">New Customers</p>
            <p className="text-2xl font-bold text-gray-900">{data.kpis.newCustomers.value}</p>
            <div className="mt-3 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={generateSparklineData(data.kpis.newCustomers.value, data.kpis.newCustomers.change)}>
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#6366F1" 
                    strokeWidth={2} 
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

        {/* Your "Financial Performance" Chart Goes Here */}
        {/* Financial Performance Chart - Full Width */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Financial Performance</h3>
            <p className="text-sm text-gray-600 mt-1">Revenue vs Expenses with Net Profit trend</p>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.charts.financialPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value, name) => {
                  const formattedValue = typeof value === 'number' ? `₹${value.toLocaleString('en-IN')}` : value;
                  return [formattedValue, name];
                }}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#10B981" name="Revenue" />
              <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
              <Line type="monotone" dataKey="netProfit" stroke="#3B82F6" strokeWidth={3} name="Net Profit" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- Two-Column Layout Starts Below --- */}
      <div className="flex flex-col lg:flex-row gap-6 mt-6">

        {/* --- Left Column --- */}
        <div className="lg:w-7/12 flex flex-col gap-6">
          
          {/* Your "Top Selling Products" Module Goes Here */}
          {/* Top Selling Products (CORRECTED) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Top Selling Products</h3>
                <p className="text-sm text-gray-500 mt-1">Best performing items by {topProductsView}</p>
              </div>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button onClick={() => setTopProductsView('revenue')} className={`px-3 py-1 text-sm rounded-md ${topProductsView === 'revenue' ? 'bg-white shadow' : 'text-gray-600'}`}>By Revenue</button>
                <button onClick={() => setTopProductsView('quantity')} className={`px-3 py-1 text-sm rounded-md ${topProductsView === 'quantity' ? 'bg-white shadow' : 'text-gray-600'}`}>By Quantity</button>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical" // <-- This is the key fix for horizontal bars
                  data={data.charts.topProducts}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, domainMax]} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={80} 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [
                      topProductsView === 'revenue' ? `₹${value.toLocaleString()}` : `${value} units`,
                      topProductsView.charAt(0).toUpperCase() + topProductsView.slice(1)
                    ]}
                  />
                  <Bar dataKey={topProductsView} fill="#4f46e5" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Your "Recent Orders" Module Goes Here */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Recent Orders</h3>
            <span className="text-sm text-gray-500">Last 5 orders</span>
          </div>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          <div className="divide-y divide-gray-200">
            {data.modules.recentOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {order.id}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{order.customerName}</p>
                        <p className="text-sm text-gray-500">{order.customerPhone}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {order.items[0]?.quantity}x {order.items[0]?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-900">₹{order.totalAmount.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.orderDate).toLocaleTimeString('en-IN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button 
                      onClick={() => sendWhatsAppBill(order)} 
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 group" 
                      title="Send WhatsApp Bill"
                    >
                      <MessageCircle className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    </button>
                    <button 
                      onClick={() => handleViewOrderDetails(order)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group" 
                      title="View Details"
                    >
                      <Eye className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {data.modules.recentOrders.length === 0 && (
            <div className="p-12 text-center">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No recent orders</h4>
              <p className="text-gray-500">Orders will appear here as they come in</p>
            </div>
          )}
        </div>
      </div>

        </div>

        {/* --- Right Column --- */}
        <div className="lg:w-5/12 flex flex-col gap-6">

          {/* Your "Customer Spotlight" Module Goes Here */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Customer Spotlight</h3>
            <div className="p-2 bg-amber-100 rounded-lg">
              <Star className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">
                {data.modules.customerSpotlight?.name?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-1">
              {data.modules.customerSpotlight.name.charAt(0).toUpperCase() + 
               data.modules.customerSpotlight.name.slice(1)}
            </h4>
            <p className="text-sm text-gray-600 mb-3">Top Customer for {periodLabels[selectedPeriod]}</p>
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
              <p className="text-2xl font-bold text-amber-700">
                ₹{data.modules.customerSpotlight.spend.toLocaleString()}
              </p>
              <p className="text-sm text-amber-600 font-medium">Total Spent</p>
            </div>
          </div>
        </div>
          

          {/* Opportunities & Risks (Now connected to live data) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Opportunities & Risks</h3>
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Activity className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
          <div className="space-y-4">
            {data.modules.opportunitiesAndRisks.length > 0 ? (
              data.modules.opportunitiesAndRisks.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`flex items-start p-3 rounded-lg ${
                    alert.type === 'opportunity' 
                      ? 'bg-emerald-50 border border-emerald-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    alert.type === 'opportunity' ? 'bg-emerald-100' : 'bg-red-100'
                  }`}>
                    {alert.type === 'opportunity' ? (
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      alert.type === 'opportunity' ? 'text-emerald-800' : 'text-red-800'
                    }`}>
                      {alert.message}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center p-3 rounded-lg bg-gray-50 border border-gray-200">
                <CheckCircle className="h-5 w-5 text-gray-500 mr-3" />
                <p className="text-sm text-gray-600">No immediate alerts. All systems normal.</p>
              </div>
            )}
          </div>
        </div>
          
          {/* Your "Quick Actions" Module Goes Here */}
          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => setIsNewOrderModalOpen(true)}
                className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-3 rounded-lg font-medium transition flex items-center space-x-2">
                <ShoppingCart className="h-4 w-4" />
                <span>Create New Order</span>
              </button>
              
              {/* --- NEW BUTTON ADDED HERE --- */}
              <button 
                onClick={() => setIsNewExpenseModalOpen(true)}
                className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-3 rounded-lg font-medium transition flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>Add New Expense</span>
              </button>
              <button className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-3 rounded-lg font-medium transition flex items-center space-x-2 opacity-50 cursor-not-allowed">
                <Package className="h-4 w-4" />
                <span>Manage Inventory</span>
              </button>
            </div>
          </div>
      </div>
    </div>
  </div>

  {/* Performance Summary Footer */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {selectedPeriod === 'today' ? 'Today\'s' : periodLabels[selectedPeriod]} Performance Summary
          </h3>
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span>Revenue: ₹{data.kpis.totalRevenue.value.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Profit: ₹{data.kpis.netProfit.value.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
              <span>Orders: {data.kpis.totalOrders.value}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span>Margin: {data.kpis.grossMargin.value.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
      {/* Order Details Modal */}
      {viewingOrder && (
        <OrderDetailsModal order={viewingOrder} onClose={handleCloseModal} />
      )}

      {/* Modals for Quick Actions */}
  {isNewOrderModalOpen && (
    <NewOrderModal 
      onClose={() => setIsNewOrderModalOpen(false)} 
      onSave={async (orderData: NewOrderPayload) => {
        await createNewOrder(orderData); // We'll need to import createNewOrder
        setIsNewOrderModalOpen(false);
        // Optionally, refresh the dashboard data
      }} 
    />
  )}
  {isNewExpenseModalOpen && (
    <NewExpenseModal 
      onClose={() => setIsNewExpenseModalOpen(false)} 
      onSave={async (expenseData: NewExpensePayload) => { 
        await createNewExpense(expenseData); // We'll need to import createNewExpense
        setIsNewExpenseModalOpen(false);
        // Optionally, refresh the dashboard data
      }} 
    />
  )}
</div>
  );
};

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

export default Dashboard;