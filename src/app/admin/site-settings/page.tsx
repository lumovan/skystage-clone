/**
 * Admin Site Settings Management
 * Comprehensive configuration system for the SkyStage platform
 */

"use client";

import { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Upload,
  Download,
  Eye,
  Palette,
  Globe,
  Mail,
  Shield,
  CreditCard,
  Bell,
  Zap,
  Database,
  Key,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import GeneralSettings from '@/components/admin/settings/GeneralSettings';
import AppearanceSettings from '@/components/admin/settings/AppearanceSettings';
import FeatureSettings from '@/components/admin/settings/FeatureSettings';
import IntegrationSettings from '@/components/admin/settings/IntegrationSettings';
import NotificationSettings from '@/components/admin/settings/NotificationSettings';
import SecuritySettings from '@/components/admin/settings/SecuritySettings';
import PerformanceSettings from '@/components/admin/settings/PerformanceSettings';
import BackupSettings from '@/components/admin/settings/BackupSettings';

interface SiteSettings {
  general: {
    siteName: string;
    siteDescription: string;
    siteUrl: string;
    logo: string;
    favicon: string;
    tagline: string;
    contactEmail: string;
    supportEmail: string;
    phone: string;
    address: string;
    timezone: string;
    language: string;
    maintenance: boolean;
    maintenanceMessage: string;
  };
  appearance: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    theme: 'light' | 'dark' | 'auto';
    fontFamily: string;
    fontSize: string;
    borderRadius: string;
    logoPosition: 'left' | 'center' | 'right';
    headerHeight: string;
    sidebarWidth: string;
    customCSS: string;
  };
  features: {
    registrationEnabled: boolean;
    socialLoginEnabled: boolean;
    guestCheckoutEnabled: boolean;
    reviewsEnabled: boolean;
    ratingsEnabled: boolean;
    wishlistEnabled: boolean;
    comparisonEnabled: boolean;
    searchEnabled: boolean;
    filtersEnabled: boolean;
    sortingEnabled: boolean;
    paginationSize: number;
    maxFormationsPerUser: number;
    maxFileSize: number;
    allowedFileTypes: string[];
  };
  integrations: {
    googleAnalytics: string;
    facebookPixel: string;
    googleMaps: string;
    recaptcha: string;
    mailchimp: string;
    sendgrid: string;
    stripe: string;
    paypal: string;
    cloudinary: string;
    aws: {
      accessKeyId: string;
      secretAccessKey: string;
      region: string;
      bucket: string;
    };
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    slackWebhook: string;
    discordWebhook: string;
    notificationEmail: string;
  };
  security: {
    maxLoginAttempts: number;
    lockoutDuration: number;
    sessionTimeout: number;
    requireEmailVerification: boolean;
    requirePhoneVerification: boolean;
    twoFactorEnabled: boolean;
    passwordMinLength: number;
    passwordRequireSpecial: boolean;
    passwordRequireNumbers: boolean;
    passwordRequireUppercase: boolean;
    ipWhitelist: string[];
    rateLimitRequests: number;
    rateLimitWindow: number;
  };
  performance: {
    cachingEnabled: boolean;
    cacheTimeout: number;
    compressionEnabled: boolean;
    minificationEnabled: boolean;
    cdnEnabled: boolean;
    cdnUrl: string;
    lazyLoadingEnabled: boolean;
    imageOptimization: boolean;
    databaseOptimization: boolean;
  };
  backup: {
    autoBackup: boolean;
    backupFrequency: string;
    backupRetention: number;
    backupLocation: string;
    backupEncryption: boolean;
    lastBackup: string;
  };
}

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.data || getDefaultSettings());
      } else {
        // Load default settings if API fails
        setSettings(getDefaultSettings());
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setSettings(getDefaultSettings());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultSettings = (): SiteSettings => ({
    general: {
      siteName: 'SkyStage',
      siteDescription: 'Professional drone show design and booking platform',
      siteUrl: 'https://skystage.com',
      logo: '/assets/logos/skystage-logo.svg',
      favicon: '/assets/icons/favicon.ico',
      tagline: 'Design and book the drone show of your dreams',
      contactEmail: 'hello@skystage.com',
      supportEmail: 'support@skystage.com',
      phone: '+1 (555) 123-4567',
      address: '123 Innovation St, Tech City, TC 12345',
      timezone: 'UTC',
      language: 'en',
      maintenance: false,
      maintenanceMessage: 'We are currently performing maintenance. Please check back soon.'
    },
    appearance: {
      primaryColor: '#3b82f6',
      secondaryColor: '#64748b',
      accentColor: '#f59e0b',
      theme: 'light',
      fontFamily: 'Inter',
      fontSize: '16px',
      borderRadius: '8px',
      logoPosition: 'left',
      headerHeight: '70px',
      sidebarWidth: '256px',
      customCSS: ''
    },
    features: {
      registrationEnabled: true,
      socialLoginEnabled: true,
      guestCheckoutEnabled: true,
      reviewsEnabled: true,
      ratingsEnabled: true,
      wishlistEnabled: true,
      comparisonEnabled: true,
      searchEnabled: true,
      filtersEnabled: true,
      sortingEnabled: true,
      paginationSize: 20,
      maxFormationsPerUser: 100,
      maxFileSize: 50,
      allowedFileTypes: ['zip', 'json', 'csv', 'blend']
    },
    integrations: {
      googleAnalytics: '',
      facebookPixel: '',
      googleMaps: '',
      recaptcha: '',
      mailchimp: '',
      sendgrid: '',
      stripe: '',
      paypal: '',
      cloudinary: '',
      aws: {
        accessKeyId: '',
        secretAccessKey: '',
        region: 'us-east-1',
        bucket: ''
      }
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      slackWebhook: '',
      discordWebhook: '',
      notificationEmail: 'admin@skystage.com'
    },
    security: {
      maxLoginAttempts: 5,
      lockoutDuration: 300,
      sessionTimeout: 3600,
      requireEmailVerification: true,
      requirePhoneVerification: false,
      twoFactorEnabled: false,
      passwordMinLength: 8,
      passwordRequireSpecial: true,
      passwordRequireNumbers: true,
      passwordRequireUppercase: true,
      ipWhitelist: [],
      rateLimitRequests: 100,
      rateLimitWindow: 900
    },
    performance: {
      cachingEnabled: true,
      cacheTimeout: 3600,
      compressionEnabled: true,
      minificationEnabled: true,
      cdnEnabled: false,
      cdnUrl: '',
      lazyLoadingEnabled: true,
      imageOptimization: true,
      databaseOptimization: true
    },
    backup: {
      autoBackup: true,
      backupFrequency: 'daily',
      backupRetention: 30,
      backupLocation: 'local',
      backupEncryption: true,
      lastBackup: new Date().toISOString()
    }
  });

  const updateSettings = ($1: unknown) => {
    if (!settings) return;

    setSettings(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [field]: value
      }
    }));
    setUnsavedChanges(true);
  };

  const saveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setUnsavedChanges(false);
        showNotification('success', 'Settings saved successfully!');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      showNotification('error', 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      setSettings(getDefaultSettings());
      setUnsavedChanges(true);
      showNotification('info', 'Settings reset to defaults. Remember to save!');
    }
  };

  const exportSettings = () => {
    if (!settings) return;

    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `skystage-settings-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    showNotification('success', 'Settings exported successfully!');
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        setSettings(importedSettings);
        setUnsavedChanges(true);
        showNotification('success', 'Settings imported successfully!');
      } catch (error) {
        showNotification('error', 'Invalid settings file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'features', label: 'Features', icon: Zap },
    { id: 'integrations', label: 'Integrations', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'performance', label: 'Performance', icon: Database },
    { id: 'backup', label: 'Backup', icon: RefreshCw }
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Site Settings</h1>
            <p className="mt-2 text-gray-600">
              Configure your SkyStage platform settings and preferences
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="file"
              accept=".json"
              onChange={importSettings}
              className="hidden"
              id="import-settings"
            />

            <button
              onClick={() => document.getElementById('import-settings')?.click()}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </button>

            <button
              onClick={exportSettings}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>

            <button
              onClick={resetSettings}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </button>

            <button
              onClick={saveSettings}
              disabled={!unsavedChanges || saving}
              className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                unsavedChanges
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`p-4 rounded-md ${
            notification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            notification.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            <div className="flex items-center">
              {notification.type === 'success' ? <CheckCircle className="h-5 w-5 mr-2" /> :
               notification.type === 'error' ? <AlertCircle className="h-5 w-5 mr-2" /> :
               <Info className="h-5 w-5 mr-2" />}
              {notification.message}
            </div>
          </div>
        )}

        {/* Unsaved Changes Warning */}
        {unsavedChanges && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="text-yellow-800">You have unsaved changes. Don't forget to save!</span>
            </div>
          </div>
        )}

        {/* Tabs and Content */}
        <div className="bg-white shadow rounded-lg">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'general' && settings && (
              <GeneralSettings
                settings={settings.general}
                onUpdate={(field, value) => updateSettings('general', field, value)}
              />
            )}

            {activeTab === 'appearance' && settings && (
              <AppearanceSettings
                settings={settings.appearance}
                onUpdate={(field, value) => updateSettings('appearance', field, value)}
              />
            )}

            {activeTab === 'features' && settings && (
              <FeatureSettings
                settings={settings.features}
                onUpdate={(field, value) => updateSettings('features', field, value)}
              />
            )}

            {activeTab === 'integrations' && settings && (
              <IntegrationSettings
                settings={settings.integrations}
                onUpdate={(field, value) => updateSettings('integrations', field, value)}
              />
            )}

            {activeTab === 'notifications' && settings && (
              <NotificationSettings
                settings={settings.notifications}
                onUpdate={(field, value) => updateSettings('notifications', field, value)}
              />
            )}

            {activeTab === 'security' && settings && (
              <SecuritySettings
                settings={settings.security}
                onUpdate={(field, value) => updateSettings('security', field, value)}
              />
            )}

            {activeTab === 'performance' && settings && (
              <PerformanceSettings
                settings={settings.performance}
                onUpdate={(field, value) => updateSettings('performance', field, value)}
              />
            )}

            {activeTab === 'backup' && settings && (
              <BackupSettings
                settings={settings.backup}
                onUpdate={(field, value) => updateSettings('backup', field, value)}
              />
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// Individual settings components will be implemented next...
