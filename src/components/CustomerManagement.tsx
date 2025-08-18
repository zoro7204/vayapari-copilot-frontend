import React, { useState, useEffect } from 'react';
import { Plus, Search, Phone, Mail, MapPin, ShoppingBag, DollarSign } from 'lucide-react';
// We are NO LONGER importing mockData
import { getCustomersData } from '../services/api'; 
import { Customer } from '../types';

const CustomerManagement: React.FC = () => {
  // We start with empty state and a loading flag
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // This runs once when the component loads
  useEffect(() => {
    const fetchCustomers = async () => {
      const liveCustomers = await getCustomersData();
      // The data from our API is already in the correct format
      setCustomers(liveCustomers);
      setIsLoading(false); // Data has loaded
    };
    fetchCustomers();
  }, []);
  
  // Your existing filter logic works perfectly
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const sendWhatsApp = (customer: Customer) => {
    const message = `Hi ${customer.name}! Thank you for being a valued customer. Check out our latest collection!`;
    const whatsappUrl = `https://wa.me/${customer.phone.replace(/\s+/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };
  
  // If the data is still loading, show a loading message
  if (isLoading) {
    return <div className="p-6 text-center">Loading customers...</div>;
  }
  
  // Your entire beautiful JSX works perfectly with the live data
  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Customer Management</h1>
            <p className="text-gray-600 mt-2">Manage your customer database and relationships</p>
          </div>
          <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg"><ShoppingBag className="h-6 w-6 text-blue-600" /></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {(customers.length > 0 ? customers.reduce((sum, c) => sum + c.totalOrders, 0) / customers.length : 0).toFixed(1)}
              </p>
            </div>
            <div className="bg-emerald-100 p-3 rounded-lg"><ShoppingBag className="h-6 w-6 text-emerald-600" /></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Spent</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{(customers.length > 0 ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length : 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg"><DollarSign className="h-6 w-6 text-purple-600" /></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">New This Month</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg"><Plus className="h-6 w-6 text-orange-600" /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-semibold text-lg">{customer.name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{customer.name}</h3>
                  {/* Updated to use 'since' from our API */}
                  <p className="text-sm text-gray-500">Customer since {customer.since}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3 mb-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600"><Phone className="h-4 w-4" /><span>{customer.phone}</span></div>
              {customer.email !== 'N/A' && (
                <div className="flex items-center space-x-2 text-sm text-gray-600"><Mail className="h-4 w-4" /><span>{customer.email}</span></div>
              )}
              {customer.address !== 'N/A' && (
                <div className="flex items-center space-x-2 text-sm text-gray-600"><MapPin className="h-4 w-4" /><span>{customer.address}</span></div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-lg font-semibold text-gray-800">{customer.totalOrders}</p>
                <p className="text-sm text-gray-600">Orders</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-lg font-semibold text-gray-800">₹{customer.totalSpent.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Spent</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => sendWhatsApp(customer)} className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors text-sm">WhatsApp</button>
              <button className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm">View Orders</button>
            </div>
          </div>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No customers found</p>
          <p className="text-gray-400">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;