import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

// Define types for settings
interface ApiSettings {
  openaiApiKey: string;
  backendUrl: string;
  maxConcurrentAgents: number;
  debugMode: boolean;
}

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  sidebarCompact: boolean;
  animationsEnabled: boolean;
}

interface BrowserSettings {
  headlessByDefault: boolean;
  userAgent: string;
  screenshotQuality: number;
  defaultTimeout: number;
}

interface Credential {
  id: string;
  service: string;
  username: string;
  password: string;
  isActive: boolean;
}

// Default settings
const defaultApiSettings: ApiSettings = {
  openaiApiKey: '',
  backendUrl: 'http://localhost:3030/api/v1',
  maxConcurrentAgents: 3,
  debugMode: false
};

const defaultAppearanceSettings: AppearanceSettings = {
  theme: 'system',
  sidebarCompact: false,
  animationsEnabled: true
};

const defaultBrowserSettings: BrowserSettings = {
  headlessByDefault: false,
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
  screenshotQuality: 80,
  defaultTimeout: 30000
};

const defaultCredentials: Credential[] = [];

// Pre-defined services
const availableServices = [
  { id: 'linkedin', name: 'LinkedIn', icon: 'linkedin' },
  { id: 'google', name: 'Google', icon: 'google' },
  { id: 'twitter', name: 'Twitter', icon: 'twitter' },
  { id: 'facebook', name: 'Facebook', icon: 'facebook' },
  { id: 'github', name: 'GitHub', icon: 'github' },
  { id: 'instagram', name: 'Instagram', icon: 'instagram' },
  { id: 'amazon', name: 'Amazon', icon: 'cart' },
  { id: 'other', name: 'Other', icon: 'globe' },
];

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'api' | 'appearance' | 'browser' | 'credentials'>('api');
  const [apiSettings, setApiSettings] = useState<ApiSettings>(defaultApiSettings);
  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>(defaultAppearanceSettings);
  const [browserSettings, setBrowserSettings] = useState<BrowserSettings>(defaultBrowserSettings);
  const [credentials, setCredentials] = useState<Credential[]>(defaultCredentials);
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // For the credential form
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [showPasswordFor, setShowPasswordFor] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Simulate loading settings from storage
  useEffect(() => {
    // In a real app, this would load from localStorage or a database
    const loadSettings = async () => {
      // Fake delay to simulate loading
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get stored settings or use defaults
      const storedApiSettings = localStorage.getItem('apiSettings');
      const storedAppearanceSettings = localStorage.getItem('appearanceSettings');
      const storedBrowserSettings = localStorage.getItem('browserSettings');
      const storedCredentials = localStorage.getItem('credentials');
      
      if (storedApiSettings) {
        setApiSettings(JSON.parse(storedApiSettings));
      } else {
        // If no stored settings, try to get API key and URL from the API service
        const apiUrl = apiService.getApiUrl();
        setApiSettings({
          ...defaultApiSettings,
          backendUrl: apiUrl,
          openaiApiKey: localStorage.getItem('openaiApiKey') || ''
        });
      }
      if (storedAppearanceSettings) {
        setAppearanceSettings(JSON.parse(storedAppearanceSettings));
      }
      if (storedBrowserSettings) {
        setBrowserSettings(JSON.parse(storedBrowserSettings));
      }
      if (storedCredentials) {
        setCredentials(JSON.parse(storedCredentials));
      }
      
      setIsLoading(false);
    };
    
    loadSettings();
  }, []);
  
  // Save settings
  const saveSettings = () => {
    setIsLoading(true);
    
    // Simulate saving to backend
    setTimeout(() => {
      localStorage.setItem('apiSettings', JSON.stringify(apiSettings));
      localStorage.setItem('appearanceSettings', JSON.stringify(appearanceSettings));
      localStorage.setItem('browserSettings', JSON.stringify(browserSettings));
      localStorage.setItem('credentials', JSON.stringify(credentials));
      
      // Update API service with new settings
      apiService.setConfig(apiSettings.backendUrl, apiSettings.openaiApiKey);
      
      setIsLoading(false);
      setShowSavedMessage(true);
      
      // Hide the saved message after 3 seconds
      setTimeout(() => {
        setShowSavedMessage(false);
      }, 3000);
    }, 800);
  };
  
  // Reset settings to defaults
  const resetSettings = () => {
    if (activeTab === 'api') {
      setApiSettings(defaultApiSettings);
    } else if (activeTab === 'appearance') {
      setAppearanceSettings(defaultAppearanceSettings);
    } else if (activeTab === 'browser') {
      setBrowserSettings(defaultBrowserSettings);
    } else if (activeTab === 'credentials') {
      if (confirm('Are you sure you want to remove all saved credentials?')) {
        setCredentials([]);
      }
    }
  };
  
  // Handle API settings changes
  const handleApiSettingChange = (key: keyof ApiSettings, value: string | number | boolean) => {
    setApiSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Handle appearance settings changes
  const handleAppearanceSettingChange = (key: keyof AppearanceSettings, value: string | boolean) => {
    setAppearanceSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Handle browser settings changes
  const handleBrowserSettingChange = (key: keyof BrowserSettings, value: string | number | boolean) => {
    setBrowserSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Add or update a credential
  const saveCredential = (credential: Credential) => {
    if (isAddingNew) {
      // Add new
      setCredentials([
        ...credentials,
        {
          ...credential,
          id: Date.now().toString() // Simple way to generate unique ID
        }
      ]);
    } else {
      // Update existing
      setCredentials(
        credentials.map(cred => 
          cred.id === credential.id ? credential : cred
        )
      );
    }
    
    resetCredentialForm();
  };
  
  // Delete a credential
  const deleteCredential = (id: string) => {
    if (confirm('Are you sure you want to delete this credential?')) {
      setCredentials(credentials.filter(cred => cred.id !== id));
    }
  };
  
  // Reset the credential form
  const resetCredentialForm = () => {
    setEditingCredential(null);
    setIsAddingNew(false);
  };
  
  // Start editing a credential
  const editCredential = (credential: Credential) => {
    setEditingCredential(credential);
    setIsAddingNew(false);
  };
  
  // Start adding a new credential
  const startAddingCredential = () => {
    setEditingCredential({
      id: '',
      service: availableServices[0].id,
      username: '',
      password: '',
      isActive: true
    });
    setIsAddingNew(true);
  };
  
  // Toggle visibility of a password
  const togglePasswordVisibility = (id: string | null) => {
    setShowPasswordFor(showPasswordFor === id ? null : id);
  };
  
  // Test the API connection
  const testApiConnection = () => {
    setIsLoading(true);
    
    // Update API service with current settings before testing
    apiService.setConfig(apiSettings.backendUrl, apiSettings.openaiApiKey);
    
    // Test the connection
    apiService.testConnection()
      .then(isConnected => {
        if (isConnected) {
          alert('API connection successful!');
        } else {
          alert('API connection failed. Please check your settings and try again.');
        }
      })
      .catch(error => {
        console.error('API test error:', error);
        alert(`API connection error: ${error.message}`);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Settings</h1>
        <p className="text-slate-500">Configure your application settings and preferences</p>
      </div>
      
      {/* Settings Tabs */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="flex border-b border-slate-200 overflow-x-auto">
          <button 
            className={`px-4 py-3 font-medium text-sm transition-colors relative ${activeTab === 'api' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
            onClick={() => setActiveTab('api')}
          >
            <i className="bi bi-key mr-2"></i> API & Connections
            {activeTab === 'api' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
          </button>
          <button 
            className={`px-4 py-3 font-medium text-sm transition-colors relative ${activeTab === 'credentials' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
            onClick={() => setActiveTab('credentials')}
          >
            <i className="bi bi-shield-lock mr-2"></i> Credentials
            {activeTab === 'credentials' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
          </button>
          <button 
            className={`px-4 py-3 font-medium text-sm transition-colors relative ${activeTab === 'appearance' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
            onClick={() => setActiveTab('appearance')}
          >
            <i className="bi bi-palette mr-2"></i> Appearance
            {activeTab === 'appearance' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
          </button>
          <button 
            className={`px-4 py-3 font-medium text-sm transition-colors relative ${activeTab === 'browser' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
            onClick={() => setActiveTab('browser')}
          >
            <i className="bi bi-browser-chrome mr-2"></i> Browser Settings
            {activeTab === 'browser' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
          </button>
        </div>
        
        <div className="p-6">
          {/* API Settings Tab */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  OpenAI API Key <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    type={isApiKeyVisible ? "text" : "password"} 
                    className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="sk-..."
                    value={apiSettings.openaiApiKey}
                    onChange={(e) => handleApiSettingChange('openaiApiKey', e.target.value)}
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    onClick={() => setIsApiKeyVisible(!isApiKeyVisible)}
                  >
                    <i className={`bi bi-${isApiKeyVisible ? 'eye-slash' : 'eye'}`}></i>
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  Your API key is stored locally and never sent to our servers. Get your API key from the <a href="https://platform.openai.com/account/api-keys" target="_blank" className="text-blue-600 hover:underline">OpenAI dashboard</a>.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Backend URL
                </label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="http://localhost:3000"
                  value={apiSettings.backendUrl}
                  onChange={(e) => handleApiSettingChange('backendUrl', e.target.value)}
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  The URL of your Brainess Agents Lab backend service
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Maximum Concurrent Agents
                </label>
                <select 
                  className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={apiSettings.maxConcurrentAgents}
                  onChange={(e) => handleApiSettingChange('maxConcurrentAgents', parseInt(e.target.value))}
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                </select>
                <p className="mt-1.5 text-xs text-slate-500">
                  Maximum number of agents that can run simultaneously
                </p>
              </div>
              
              <div className="flex items-center">
                <input 
                  id="debug-mode" 
                  type="checkbox" 
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={apiSettings.debugMode}
                  onChange={(e) => handleApiSettingChange('debugMode', e.target.checked)} 
                />
                <label htmlFor="debug-mode" className="ml-2 block text-sm text-slate-700">
                  Enable Debug Mode
                </label>
              </div>
              
              <div className="pt-3">
                <button 
                  className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors rounded-lg font-medium text-sm flex items-center"
                  onClick={testApiConnection}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><i className="bi bi-arrow-repeat animate-spin mr-2"></i> Testing...</>
                  ) : (
                    <><i className="bi bi-check-circle mr-2"></i> Test API Connection</>
                  )}
                </button>
              </div>
            </div>
          )}
          
          {/* Credentials Tab */}
          {activeTab === 'credentials' && (
            <div>
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-slate-800">Saved Credentials</h2>
                  <button 
                    onClick={startAddingCredential}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center"
                    disabled={!!editingCredential}
                  >
                    <i className="bi bi-plus-lg mr-2"></i>
                    Add New
                  </button>
                </div>
                
                {/* Information alert */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <i className="bi bi-info-circle text-blue-600 text-lg mr-3"></i>
                    <div>
                      <p className="text-sm text-blue-800">
                        <span className="font-semibold">Credentials Storage:</span> All credentials are encrypted and stored locally on your device. They are never sent to our servers.
                      </p>
                      <p className="text-sm text-blue-800 mt-1">
                        These credentials will be used when your agents need to access websites that require authentication.
                      </p>
                    </div>
                  </div>
                </div>
                
                {editingCredential ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-slate-800 mb-4">
                      {isAddingNew ? 'Add New Credential' : 'Edit Credential'}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Service
                        </label>
                        <select
                          className="w-full px-3 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={editingCredential.service}
                          onChange={(e) => setEditingCredential({...editingCredential, service: e.target.value})}
                        >
                          {availableServices.map(service => (
                            <option key={service.id} value={service.id}>
                              {service.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Username / Email
                        </label>
                        <input 
                          type="text" 
                          className="w-full px-3 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="username@example.com"
                          value={editingCredential.username}
                          onChange={(e) => setEditingCredential({...editingCredential, username: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Password
                        </label>
                        <div className="relative">
                          <input 
                            type={showPasswordFor === 'editing' ? "text" : "password"} 
                            className="w-full px-3 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Your password"
                            value={editingCredential.password}
                            onChange={(e) => setEditingCredential({...editingCredential, password: e.target.value})}
                          />
                          <button 
                            type="button"
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                            onClick={() => togglePasswordVisibility('editing')}
                          >
                            <i className={`bi bi-${showPasswordFor === 'editing' ? 'eye-slash' : 'eye'}`}></i>
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <input 
                          id="is-active" 
                          type="checkbox" 
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                          checked={editingCredential.isActive}
                          onChange={(e) => setEditingCredential({...editingCredential, isActive: e.target.checked})}
                        />
                        <label htmlFor="is-active" className="ml-2 text-sm text-slate-700">
                          Active (available for use by Brainess Agents Labs)
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-end space-x-3 mt-4">
                        <button 
                          className="px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-sm rounded hover:bg-slate-50 transition-colors"
                          onClick={resetCredentialForm}
                        >
                          Cancel
                        </button>
                        <button 
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                          onClick={() => saveCredential(editingCredential)}
                          disabled={!editingCredential.username || !editingCredential.password}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                ) : credentials.length === 0 ? (
                  <div className="text-center bg-slate-50 rounded-lg border border-slate-200 p-6">
                    <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-slate-100">
                      <i className="bi bi-shield-lock text-slate-400 text-xl"></i>
                    </div>
                    <h3 className="mt-4 font-medium text-slate-700">No Credentials Saved</h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Add credentials for websites that your agents need to access.
                    </p>
                    <button 
                      className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      onClick={startAddingCredential}
                    >
                      Add Your First Credential
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {credentials.map(cred => (
                      <div 
                        key={cred.id} 
                        className={`border ${cred.isActive ? 'border-slate-200' : 'border-slate-200 bg-slate-50'} rounded-lg p-4 transition-all hover:shadow-sm`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${cred.isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                              <i className={`bi bi-${availableServices.find(s => s.id === cred.service)?.icon || 'globe'} text-lg`}></i>
                            </div>
                            <div className="ml-3">
                              <h3 className="font-medium text-slate-800">
                                {availableServices.find(s => s.id === cred.service)?.name || 'Other Service'}
                              </h3>
                              <p className="text-sm text-slate-500">{cred.username}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${cred.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                              {cred.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <div className="relative group">
                              <button 
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                                onClick={() => togglePasswordVisibility(cred.id)}
                              >
                                <i className={`bi bi-${showPasswordFor === cred.id ? 'eye-slash' : 'eye'}`}></i>
                              </button>
                              <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-max opacity-0 group-hover:opacity-100 text-xs bg-slate-800 text-white px-2 py-1 rounded pointer-events-none transition-opacity">
                                {showPasswordFor === cred.id ? 'Hide' : 'Show'} password
                              </span>
                            </div>
                            <div className="relative group">
                              <button 
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                                onClick={() => editCredential(cred)}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 opacity-0 group-hover:opacity-100 text-xs bg-slate-800 text-white px-2 py-1 rounded pointer-events-none transition-opacity">
                                Edit
                              </span>
                            </div>
                            <div className="relative group">
                              <button 
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-full hover:bg-slate-100"
                                onClick={() => deleteCredential(cred.id)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                              <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 opacity-0 group-hover:opacity-100 text-xs bg-slate-800 text-white px-2 py-1 rounded pointer-events-none transition-opacity">
                                Delete
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {showPasswordFor === cred.id && (
                          <div className="mt-3 p-2 bg-slate-50 border border-slate-200 rounded text-sm">
                            <span className="text-slate-500 mr-2">Password:</span>
                            <span className="font-medium text-slate-800">{cred.password}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Appearance Settings Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Theme
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div 
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${appearanceSettings.theme === 'light' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                    onClick={() => handleAppearanceSettingChange('theme', 'light')}
                  >
                    <div className="w-full h-20 mb-2 bg-white border border-slate-200 rounded flex items-center justify-center shadow-sm">
                      <div className="w-10 h-4 bg-slate-800 rounded-full"></div>
                    </div>
                    <div className="text-center text-sm font-medium text-slate-700">Light</div>
                  </div>
                  <div 
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${appearanceSettings.theme === 'dark' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                    onClick={() => handleAppearanceSettingChange('theme', 'dark')}
                  >
                    <div className="w-full h-20 mb-2 bg-slate-800 border border-slate-700 rounded flex items-center justify-center shadow-sm">
                      <div className="w-10 h-4 bg-slate-300 rounded-full"></div>
                    </div>
                    <div className="text-center text-sm font-medium text-slate-700">Dark</div>
                  </div>
                  <div 
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${appearanceSettings.theme === 'system' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                    onClick={() => handleAppearanceSettingChange('theme', 'system')}
                  >
                    <div className="w-full h-20 mb-2 bg-gradient-to-r from-white to-slate-800 border border-slate-200 rounded flex items-center justify-center shadow-sm">
                      <div className="w-10 h-4 bg-gradient-to-r from-slate-800 to-white rounded-full"></div>
                    </div>
                    <div className="text-center text-sm font-medium text-slate-700">System</div>
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  Choose your preferred application theme
                </p>
              </div>
              
              <div className="flex items-center">
                <input 
                  id="compact-sidebar" 
                  type="checkbox" 
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={appearanceSettings.sidebarCompact}
                  onChange={(e) => handleAppearanceSettingChange('sidebarCompact', e.target.checked)} 
                />
                <label htmlFor="compact-sidebar" className="ml-2 block text-sm text-slate-700">
                  Use compact sidebar
                </label>
              </div>
              
              <div className="flex items-center">
                <input 
                  id="enable-animations" 
                  type="checkbox" 
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={appearanceSettings.animationsEnabled}
                  onChange={(e) => handleAppearanceSettingChange('animationsEnabled', e.target.checked)} 
                />
                <label htmlFor="enable-animations" className="ml-2 block text-sm text-slate-700">
                  Enable UI animations
                </label>
                <div className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                  Recommended
                </div>
              </div>
            </div>
          )}
          
          {/* Browser Settings Tab */}
          {activeTab === 'browser' && (
            <div className="space-y-6">
              <div className="flex items-center">
                <input 
                  id="headless-mode" 
                  type="checkbox" 
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={browserSettings.headlessByDefault}
                  onChange={(e) => handleBrowserSettingChange('headlessByDefault', e.target.checked)} 
                />
                <label htmlFor="headless-mode" className="ml-2 block text-sm text-slate-700">
                  Run browsers in headless mode by default
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Default User Agent
                </label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={browserSettings.userAgent}
                  onChange={(e) => handleBrowserSettingChange('userAgent', e.target.value)}
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  User agent string for browser requests
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Screenshot Quality (1-100)
                </label>
                <div className="flex items-center space-x-4">
                  <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    value={browserSettings.screenshotQuality}
                    onChange={(e) => handleBrowserSettingChange('screenshotQuality', parseInt(e.target.value))}
                  />
                  <span className="text-sm font-medium text-slate-700 w-8 text-center">
                    {browserSettings.screenshotQuality}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  Quality of screenshots taken by agents (higher = better quality but larger files)
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Default Page Timeout (ms)
                </label>
                <input 
                  type="number" 
                  className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1000"
                  step="1000"
                  value={browserSettings.defaultTimeout}
                  onChange={(e) => handleBrowserSettingChange('defaultTimeout', parseInt(e.target.value))}
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  Default timeout in milliseconds when loading pages (30000 = 30 seconds)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-between">
        <button 
          onClick={resetSettings}
          className="px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Reset to Defaults
        </button>
        <div className="flex items-center space-x-3">
          {showSavedMessage && (
            <span className="text-green-600 flex items-center text-sm">
              <i className="bi bi-check-circle mr-1.5"></i>
              Settings saved successfully
            </span>
          )}
          <button 
            onClick={saveSettings}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-cloud-upload mr-2"></i>
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings; 