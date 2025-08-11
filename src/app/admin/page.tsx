/**
 * Admin Dashboard Page
 * Main administrative interface for managing the SkyStage platform
 * Features: Analytics, user management, booking management, system overview
 */

"use client";

import { useEffect, useState } from 'react';
import { Users, Bookmark, Plane, TrendingUp, AlertCircle, CheckCircle, Clock, DollarSign } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import StatsCard from '@/components/admin/StatsCard';
import RecentActivity from '@/components/admin/RecentActivity';
import ChartComponent from '@/components/admin/ChartComponent';

interface DashboardStats {
  users: {
    total: number;
    new_this_week: number;
    new_this_month: number;
    by_type: Array<{ user_type: string; count: number }>;
  };
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    by_status: Array<{ status: string; count: number }>;
  };
  formations: {
    total: number;
    by_category: Array<{ category: string; count: number }>;
    most_popular: Array<{ id: string; name: string; downloads: number; rating: number }>;
    recent_uploads: Array<{ id: string; name: string; category: string; creator_name: string; created_at: string }>;
  };
  activity: {
    recent_events: Array<{ event_type: string; entity_type: string; created_at: string; count: number }>;
    daily_active_users: number;
    weekly_trends: Array<{ date: string; event_type: string; count: number }>;
  };
  revenue: {
    total: number;
    this_month: number;
    last_month: number;
    growth_percentage: number;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      } else {
        throw new Error(data.error || 'Failed to load dashboard');
      }
    } catch (error: unknown) {
      console.error('Dashboard error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchDashboardStats}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!stats) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">No data available</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Overview of your SkyStage platform performance and metrics
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Users"
            value={stats.users.total.toLocaleString()}
            change={`+${stats.users.new_this_week} this week`}
            icon={<Users className="h-6 w-6" />}
            trend="up"
          />

          <StatsCard
            title="Active Bookings"
            value={stats.bookings.pending + stats.bookings.confirmed}
            change={`${stats.bookings.pending} pending`}
            icon={<Bookmark className="h-6 w-6" />}
            trend="neutral"
          />

          <StatsCard
            title="Formations"
            value={stats.formations.total.toLocaleString()}
            change="Available in library"
            icon={<Plane className="h-6 w-6" />}
            trend="up"
          />

          <StatsCard
            title="Daily Active Users"
            value={stats.activity.daily_active_users.toLocaleString()}
            change="Last 24 hours"
            icon={<TrendingUp className="h-6 w-6" />}
            trend="up"
          />
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Types Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
            <ChartComponent
              type="pie"
              data={stats.users.by_type.map(item => ({
                name: item.user_type.charAt(0).toUpperCase() + item.user_type.slice(1),
                value: item.count
              }))}
            />
          </div>

          {/* Booking Status Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Status</h3>
            <ChartComponent
              type="bar"
              data={stats.bookings.by_status.map(item => ({
                name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
                value: item.count
              }))}
            />
          </div>
        </div>

        {/* Recent Activity and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <RecentActivity activities={stats.activity.recent_events} />
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center">
                <Users className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <p className="font-medium">Manage Users</p>
                  <p className="text-sm text-gray-500">{stats.users.total} total users</p>
                </div>
              </button>

              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center">
                <Bookmark className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <p className="font-medium">Review Bookings</p>
                  <p className="text-sm text-gray-500">{stats.bookings.pending} pending review</p>
                </div>
              </button>

              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center">
                <Plane className="h-5 w-5 text-purple-600 mr-3" />
                <div>
                  <p className="font-medium">Formation Library</p>
                  <p className="text-sm text-gray-500">{stats.formations.total} formations</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Popular Formations */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Most Popular Formations</h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Formation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Downloads
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.formations.most_popular.map((formation) => (
                    <tr key={formation.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{formation.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formation.downloads.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">⭐ {formation.rating.toFixed(1)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
