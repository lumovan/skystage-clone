/**
 * General Settings Component
 * Basic site configuration settings
 */

"use client";

import { Upload, Globe, Mail, Phone, MapPin } from 'lucide-react';

interface GeneralSettingsProps {
  settings: {
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
  onUpdate: (field: string, value: unknown) => void;
}

export default function GeneralSettings({ settings, onUpdate }: GeneralSettingsProps) {
  const timezones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'GMT (London)' },
    { value: 'Europe/Paris', label: 'CET (Paris)' },
    { value: 'Asia/Tokyo', label: 'JST (Tokyo)' },
    { value: 'Australia/Sydney', label: 'AEST (Sydney)' }
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'it', label: 'Italiano' },
    { value: 'pt', label: 'Português' },
    { value: 'zh', label: '中文' },
    { value: 'ja', label: '日本語' }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-6">General Settings</h3>
        <p className="text-gray-600 mb-6">Configure basic site information and branding.</p>
      </div>

      {/* Site Identity */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
          <Globe className="h-5 w-5 mr-2" />
          Site Identity
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Site Name
            </label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => onUpdate('siteName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="SkyStage"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Site URL
            </label>
            <input
              type="url"
              value={settings.siteUrl}
              onChange={(e) => onUpdate('siteUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://skystage.com"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Site Description
            </label>
            <textarea
              value={settings.siteDescription}
              onChange={(e) => onUpdate('siteDescription', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Professional drone show design and booking platform"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tagline
            </label>
            <input
              type="text"
              value={settings.tagline}
              onChange={(e) => onUpdate('tagline', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Design and book the drone show of your dreams"
            />
          </div>
        </div>
      </div>

      {/* Branding */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
          <Upload className="h-5 w-5 mr-2" />
          Branding
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo URL
            </label>
            <input
              type="url"
              value={settings.logo}
              onChange={(e) => onUpdate('logo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="/assets/logos/skystage-logo.svg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Favicon URL
            </label>
            <input
              type="url"
              value={settings.favicon}
              onChange={(e) => onUpdate('favicon', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="/assets/icons/favicon.ico"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
          <Mail className="h-5 w-5 mr-2" />
          Contact Information
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Email
            </label>
            <input
              type="email"
              value={settings.contactEmail}
              onChange={(e) => onUpdate('contactEmail', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="hello@skystage.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Support Email
            </label>
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(e) => onUpdate('supportEmail', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="support@skystage.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={settings.phone}
              onChange={(e) => onUpdate('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => onUpdate('address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="123 Innovation St, Tech City, TC 12345"
            />
          </div>
        </div>
      </div>

      {/* Localization */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
          <Globe className="h-5 w-5 mr-2" />
          Localization
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              value={settings.timezone}
              onChange={(e) => onUpdate('timezone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {timezones.map((timezone) => (
                <option key={timezone.value} value={timezone.value}>
                  {timezone.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Language
            </label>
            <select
              value={settings.language}
              onChange={(e) => onUpdate('language', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {languages.map((language) => (
                <option key={language.value} value={language.value}>
                  {language.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Maintenance Mode */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Maintenance Mode</h4>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white">
            <div>
              <h5 className="text-sm font-medium text-gray-900">Enable Maintenance Mode</h5>
              <p className="text-xs text-gray-500 mt-1">
                Temporarily disable public access to the site for maintenance
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenance}
                onChange={(e) => onUpdate('maintenance', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>

          {settings.maintenance && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maintenance Message
              </label>
              <textarea
                value={settings.maintenanceMessage}
                onChange={(e) => onUpdate('maintenanceMessage', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="We are currently performing maintenance. Please check back soon."
              />
              <p className="text-xs text-gray-500 mt-1">
                This message will be displayed to visitors during maintenance mode
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
