import React, { useState } from 'react';
import { MessageCircle, Bot, Bell, User, Shield, Palette } from 'lucide-react';
import { IntegrationSettings } from '../types';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<IntegrationSettings>({
    whatsapp: {
      enabled: false,
      businessNumber: '',
      apiKey: ''
    },
    telegram: {
      enabled: false,
      botToken: '',
      chatId: ''
    }
  });

  const [activeTab, setActiveTab] = useState('integrations');

  const handleWhatsAppToggle = (enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      whatsapp: { ...prev.whatsapp, enabled }
    }));
  };

  const handleTelegramToggle = (enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      telegram: { ...prev.telegram, enabled }
    }));
  };

  const tabs = [
    { id: 'integrations', label: 'Integrations', icon: MessageCircle },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account and application preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-fit">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              {/* WhatsApp Integration */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <MessageCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">WhatsApp Business</h3>
                      <p className="text-sm text-gray-600">Send bills and notifications directly to customers</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.whatsapp.enabled}
                      onChange={(e) => handleWhatsAppToggle(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {settings.whatsapp.enabled && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Phone Number
                      </label>
                      <input
                        type="text"
                        value={settings.whatsapp.businessNumber}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          whatsapp: { ...prev.whatsapp, businessNumber: e.target.value }
                        }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        WhatsApp Business API Key
                      </label>
                      <input
                        type="password"
                        value={settings.whatsapp.apiKey}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          whatsapp: { ...prev.whatsapp, apiKey: e.target.value }
                        }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Enter your API key"
                      />
                    </div>
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Status:</strong> {settings.whatsapp.enabled ? 'Connected' : 'Disconnected'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Telegram Integration */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Bot className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Telegram Bot</h3>
                      <p className="text-sm text-gray-600">Automate customer support and order updates</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.telegram.enabled}
                      onChange={(e) => handleTelegramToggle(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {settings.telegram.enabled && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bot Token
                      </label>
                      <input
                        type="password"
                        value={settings.telegram.botToken}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          telegram: { ...prev.telegram, botToken: e.target.value }
                        }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Enter your bot token"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chat ID
                      </label>
                      <input
                        type="text"
                        value={settings.telegram.chatId}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          telegram: { ...prev.telegram, chatId: e.target.value }
                        }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Enter chat ID"
                      />
                    </div>
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Bot Commands:</strong> /orders, /customers, /help, /status
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <button className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                Save Integration Settings
              </button>
            </div>
          )}

          {activeTab !== 'integrations' && (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {tabs.find(tab => tab.id === activeTab)?.label} Settings
              </h3>
              <p className="text-gray-600">This section is coming soon. Stay tuned for more features!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;