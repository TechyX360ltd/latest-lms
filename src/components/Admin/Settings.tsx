import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Bell, 
  Mail, 
  Lock, 
  Users, 
  CreditCard,
  Globe,
  Palette,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Database,
  Server,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useAppearance } from '../../context/AppearanceContext';

export function Settings() {
  const { user, isSupabaseConnected } = useAuth();
  const { reloadAppearance } = useAppearance();
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    platformName: 'TECHYX 360',
    supportEmail: 'support@techyx360.com',
    contactPhone: '+234 800 123 4567',
    timezone: 'Africa/Lagos',
    defaultLanguage: 'en',
    maintenanceMode: false
  });

  // Load general settings from Supabase on mount
  useEffect(() => {
    if (activeTab === 'general') {
      (async () => {
        setIsLoading(true);
        setErrorMessage('');
        try {
          const { data, error } = await supabase
            .from('settings')
            .select('data')
            .eq('id', 'general')
            .single();
          if (error && error.code !== 'PGRST116') throw error;
          if (data && data.data) {
            setGeneralSettings({ ...generalSettings, ...data.data });
          }
        } catch (error: any) {
          setErrorMessage('Failed to load general settings.');
        } finally {
          setIsLoading(false);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Appearance Settings
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'light',
    primaryColor: '#3b82f6',
    secondaryColor: '#6366f1',
    fontFamily: 'Inter, system-ui, sans-serif',
    borderRadius: 'rounded',
    enableAnimations: true
  });

  // Load appearance settings from Supabase on mount
  useEffect(() => {
    if (activeTab === 'appearance') {
      (async () => {
        setIsLoading(true);
        setErrorMessage('');
        try {
          const { data, error } = await supabase
            .from('settings')
            .select('data')
            .eq('id', 'appearance')
            .single();
          if (error && error.code !== 'PGRST116') throw error;
          if (data && data.data) {
            setAppearanceSettings({ ...appearanceSettings, ...data.data });
          }
        } catch (error: any) {
          setErrorMessage('Failed to load appearance settings.');
        } finally {
          setIsLoading(false);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    passwordMinLength: 8,
    requireSpecialChars: true,
    requireNumbers: true,
    sessionTimeout: 60, // minutes
    maxLoginAttempts: 5,
    twoFactorAuth: false,
    dataEncryption: true
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    courseUpdates: true,
    assignmentReminders: true,
    systemAnnouncements: true,
    marketingEmails: false,
    notificationSound: true
  });

  // User Settings
  const [userSettings, setUserSettings] = useState({
    allowSelfRegistration: true,
    defaultUserRole: 'learner',
    requireEmailVerification: false,
    autoApproveAccounts: true,
    allowProfileCustomization: true,
    showUserProgress: true
  });

  // Load user settings from Supabase on mount
  useEffect(() => {
    if (activeTab === 'users') {
      (async () => {
        setIsLoading(true);
        setErrorMessage('');
        try {
          const { data, error } = await supabase
            .from('settings')
            .select('data')
            .eq('id', 'user')
            .single();
          if (error && error.code !== 'PGRST116') throw error;
          if (data && data.data) {
            setUserSettings({ ...userSettings, ...data.data });
          }
        } catch (error: any) {
          setErrorMessage('Failed to load user management settings.');
        } finally {
          setIsLoading(false);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Live user stats
  const [userStats, setUserStats] = useState({ total: 0, active: 0, admins: 0, loading: false, error: '' });
  useEffect(() => {
    if (activeTab === 'users') {
      (async () => {
        setUserStats(s => ({ ...s, loading: true, error: '' }));
        try {
          // Total users
          const { count: total, error: err1 } = await supabase.from('users').select('*', { count: 'exact', head: true });
          // Admins
          const { count: admins, error: err2 } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'admin');
          // Active users: for demo, count users with updated_at in last 30 days
          const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          const { count: active, error: err3 } = await supabase.from('users').select('*', { count: 'exact', head: true }).gte('updated_at', since);
          if (err1 || err2 || err3) throw err1 || err2 || err3;
          setUserStats({ total: total ?? 0, active: active ?? 0, admins: admins ?? 0, loading: false, error: '' });
        } catch (e) {
          setUserStats(s => ({ ...s, loading: false, error: 'Failed to load user stats.' }));
        }
      })();
    }
  }, [activeTab]);

  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({
    currency: 'NGN',
    currencySymbol: '₦',
    paymentGateways: ['Paystack', 'Flutterwave'],
    taxRate: 7.5,
    invoicePrefix: 'INV-',
    receiptPrefix: 'RCPT-',
    enableRefunds: true,
    refundPeriod: 7 // days
  });

  // Email Settings
  const [emailSettings, setEmailSettings] = useState({
    smtpServer: 'smtp.example.com',
    smtpPort: 587,
    smtpUsername: 'notifications@techyx360.com',
    smtpPassword: '••••••••••••',
    senderName: 'TECHYX 360',
    senderEmail: 'notifications@techyx360.com',
    enableEmailTemplates: true,
    emailFooter: 'TECHYX 360 Learning Management System'
  });

  // Database Status
  const [databaseStatus, setDatabaseStatus] = useState({
    connected: isSupabaseConnected,
    lastSync: new Date().toISOString(),
    tablesCount: 12,
    storageUsed: '256 MB',
    backupEnabled: true,
    lastBackup: new Date().toISOString()
  });

  const handleSaveSettings = async (settingsType: string) => {
    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      if (settingsType === 'general') {
        const { error } = await supabase
          .from('settings')
          .upsert([
            {
              id: 'general',
              data: generalSettings,
              updated_at: new Date().toISOString(),
            },
          ]);
        if (error) throw error;
        setSuccessMessage('General settings saved successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else if (settingsType === 'appearance') {
        const { error } = await supabase
          .from('settings')
          .upsert([
            {
              id: 'appearance',
              data: appearanceSettings,
              updated_at: new Date().toISOString(),
            },
          ]);
        if (error) throw error;
        setSuccessMessage('Appearance settings saved successfully!');
        reloadAppearance();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else if (settingsType === 'users') {
        const { error } = await supabase
          .from('settings')
          .upsert([
            {
              id: 'user',
              data: userSettings,
              updated_at: new Date().toISOString(),
            },
          ]);
        if (error) throw error;
        setSuccessMessage('User management settings saved successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        // ... existing code for other settings (localStorage or future Supabase logic) ...
        const settingsKey = `${settingsType}Settings`;
        const settingsValue = eval(settingsKey);
        localStorage.setItem(settingsKey, JSON.stringify(settingsValue));
        setSuccessMessage(`${settingsType.charAt(0).toUpperCase() + settingsType.slice(1)} settings saved successfully!`);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      setErrorMessage(`Failed to save ${settingsType} settings. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkDatabaseConnection = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('users').select('count()', { count: 'exact', head: true });
      
      if (error) {
        throw error;
      }
      
      setDatabaseStatus({
        ...databaseStatus,
        connected: true,
        lastSync: new Date().toISOString()
      });
      
      setSuccessMessage('Database connection verified successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Database connection error:', error);
      setDatabaseStatus({
        ...databaseStatus,
        connected: false
      });
      setErrorMessage('Failed to connect to database. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform Name
                </label>
                <input
                  type="text"
                  value={generalSettings.platformName}
                  onChange={(e) => setGeneralSettings({...generalSettings, platformName: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Support Email
                </label>
                <input
                  type="email"
                  value={generalSettings.supportEmail}
                  onChange={(e) => setGeneralSettings({...generalSettings, supportEmail: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={generalSettings.contactPhone}
                  onChange={(e) => setGeneralSettings({...generalSettings, contactPhone: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <select
                  value={generalSettings.timezone}
                  onChange={(e) => setGeneralSettings({...generalSettings, timezone: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Africa/Lagos">Africa/Lagos</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Asia/Tokyo">Asia/Tokyo</option>
                  <option value="Australia/Sydney">Australia/Sydney</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Language
                </label>
                <select
                  value={generalSettings.defaultLanguage}
                  onChange={(e) => setGeneralSettings({...generalSettings, defaultLanguage: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="en">English</option>
                  <option value="fr">French</option>
                  <option value="es">Spanish</option>
                  <option value="de">German</option>
                  <option value="zh">Chinese</option>
                </select>
              </div>
              <div>
                <div className="flex items-center gap-3 mt-8">
                  <input
                    type="checkbox"
                    id="maintenanceMode"
                    checked={generalSettings.maintenanceMode}
                    onChange={(e) => setGeneralSettings({...generalSettings, maintenanceMode: e.target.checked})}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="maintenanceMode" className="text-sm font-medium text-gray-700">
                    Enable Maintenance Mode
                  </label>
                </div>
                <p className="text-sm text-gray-500 mt-2 ml-7">
                  When enabled, only administrators can access the platform.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-center gap-3 mb-2">
                <Globe className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium text-blue-900">Platform Information</h3>
              </div>
              <p className="text-sm text-blue-800">
                These settings control the basic information and functionality of your learning platform.
                Changes to these settings will affect how users interact with the platform.
              </p>
            </div>
          </div>
        );
      case 'appearance':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Theme
                </label>
                <div className="flex gap-4">
                  <label className={`flex items-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors ${
                    appearanceSettings.theme === 'light' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <input
                      type="radio"
                      name="theme"
                      value="light"
                      checked={appearanceSettings.theme === 'light'}
                      onChange={() => setAppearanceSettings({...appearanceSettings, theme: 'light'})}
                      className="sr-only"
                    />
                    <Sun className="w-5 h-5 text-yellow-500" />
                    <span>Light</span>
                  </label>
                  <label className={`flex items-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors ${
                    appearanceSettings.theme === 'dark' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <input
                      type="radio"
                      name="theme"
                      value="dark"
                      checked={appearanceSettings.theme === 'dark'}
                      onChange={() => setAppearanceSettings({...appearanceSettings, theme: 'dark'})}
                      className="sr-only"
                    />
                    <Moon className="w-5 h-5 text-indigo-500" />
                    <span>Dark</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={appearanceSettings.primaryColor}
                    onChange={(e) => setAppearanceSettings({...appearanceSettings, primaryColor: e.target.value})}
                    className="w-10 h-10 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={appearanceSettings.primaryColor}
                    onChange={(e) => setAppearanceSettings({...appearanceSettings, primaryColor: e.target.value})}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={appearanceSettings.secondaryColor}
                    onChange={(e) => setAppearanceSettings({...appearanceSettings, secondaryColor: e.target.value})}
                    className="w-10 h-10 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={appearanceSettings.secondaryColor}
                    onChange={(e) => setAppearanceSettings({...appearanceSettings, secondaryColor: e.target.value})}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Family
                </label>
                <select
                  value={appearanceSettings.fontFamily}
                  onChange={(e) => setAppearanceSettings({...appearanceSettings, fontFamily: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Inter, system-ui, sans-serif">Inter</option>
                  <option value="'Roboto', sans-serif">Roboto</option>
                  <option value="'Open Sans', sans-serif">Open Sans</option>
                  <option value="'Montserrat', sans-serif">Montserrat</option>
                  <option value="'Poppins', sans-serif">Poppins</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Border Radius
                </label>
                <select
                  value={appearanceSettings.borderRadius}
                  onChange={(e) => setAppearanceSettings({...appearanceSettings, borderRadius: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="rounded-none">None</option>
                  <option value="rounded-sm">Small</option>
                  <option value="rounded">Medium</option>
                  <option value="rounded-lg">Large</option>
                  <option value="rounded-xl">Extra Large</option>
                  <option value="rounded-full">Full</option>
                </select>
              </div>
              <div>
                <div className="flex items-center gap-3 mt-8">
                  <input
                    type="checkbox"
                    id="enableAnimations"
                    checked={appearanceSettings.enableAnimations}
                    onChange={(e) => setAppearanceSettings({...appearanceSettings, enableAnimations: e.target.checked})}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="enableAnimations" className="text-sm font-medium text-gray-700">
                    Enable Animations
                  </label>
                </div>
                <p className="text-sm text-gray-500 mt-2 ml-7">
                  When enabled, UI elements will have smooth transitions and animations.
                </p>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
              <div className="flex items-center gap-3 mb-2">
                <Palette className="w-5 h-5 text-purple-600" />
                <h3 className="font-medium text-purple-900">Theme Preview</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Light Theme</h4>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded" style={{backgroundColor: appearanceSettings.primaryColor}}></div>
                    <div className="w-8 h-8 rounded" style={{backgroundColor: appearanceSettings.secondaryColor}}></div>
                  </div>
                </div>
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <h4 className="font-medium text-white mb-2">Dark Theme</h4>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded" style={{backgroundColor: appearanceSettings.primaryColor}}></div>
                    <div className="w-8 h-8 rounded" style={{backgroundColor: appearanceSettings.secondaryColor}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Password Length
                </label>
                <input
                  type="number"
                  min="6"
                  max="32"
                  value={securitySettings.passwordMinLength}
                  onChange={(e) => setSecuritySettings({...securitySettings, passwordMinLength: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="1440"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Login Attempts
                </label>
                <input
                  type="number"
                  min="3"
                  max="10"
                  value={securitySettings.maxLoginAttempts}
                  onChange={(e) => setSecuritySettings({...securitySettings, maxLoginAttempts: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="requireSpecialChars"
                    checked={securitySettings.requireSpecialChars}
                    onChange={(e) => setSecuritySettings({...securitySettings, requireSpecialChars: e.target.checked})}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="requireSpecialChars" className="text-sm font-medium text-gray-700">
                    Require Special Characters in Password
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="requireNumbers"
                    checked={securitySettings.requireNumbers}
                    onChange={(e) => setSecuritySettings({...securitySettings, requireNumbers: e.target.checked})}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="requireNumbers" className="text-sm font-medium text-gray-700">
                    Require Numbers in Password
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="twoFactorAuth"
                    checked={securitySettings.twoFactorAuth}
                    onChange={(e) => setSecuritySettings({...securitySettings, twoFactorAuth: e.target.checked})}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="twoFactorAuth" className="text-sm font-medium text-gray-700">
                    Enable Two-Factor Authentication
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="dataEncryption"
                    checked={securitySettings.dataEncryption}
                    onChange={(e) => setSecuritySettings({...securitySettings, dataEncryption: e.target.checked})}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="dataEncryption" className="text-sm font-medium text-gray-700">
                    Enable Data Encryption
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4 border border-red-100">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-5 h-5 text-red-600" />
                <h3 className="font-medium text-red-900">Security Warning</h3>
              </div>
              <p className="text-sm text-red-800">
                Changing security settings may require users to update their passwords or re-authenticate.
                Make sure to communicate these changes to your users before implementing them.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">Current Security Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Password Policy:</span>
                  <p className="text-gray-600">
                    {securitySettings.passwordMinLength}+ chars
                    {securitySettings.requireSpecialChars ? ', special chars' : ''}
                    {securitySettings.requireNumbers ? ', numbers' : ''}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Session Timeout:</span>
                  <p className="text-gray-600">{securitySettings.sessionTimeout} minutes</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Two-Factor Auth:</span>
                  <p className={securitySettings.twoFactorAuth ? 'text-green-600' : 'text-red-600'}>
                    {securitySettings.twoFactorAuth ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Data Encryption:</span>
                  <p className={securitySettings.dataEncryption ? 'text-green-600' : 'text-red-600'}>
                    {securitySettings.dataEncryption ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Email Notifications</h3>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="emailNotifications"
                    checked={notificationSettings.emailNotifications}
                    onChange={(e) => setNotificationSettings({...notificationSettings, emailNotifications: e.target.checked})}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="emailNotifications" className="text-sm font-medium text-gray-700">
                    Enable Email Notifications
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="courseUpdates"
                    checked={notificationSettings.courseUpdates}
                    onChange={(e) => setNotificationSettings({...notificationSettings, courseUpdates: e.target.checked})}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="courseUpdates" className="text-sm font-medium text-gray-700">
                    Course Updates
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="assignmentReminders"
                    checked={notificationSettings.assignmentReminders}
                    onChange={(e) => setNotificationSettings({...notificationSettings, assignmentReminders: e.target.checked})}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="assignmentReminders" className="text-sm font-medium text-gray-700">
                    Assignment Reminders
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="systemAnnouncements"
                    checked={notificationSettings.systemAnnouncements}
                    onChange={(e) => setNotificationSettings({...notificationSettings, systemAnnouncements: e.target.checked})}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="systemAnnouncements" className="text-sm font-medium text-gray-700">
                    System Announcements
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="marketingEmails"
                    checked={notificationSettings.marketingEmails}
                    onChange={(e) => setNotificationSettings({...notificationSettings, marketingEmails: e.target.checked})}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="marketingEmails" className="text-sm font-medium text-gray-700">
                    Marketing Emails
                  </label>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Push Notifications</h3>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="pushNotifications"
                    checked={notificationSettings.pushNotifications}
                    onChange={(e) => setNotificationSettings({...notificationSettings, pushNotifications: e.target.checked})}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="pushNotifications" className="text-sm font-medium text-gray-700">
                    Enable Push Notifications
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="notificationSound"
                    checked={notificationSettings.notificationSound}
                    onChange={(e) => setNotificationSettings({...notificationSettings, notificationSound: e.target.checked})}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="notificationSound" className="text-sm font-medium text-gray-700">
                    Enable Notification Sounds
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
              <div className="flex items-center gap-3 mb-2">
                <Bell className="w-5 h-5 text-yellow-600" />
                <h3 className="font-medium text-yellow-900">Notification Preview</h3>
              </div>
              <div className="bg-white p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    T
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">New Course Available</p>
                    <p className="text-sm text-gray-500">Just now</p>
                  </div>
                </div>
                <p className="text-gray-700 text-sm">
                  A new course "Advanced React Development" is now available. Check it out!
                </p>
              </div>
            </div>
          </div>
        );
      case 'users':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default User Role
                </label>
                <select
                  value={userSettings.defaultUserRole}
                  onChange={(e) => setUserSettings({...userSettings, defaultUserRole: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="learner">Learner</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="allowSelfRegistration"
                    checked={userSettings.allowSelfRegistration}
                    onChange={(e) => setUserSettings({...userSettings, allowSelfRegistration: e.target.checked})}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="allowSelfRegistration" className="text-sm font-medium text-gray-700">
                    Allow Self Registration
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="requireEmailVerification"
                    checked={userSettings.requireEmailVerification}
                    onChange={(e) => setUserSettings({...userSettings, requireEmailVerification: e.target.checked})}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="requireEmailVerification" className="text-sm font-medium text-gray-700">
                    Require Email Verification
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="autoApproveAccounts"
                    checked={userSettings.autoApproveAccounts}
                    onChange={(e) => setUserSettings({...userSettings, autoApproveAccounts: e.target.checked})}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="autoApproveAccounts" className="text-sm font-medium text-gray-700">
                    Auto-Approve New Accounts
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="allowProfileCustomization"
                    checked={userSettings.allowProfileCustomization}
                    onChange={(e) => setUserSettings({...userSettings, allowProfileCustomization: e.target.checked})}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="allowProfileCustomization" className="text-sm font-medium text-gray-700">
                    Allow Profile Customization
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="showUserProgress"
                    checked={userSettings.showUserProgress}
                    onChange={(e) => setUserSettings({...userSettings, showUserProgress: e.target.checked})}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="showUserProgress" className="text-sm font-medium text-gray-700">
                    Show User Progress to Others
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="font-medium text-indigo-900">User Management</h3>
              </div>
              <p className="text-sm text-indigo-800 mb-4">
                These settings control how users can register, log in, and interact with the platform.
                Changes to these settings may affect user experience and security.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white p-3 rounded-lg border border-indigo-200">
                  <p className="font-medium text-indigo-900">Total Users</p>
                  <p className="text-2xl font-bold text-indigo-600">{userStats.total}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-indigo-200">
                  <p className="font-medium text-indigo-900">Active Users</p>
                  <p className="text-2xl font-bold text-indigo-600">{userStats.active}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-indigo-200">
                  <p className="font-medium text-indigo-900">Admins</p>
                  <p className="text-2xl font-bold text-indigo-600">{userStats.admins}</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'payments':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={paymentSettings.currency}
                  onChange={(e) => setPaymentSettings({...paymentSettings, currency: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="NGN">Nigerian Naira (NGN)</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="GBP">British Pound (GBP)</option>
                  <option value="CAD">Canadian Dollar (CAD)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  value={paymentSettings.currencySymbol}
                  onChange={(e) => setPaymentSettings({...paymentSettings, currencySymbol: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={paymentSettings.taxRate}
                  onChange={(e) => setPaymentSettings({...paymentSettings, taxRate: parseFloat(e.target.value)})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Prefix
                </label>
                <input
                  type="text"
                  value={paymentSettings.invoicePrefix}
                  onChange={(e) => setPaymentSettings({...paymentSettings, invoicePrefix: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Receipt Prefix
                </label>
                <input
                  type="text"
                  value={paymentSettings.receiptPrefix}
                  onChange={(e) => setPaymentSettings({...paymentSettings, receiptPrefix: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refund Period (days)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={paymentSettings.refundPeriod}
                  onChange={(e) => setPaymentSettings({...paymentSettings, refundPeriod: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Gateways
              </label>
              <div className="space-y-3">
                {['Paystack', 'Flutterwave', 'Stripe', 'PayPal'].map((gateway) => (
                  <div key={gateway} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={gateway}
                      checked={paymentSettings.paymentGateways.includes(gateway)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPaymentSettings({
                            ...paymentSettings,
                            paymentGateways: [...paymentSettings.paymentGateways, gateway]
                          });
                        } else {
                          setPaymentSettings({
                            ...paymentSettings,
                            paymentGateways: paymentSettings.paymentGateways.filter(g => g !== gateway)
                          });
                        }
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor={gateway} className="text-sm font-medium text-gray-700">
                      {gateway}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="enableRefunds"
                checked={paymentSettings.enableRefunds}
                onChange={(e) => setPaymentSettings({...paymentSettings, enableRefunds: e.target.checked})}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="enableRefunds" className="text-sm font-medium text-gray-700">
                Enable Refunds
              </label>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <div className="flex items-center gap-3 mb-2">
                <CreditCard className="w-5 h-5 text-green-600" />
                <h3 className="font-medium text-green-900">Payment Information</h3>
              </div>
              <p className="text-sm text-green-800">
                These settings control how payments are processed and displayed on your platform.
                Make sure to configure your payment gateways properly to ensure smooth transactions.
              </p>
            </div>
          </div>
        );
      case 'email':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Server
                </label>
                <input
                  type="text"
                  value={emailSettings.smtpServer}
                  onChange={(e) => setEmailSettings({...emailSettings, smtpServer: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Port
                </label>
                <input
                  type="number"
                  value={emailSettings.smtpPort}
                  onChange={(e) => setEmailSettings({...emailSettings, smtpPort: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Username
                </label>
                <input
                  type="text"
                  value={emailSettings.smtpUsername}
                  onChange={(e) => setEmailSettings({...emailSettings, smtpUsername: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Password
                </label>
                <input
                  type="password"
                  value={emailSettings.smtpPassword}
                  onChange={(e) => setEmailSettings({...emailSettings, smtpPassword: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sender Name
                </label>
                <input
                  type="text"
                  value={emailSettings.senderName}
                  onChange={(e) => setEmailSettings({...emailSettings, senderName: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sender Email
                </label>
                <input
                  type="email"
                  value={emailSettings.senderEmail}
                  onChange={(e) => setEmailSettings({...emailSettings, senderEmail: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Footer
              </label>
              <textarea
                value={emailSettings.emailFooter}
                onChange={(e) => setEmailSettings({...emailSettings, emailFooter: e.target.value})}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="enableEmailTemplates"
                checked={emailSettings.enableEmailTemplates}
                onChange={(e) => setEmailSettings({...emailSettings, enableEmailTemplates: e.target.checked})}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="enableEmailTemplates" className="text-sm font-medium text-gray-700">
                Enable Email Templates
              </label>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium text-blue-900">Email Template Preview</h3>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <p className="font-medium text-gray-900">Welcome to {emailSettings.senderName}</p>
                </div>
                <p className="text-gray-700 text-sm mb-4">
                  Hello [User Name],<br /><br />
                  Welcome to {emailSettings.senderName}! We're excited to have you join our learning platform.<br /><br />
                  Get started by exploring our course catalog and enrolling in your first course.
                </p>
                <div className="border-t border-gray-200 pt-4 text-xs text-gray-500">
                  {emailSettings.emailFooter}
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  To test your email configuration, save your settings and then use the "Send Test Email" button.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Send Test Email
              </button>
            </div>
          </div>
        );
      case 'database':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Database className="w-6 h-6 text-blue-600" />
                Database Status
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${databaseStatus.connected ? 'bg-green-100' : 'bg-red-100'}`}>
                    <Server className={`w-6 h-6 ${databaseStatus.connected ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Connection Status</h3>
                    <p className={`text-sm ${databaseStatus.connected ? 'text-green-600' : 'text-red-600'}`}>
                      {databaseStatus.connected ? 'Connected to Supabase' : 'Not connected'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Last Sync</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(databaseStatus.lastSync).toLocaleString()}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Tables</h3>
                  <p className="text-sm text-gray-600">
                    {databaseStatus.tablesCount} tables in database
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Storage Used</h3>
                  <p className="text-sm text-gray-600">
                    {databaseStatus.storageUsed}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={checkDatabaseConnection}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? 'Checking...' : 'Check Connection'}
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Backup Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="backupEnabled"
                    checked={databaseStatus.backupEnabled}
                    onChange={(e) => setDatabaseStatus({...databaseStatus, backupEnabled: e.target.checked})}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="backupEnabled" className="text-sm font-medium text-gray-700">
                    Enable Automatic Backups
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Backup Frequency
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Retention Period
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="7">7 days</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                    <option value="365">1 year</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-2">Last Backup</h3>
                <p className="text-sm text-gray-600">
                  {new Date(databaseStatus.lastBackup).toLocaleString()}
                </p>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Database className="w-4 h-4" />
                  Create Manual Backup
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-blue-600" />
            Settings
          </h1>
          <p className="text-gray-600">Configure your TECHYX 360 platform settings</p>
        </div>
        
        {/* Database Connection Status */}
        <div className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
          isSupabaseConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <Server className="w-5 h-5" />
          <span className="font-medium">
            {isSupabaseConnected ? 'Connected to Supabase' : 'Using Local Storage'}
          </span>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-800 font-medium">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800 font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Settings Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-wrap border-b border-gray-200">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'general'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'appearance'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Appearance
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'security'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Security
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'notifications'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'users'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'payments'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Payments
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'email'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Email
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'database'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Database
          </button>
        </div>

        <div className="p-6">
          {renderTabContent()}

          {/* Save Button */}
          <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => handleSaveSettings(activeTab)}
              disabled={isLoading}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {isLoading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}