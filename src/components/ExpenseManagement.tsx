import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DollarSign, Tag, Calendar, Search, Plus, X, Edit, Trash2, ArrowUpDown, Download, TrendingUp, CreditCard, FolderSearch, PieChart } from 'lucide-react';
import { PieChart as RechartsPieChart,Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { getExpensesData, createNewExpense, deleteExpense, updateExpense } from '../services/api';
import { Expense } from '../types';
import Papa from 'papaparse';

const ExpenseManagement:React.FC<{ setIsModalOpen: (isOpen: boolean) => void }> = ({ setIsModalOpen }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Expense; direction: 'ascending' | 'descending' } | null>({ key: 'date', direction: 'descending' });
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month', 'custom'
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const [showChart, setShowChart] = useState(true);

  const [isNewExpenseModalOpen, setIsNewExpenseModalOpen] = useState(false);
  const [isEditExpenseModalOpen, setIsEditExpenseModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const fetchAndSetExpenses = async () => {
    const liveExpenses = await getExpensesData();
    setExpenses(liveExpenses);
  };

  useEffect(() => {
    fetchAndSetExpenses().finally(() => setIsLoading(false));
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

  const handleOpenNewExpenseModal = () => setIsNewExpenseModalOpen(true);
  const handleCloseNewExpenseModal = () => setIsNewExpenseModalOpen(false);
  const handleSaveExpense = async (expenseData: { item: string; category: string; amount: number; }) => {
    await createNewExpense(expenseData);
    handleCloseNewExpenseModal();
    await fetchAndSetExpenses();
  };

  const handleOpenEditExpenseModal = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsEditExpenseModalOpen(true);
  };
  const handleCloseEditExpenseModal = () => {
    setSelectedExpense(null);
    setIsEditExpenseModalOpen(false);
  };
  const handleUpdateExpense = async (expenseData: { item: string; category: string; amount: number; }) => {
    if (!selectedExpense) return;
    await updateExpense(selectedExpense.id, expenseData);
    handleCloseEditExpenseModal();
    await fetchAndSetExpenses();
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      await deleteExpense(expenseId);
      await fetchAndSetExpenses();
    }
  };
  
  const requestSort = (key: keyof Expense) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const processedExpenses = useMemo(() => {
    let processedData = [...expenses];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (dateFilter === 'today') {
        processedData = processedData.filter(exp => new Date(exp.date).toDateString() === today.toDateString());
    } else if (dateFilter === 'week') {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        processedData = processedData.filter(exp => new Date(exp.date) >= startOfWeek);
    } else if (dateFilter === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        processedData = processedData.filter(exp => new Date(exp.date) >= startOfMonth);
    } else if (dateFilter === 'custom' && selectedDate) {
        const selectedDateString = selectedDate.toDateString();
        processedData = processedData.filter(exp => new Date(exp.date).toDateString() === selectedDateString);
    }

    processedData = processedData.filter(exp =>
      exp.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
  }, [expenses, searchTerm, sortConfig, dateFilter, selectedDate]);

  // Chart data preparation
  const dailyExpenseData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d;
    }).reverse();

    return last7Days.map(date => {
      const dayExpenses = expenses.filter(exp => 
        new Date(exp.date).toDateString() === date.toDateString()
      );
      const total = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), // "Aug 16", "Aug 17"
        expenses: total,
      };
    });
  }, [expenses]);

  const chartData = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyExpenses = expenses.filter(exp => new Date(exp.date) >= startOfMonth);
    
    const categoryTotals = monthlyExpenses.reduce((acc, exp) => {
      const cat = exp.category || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'];
    
    return Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 7) // Top 7 categories
      .map(([category, amount], index) => ({
        name: category,
        value: amount,
        color: COLORS[index % COLORS.length]
      }));
  }, [expenses]);

  const handleDownloadCsv = () => {
    const dataForCsv = processedExpenses.map(exp => ({
      'Expense ID': exp.expenseId || 'N/A',
      'Date': new Date(exp.date).toLocaleDateString('en-IN'),
      'Item/Reason': exp.item,
      'Category': exp.category,
      'Amount': exp.amount,
    }));
    const csv = Papa.unparse(dataForCsv);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    
    // Enhanced filename based on filter type
    let filename = 'expenses';
    if (dateFilter === 'custom' && selectedDate) {
      filename = `expenses-${selectedDate.toISOString().split('T')[0]}`;
    } else {
      filename = `expenses-${dateFilter}-${new Date().toISOString().split('T')[0]}`;
    }
    
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalMonth = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalToday = expenses
    .filter(exp => new Date(exp.date).toDateString() === new Date().toDateString())
    .reduce((sum, exp) => sum + exp.amount, 0);
  const categoryTotals = expenses.reduce((acc, exp) => {
    const cat = exp.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);
  const topCategoryName = Object.keys(categoryTotals).reduce((a, b) => (categoryTotals[a] > categoryTotals[b] ? a : b), 'None');

  if (isLoading) return <div className="p-6 text-center">Loading expenses...</div>;
  
  const getCategoryColor = (category: string) => {
    const lowerCategory = category.toLowerCase();
    switch (lowerCategory) {
      case 'food': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'utilities': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'rent': return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case 'transport': return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'supplies': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'maintenance': return 'bg-red-100 text-red-800 hover:bg-red-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
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
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
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

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Expense Management</h1>
          <p className="text-gray-600 mt-2">Track and analyze your business spending</p>
        </div>
        <button 
          onClick={handleDownloadCsv} 
          className="bg-gray-200 text-gray-800 px-4 py-3 rounded-lg font-medium hover:bg-gray-300 hover:shadow-md transition-all duration-200 flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Download CSV</span>
        </button>
      </div>
      
      {/* Stats Cards with Animation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-blue-500 border-t border-r border-b border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses (Today)</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">₹{totalToday.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-emerald-500 border-t border-r border-b border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses (Month)</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">₹{totalMonth.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-emerald-100 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-purple-500 border-t border-r border-b border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Top Category (Month)</p>
              <p className="text-2xl font-bold text-gray-900 mt-1 capitalize">{topCategoryName}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-indigo-500 border-t border-r border-b border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expense Categories</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{Object.keys(categoryTotals).length}</p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-lg">
              <PieChart className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      {processedExpenses.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">This Month's Expense Breakdown</h3>
              <p className="text-sm text-gray-600 mt-1">Visual breakdown of your spending</p>
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
              {/* Pie Chart - Breakdown by Category */}
              <div className="h-80">
                <h4 className="text-md font-medium text-gray-700 mb-4 text-center">Breakdown by Category</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({name, percent}) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>

              {/* Bar Chart - Expense Trend by Day */}
              <div className="h-80">
                <h4 className="text-md font-medium text-gray-700 mb-4 text-center">Expense Trend (Last 7 Days)</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyExpenseData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Expenses']} />
                    <Bar dataKey="expenses" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Search and Filter Bar */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 flex justify-between items-center">
        <div className="flex-1 relative max-w-xs">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
          />
        </div>
        <div className="flex items-center space-x-2">
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
                {/* Calendar Header */}
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
                
                {/* Calendar Grid */}
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
                
                {/* Quick Actions */}
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

      {/* Expenses Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-800">
                  <button onClick={() => requestSort('expenseId')} className="flex items-center space-x-1 hover:text-indigo-600 transition-colors duration-200">
                    <span>Expense ID</span>
                    <ArrowUpDown className={`h-4 w-4 transition-colors duration-200 ${
                      sortConfig?.key === 'expenseId' ? 'text-indigo-600' : 'text-gray-400'
                    }`} />
                  </button>
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-800">
                  <button onClick={() => requestSort('item')} className="flex items-center space-x-1 hover:text-indigo-600 transition-colors duration-200">
                    <span>Item/Reason</span>
                    <ArrowUpDown className={`h-4 w-4 transition-colors duration-200 ${
                      sortConfig?.key === 'item' ? 'text-indigo-600' : 'text-gray-400'
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
                <th className="text-left py-4 px-6 font-semibold text-gray-800">
                  <button onClick={() => requestSort('date')} className="flex items-center space-x-1 hover:text-indigo-600 transition-colors duration-200">
                    <span>Date</span>
                    <ArrowUpDown className={`h-4 w-4 transition-colors duration-200 ${
                      sortConfig?.key === 'date' ? 'text-indigo-600' : 'text-gray-400'
                    }`} />
                  </button>
                </th>
                <th className="text-right py-4 px-6 font-semibold text-gray-800">
                  <button onClick={() => requestSort('amount')} className="flex items-center space-x-1 ml-auto hover:text-indigo-600 transition-colors duration-200">
                    <span>Amount</span>
                    <ArrowUpDown className={`h-4 w-4 transition-colors duration-200 ${
                      sortConfig?.key === 'amount' ? 'text-indigo-600' : 'text-gray-400'
                    }`} />
                  </button>
                </th>
                <th className="text-center py-4 px-6 font-semibold text-gray-800">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {processedExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="py-4 px-6">
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors duration-200">
                      {expense.expenseId || 'N/A'}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-semibold text-gray-900">{expense.item}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full transition-colors duration-200 ${getCategoryColor(expense.category)}`}>
                      {expense.category}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500">{new Date(expense.date).toLocaleDateString()}</td>
                  <td className="py-4 px-6 text-right font-semibold text-gray-900">₹{expense.amount.toLocaleString('en-IN')}</td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button 
                        onClick={() => handleOpenEditExpenseModal(expense)} 
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteExpense(expense.id)} 
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
                      >
                        <Trash2 className="h-4 w-4" />
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
      {processedExpenses.length === 0 && (
        <div className="text-center py-16">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-indigo-100 to-purple-100 p-8 rounded-full animate-pulse">
              <FolderSearch className="h-16 w-16 text-indigo-400" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No expenses yet</h3>
          <p className="text-gray-500 mb-6">Start tracking your business expenses to get insights into your spending patterns.</p>
          <button
            onClick={handleOpenNewExpenseModal}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center space-x-2 mx-auto"
          >
            <Plus className="h-5 w-5" />
            <span>Add your first expense</span>
          </button>
        </div>
      )}

      {/* Modals */}
      {isNewExpenseModalOpen && (
        <NewExpenseModal onClose={handleCloseNewExpenseModal} onSave={handleSaveExpense} />
      )}
      {isEditExpenseModalOpen && selectedExpense && (
        <EditExpenseModal expense={selectedExpense} onClose={handleCloseEditExpenseModal} onSave={handleUpdateExpense} />
      )}
       
      {/* Enhanced Floating Action Button */}
      <button
        onClick={handleOpenNewExpenseModal}
        className="fixed bottom-6 right-6 bg-indigo-600 text-white w-16 h-16 rounded-full shadow-2xl hover:bg-indigo-700 hover:shadow-3xl transition-all duration-300 flex items-center justify-center z-50 transform hover:scale-110 hover:-translate-y-1 group"
        title="Add New Expense"
      >
        <Plus className="h-7 w-7 group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </div>
  );
};

export default ExpenseManagement;

// Modal Components with Enhanced Styling
interface NewExpenseModalProps {
  onClose: () => void;
  onSave: (expenseData: { item: string; category: string; amount: number; }) => Promise<void>;
}

const NewExpenseModal = ({ onClose, onSave }: NewExpenseModalProps) => {
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!item || !amount) {
      setError('Item/Reason and Amount are required.');
      return;
    }
    setIsSaving(true);
    setError('');
    const expenseData = { item, amount: parseFloat(amount), category };
    try {
      await onSave(expenseData);
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
          <h2 className="text-2xl font-bold text-gray-800">Log New Expense</h2>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="space-y-4">
          <input 
            type="text" 
            placeholder="Item or Reason (e.g., Shop Rent)" 
            value={item} 
            onChange={(e) => setItem(e.target.value)} 
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200" 
          />
          <input 
            type="number" 
            placeholder="Amount (e.g., 500)" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200" 
          />
          <input 
            type="text" 
            placeholder="Category (e.g., food, utilities)" 
            value={category} 
            onChange={(e) => setCategory(e.target.value)} 
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200" 
          />
        </div>
        {error && <p className="text-red-500 text-sm mt-4 p-3 bg-red-50 rounded-lg">{error}</p>}
        <div className="flex justify-end gap-4 mt-8">
          <button 
            onClick={onClose} 
            className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="px-6 py-3 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition-all duration-200 font-medium transform hover:scale-105"
          >
            {isSaving ? 'Saving...' : 'Save Expense'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface EditExpenseModalProps {
  expense: Expense;
  onClose: () => void;
  onSave: (expenseData: { item: string; category: string; amount: number; }) => Promise<void>;
}

const EditExpenseModal = ({ expense, onClose, onSave }: EditExpenseModalProps) => {
  const [item, setItem] = useState(expense.item);
  const [amount, setAmount] = useState(String(expense.amount));
  const [category, setCategory] = useState(expense.category);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!item || !amount) {
      setError('Item/Reason and Amount are required.');
      return;
    }
    setIsSaving(true);
    setError('');
    const expenseData = { item, amount: parseFloat(amount), category };
    try {
      await onSave(expenseData);
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
          <h2 className="text-2xl font-bold text-gray-800">Edit Expense</h2>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="space-y-4">
          <input 
            type="text" 
            placeholder="Item or Reason" 
            value={item} 
            onChange={(e) => setItem(e.target.value)} 
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200" 
          />
          <input 
            type="number" 
            placeholder="Amount" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200" 
          />
          <input 
            type="text" 
            placeholder="Category" 
            value={category} 
            onChange={(e) => setCategory(e.target.value)} 
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200" 
          />
        </div>
        {error && <p className="text-red-500 text-sm mt-4 p-3 bg-red-50 rounded-lg">{error}</p>}
        <div className="flex justify-end gap-4 mt-8">
          <button 
            onClick={onClose} 
            className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="px-6 py-3 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition-all duration-200 font-medium transform hover:scale-105"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};