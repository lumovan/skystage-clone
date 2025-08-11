/**
 * Skystage Integration Admin Page
 * Manage Skystage platform sync and formation imports
 */

"use client";

import { useState, useEffect } from 'react';
import {
  Cloud,
  Download,
  Upload,
  Sync,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  ExternalLink,
  RefreshCw,
  Database
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

interface SyncProgress {
  id: string;
  status: 'starting' | 'syncing' | 'completed' | 'error';
  progress: number;
  total: number;
  message: string;
  startedAt: string;
  completedAt?: string;
  formations?: Array<{
    id: string;
    name: string;
    category: string;
    droneCount: number;
  }>;
  error?: string;
}

interface SkystageCredentials {
  email: string;
  password: string;
}

export default function SkystageAdminPage() {
  const [credentials, setCredentials] = useState<SkystageCredentials>({
    email: '',
    password: ''
  });
  const [currentSync, setCurrentSync] = useState<SyncProgress | null>(null);
  const [recentSyncs, setRecentSyncs] = useState<SyncProgress[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncType, setSyncType] = useState<'all' | 'new' | 'force'>('new');

  useEffect(() => {
    checkConnection();
    loadRecentSyncs();
  }, []);

  // Auto-refresh sync progress
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (currentSync && ['starting', 'syncing', 'saving'].includes(currentSync.status)) {
      interval = setInterval(() => {
        refreshSyncStatus(currentSync.id);
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentSync]);

  const checkConnection = async () => {
    try {
      // This would check if we have valid Skystage credentials saved
      const response = await fetch('/api/skystage/status');
      const data = await response.json();
      setIsConnected(data.connected);
    } catch (error) {
      console.error('Connection check failed:', error);
    }
  };

  const loadRecentSyncs = async () => {
    try {
      const response = await fetch('/api/skystage/sync');
      const data = await response.json();

      if (data.success) {
        setRecentSyncs(data.recentSyncs || []);
      }
    } catch (error) {
      console.error('Failed to load recent syncs:', error);
    }
  };

  const startSync = async () => {
    if (!credentials.email || !credentials.password) {
      alert('Please enter your Skystage credentials');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/skystage/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          syncType
        })
      });

      const data = await response.json();

      if (data.success) {
        setCurrentSync({
          id: data.syncId,
          status: 'starting',
          progress: 0,
          total: 0,
          message: 'Starting sync...',
          startedAt: new Date().toISOString()
        });

        // Start monitoring progress
        refreshSyncStatus(data.syncId);
      } else {
        alert(`Sync failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Sync start failed:', error);
      alert('Failed to start sync');
    } finally {
      setLoading(false);
    }
  };

  const refreshSyncStatus = async (syncId: string) => {
    try {
      const response = await fetch(`/api/skystage/sync?syncId=${syncId}`);
      const data = await response.json();

      if (data.success) {
        setCurrentSync(data.progress);

        // If sync completed, refresh recent syncs
        if (['completed', 'error'].includes(data.progress.status)) {
          setTimeout(loadRecentSyncs, 1000);
        }
      }
    } catch (error) {
      console.error('Failed to refresh sync status:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'starting':
      case 'syncing':
      case 'saving':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'starting':
      case 'syncing':
      case 'saving':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Skystage Integration</h1>
            <p className="mt-2 text-gray-600">
              Sync formations and data from your Skystage account
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              isConnected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-gray-500'
              }`} />
              <span>{isConnected ? 'Connected' : 'Not Connected'}</span>
            </div>

            <button
              onClick={checkConnection}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Sync Configuration */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Sync Configuration</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Credentials */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Skystage Credentials</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your-email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Sync Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Sync Options</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sync Type
                </label>
                <select
                  value={syncType}
                  onChange={(e) => setSyncType(e.target.value as 'all' | 'new' | 'force')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="new">New formations only</option>
                  <option value="all">All formations</option>
                  <option value="force">Force update all</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  {syncType === 'new' && 'Only sync formations not already in database'}
                  {syncType === 'all' && 'Sync all formations, update existing ones'}
                  {syncType === 'force' && 'Overwrite all existing formations'}
                </p>
              </div>

              <button
                onClick={startSync}
                disabled={loading || (currentSync && ['starting', 'syncing'].includes(currentSync.status))}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sync className="h-5 w-5" />
                <span>{loading ? 'Starting Sync...' : 'Start Sync'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Current Sync Progress */}
        {currentSync && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Sync Progress</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(currentSync.status)}
                  <span className="text-lg font-medium">{currentSync.message}</span>
                </div>

                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentSync.status)}`}>
                  {currentSync.status.charAt(0).toUpperCase() + currentSync.status.slice(1)}
                </span>
              </div>

              {currentSync.total > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Progress</span>
                    <span>{currentSync.progress} / {currentSync.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(currentSync.progress / currentSync.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {currentSync.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">{currentSync.error}</p>
                </div>
              )}

              {currentSync.formations && currentSync.formations.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Synced Formations</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {currentSync.formations.slice(0, 6).map((formation) => (
                      <div key={formation.id} className="p-3 bg-gray-50 rounded-lg">
                        <h5 className="font-medium text-sm text-gray-900">{formation.name}</h5>
                        <p className="text-xs text-gray-600">
                          {formation.category} • {formation.droneCount} drones
                        </p>
                      </div>
                    ))}
                    {currentSync.formations.length > 6 && (
                      <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-center">
                        <span className="text-sm text-gray-600">
                          +{currentSync.formations.length - 6} more
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Syncs */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Recent Syncs</h2>
              <button
                onClick={loadRecentSyncs}
                className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {recentSyncs.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Database className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p>No recent syncs found</p>
                <p className="text-sm">Start your first sync to see results here</p>
              </div>
            ) : (
              recentSyncs.map((sync) => (
                <div key={sync.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(sync.status)}
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {sync.formations?.length || 0} formations synced
                        </h3>
                        <p className="text-sm text-gray-600">
                          Started {new Date(sync.startedAt).toLocaleString()}
                          {sync.completedAt && (
                            <> • Completed {new Date(sync.completedAt).toLocaleString()}</>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(sync.status)}`}>
                        {sync.status.charAt(0).toUpperCase() + sync.status.slice(1)}
                      </span>

                      <button
                        onClick={() => refreshSyncStatus(sync.id)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {sync.message && (
                    <p className="mt-2 text-sm text-gray-600">{sync.message}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Cloud className="h-8 w-8 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Skystage Account</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              View your Skystage account details and formation library
            </p>
            <a
              href="https://www.skystage.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Open Skystage</span>
            </a>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Download className="h-8 w-8 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Formation Export</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Export formations to Blender, Skybrush, and other formats
            </p>
            <a
              href="/admin/formations"
              className="flex items-center space-x-2 text-green-600 hover:text-green-700"
            >
              <Eye className="h-4 w-4" />
              <span>Manage Formations</span>
            </a>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Settings className="h-8 w-8 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Integration Settings</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Configure sync schedules and automation settings
            </p>
            <button className="flex items-center space-x-2 text-purple-600 hover:text-purple-700">
              <Settings className="h-4 w-4" />
              <span>Configure</span>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
