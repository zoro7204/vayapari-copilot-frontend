import React, { useState, useEffect } from 'react';
import { ShoppingBag, Users, DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';
// We are now importing our new API service
import { SummaryData } from '../types';
import { getSummaryData } from '../services/api'; 
// We are NO LONGER importing the mockData

const Dashboard: React.FC = () => {
  // 1. Create a memory slot to hold our live data. It starts as null (empty).
  const [data, setData] = useState<SummaryData | null>(null);

  // 2. This code runs once when the component first loads onto the screen
  useEffect(() => {
    const fetchData = async () => {
      const summaryData = await getSummaryData('today'); // Call our API bridge
      setData(summaryData); // Store the result in our memory slot
    };

    fetchData();
  }, []); // The empty [] means "run only once"

  // 3. While the data is loading from the API, show a loading message
  if (!data) {
    return (
      <div className="p-6 bg-gray-50 min-h-full flex items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-500">Loading Dashboard Data...</h1>
      </div>
    );
  }

  // 4. Once data is loaded, calculate stats from the LIVE data
  const stats = [
    {
      title: 'Total Revenue',
      value: `₹${data.totalSales.toLocaleString('en-IN')}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      change: '+12%'
    },
    {
      title: 'Total Orders',
      value: data.totalOrders.toString(),
      icon: ShoppingBag,
      color: 'bg-blue-500',
      change: '+8%'
    },
    {
      title: 'Customers',
      value: data.customers.toString(),
      icon: Users,
      color: 'bg-purple-500',
      change: '+15%'
    },
    {
      title: 'Growth Rate',
      value: `${data.growthRate}%`,
      icon: TrendingUp,
      color: 'bg-orange-500',
      change: '+3%'
    }
  ];

  // The rest of your beautiful JSX remains the same, but now it uses our live data!
  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your business.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-sm text-emerald-600 mt-1">{stat.change} from last month</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* We will connect the recent orders section next */}
      <div className="text-center text-gray-500 mt-8">
        <p>Recent Orders will be loaded here soon...</p>
      </div>
    </div>
  );
};

export default Dashboard;