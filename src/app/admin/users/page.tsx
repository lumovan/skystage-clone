/**
 * Enhanced User Management Admin Page
 * Enterprise-level user administration with advanced features
 */

"use client";

import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Activity,
  Download,
  Upload,
  Eye,
  Ban,
  CheckCircle,
  AlertCircle,
  Clock,
  Building2
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

interface User {
  id: string;
  email: string;
  full_name: string;
  user_type: 'customer' | 'operator' | 'artist' | 'admin';
  company_name?: string;
  location?: string;
  phone?: string;
  is_verified: boolean;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  total_bookings?: number;
  total_formations?: number;
  subscription_status?: 'free' | 'basic' | 'pro' | 'enterprise';
}

interface UserStats {
  total: number;
  active: number;
  verified: number;
  new_this_month: number;
  by_type: Record<string, number>;
  by_subscription: Record<string, number>;
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    loadUsers();
    loadStats();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      const data = await response.json();

      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/users/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.company_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || user.user_type === filterType;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && user.is_active) ||
      (filterStatus === 'inactive' && !user.is_active) ||
      (filterStatus === 'verified' && user.is_verified) ||
      (filterStatus === 'unverified' && !user.is_verified);

    return matchesSearch && matchesType && matchesStatus;
  });

  const bulkUpdateUsers = async (data: unknown) => {
    try {
      const response = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedUsers,
          action,
          value
        })
      });

      if (response.ok) {
        await loadUsers();
        setSelectedUsers([]);
        setShowBulkActions(false);
        alert(`Successfully updated ${selectedUsers.length} users`);
      }
    } catch (error) {
      console.error('Bulk update failed:', error);
      alert('Bulk update failed');
    }
  };

  const exportUsers = async () => {
    try {
      const response = await fetch('/api/admin/users/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedUsers.length > 0 ? selectedUsers : undefined,
          filters: { searchTerm, filterType, filterStatus }
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed');
    }
  };

  const getUserStatusBadge = (user: User) => {
    if (!user.is_active) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Inactive</span>;
    }
    if (!user.is_verified) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Unverified</span>;
    }
    return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Active</span>;
  };

  const getUserTypeBadge = (type: string) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      operator: 'bg-blue-100 text-blue-800',
      artist: 'bg-green-100 text-green-800',
      customer: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${colors[type as keyof typeof colors]}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="mt-2 text-gray-600">
              Manage users, permissions, and account settings
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {selectedUsers.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedUsers.length} selected
                </span>
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Bulk Actions
                </button>
              </div>
            )}

            <button
              onClick={exportUsers}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add User</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.active.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Verified</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.verified.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">New This Month</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.new_this_month.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {showBulkActions && selectedUsers.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Bulk Actions ({selectedUsers.length} users selected)
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => bulkUpdateUsers('activate')}
                className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Activate</span>
              </button>

              <button
                onClick={() => bulkUpdateUsers('deactivate')}
                className="flex items-center space-x-2 px-3 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200"
              >
                <Ban className="h-4 w-4" />
                <span>Deactivate</span>
              </button>

              <button
                onClick={() => bulkUpdateUsers('verify')}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200"
              >
                <Shield className="h-4 w-4" />
                <span>Verify</span>
              </button>

              <button
                onClick={() => bulkUpdateUsers('send_welcome_email')}
                className="flex items-center space-x-2 px-3 py-2 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200"
              >
                <Mail className="h-4 w-4" />
                <span>Send Welcome Email</span>
              </button>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="admin">Admin</option>
              <option value="operator">Operator</option>
              <option value="artist">Artist</option>
              <option value="customer">Customer</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>

            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('_');
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="created_at_desc">Newest First</option>
              <option value="created_at_asc">Oldest First</option>
              <option value="full_name_asc">Name A-Z</option>
              <option value="full_name_desc">Name Z-A</option>
              <option value="last_login_desc">Last Login</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={selectAllUsers}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.full_name || 'No name'}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.company_name && (
                            <div className="text-xs text-gray-400 flex items-center">
                              <Building2 className="h-3 w-3 mr-1" />
                              {user.company_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getUserTypeBadge(user.user_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getUserStatusBadge(user)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        <div>Bookings: {user.total_bookings || 0}</div>
                        <div>Formations: {user.total_formations || 0}</div>
                        {user.last_login && (
                          <div className="text-xs text-gray-500">
                            Last: {new Date(user.last_login).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
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

        {filteredUsers.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your search filters'
                : 'Get started by creating your first user'
              }
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
