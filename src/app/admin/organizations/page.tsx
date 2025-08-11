/**
 * Organizations Management Admin Page
 * Manage companies, teams, and organizational structures
 */

"use client";

import { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Crown,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Activity,
  Download,
  Upload,
  Eye,
  Settings,
  UserPlus,
  Shield,
  Globe,
  CreditCard,
  TrendingUp
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  industry?: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  logo_url?: string;
  subscription_plan: 'free' | 'basic' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'inactive' | 'trial' | 'expired';
  member_count: number;
  admin_count: number;
  total_formations: number;
  total_shows: number;
  monthly_revenue: number;
  created_at: string;
  updated_at: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
}

interface OrganizationStats {
  total: number;
  active: number;
  trial: number;
  expired: number;
  total_members: number;
  total_revenue: number;
  by_plan: Record<string, number>;
  by_size: Record<string, number>;
}

export default function OrganizationsAdminPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [stats, setStats] = useState<OrganizationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSize, setFilterSize] = useState('all');
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadOrganizations();
    loadStats();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      // Simulated API call - replace with actual endpoint
      const mockOrganizations: Organization[] = [
        {
          id: '1',
          name: 'DroneWorks Studios',
          slug: 'droneworks-studios',
          description: 'Professional drone light show production company',
          industry: 'Entertainment',
          size: 'medium',
          website: 'https://droneworks.com',
          email: 'contact@droneworks.com',
          phone: '+1 555-0123',
          address: 'Los Angeles, CA',
          subscription_plan: 'pro',
          subscription_status: 'active',
          member_count: 15,
          admin_count: 3,
          total_formations: 125,
          total_shows: 45,
          monthly_revenue: 2500,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-03-20T15:30:00Z',
          owner: {
            id: 'user1',
            name: 'John Smith',
            email: 'john@droneworks.com'
          }
        },
        {
          id: '2',
          name: 'SkyArt Collective',
          slug: 'skyart-collective',
          description: 'Artist collective specializing in aerial formations',
          industry: 'Arts',
          size: 'small',
          website: 'https://skyart.co',
          email: 'hello@skyart.co',
          subscription_plan: 'basic',
          subscription_status: 'active',
          member_count: 8,
          admin_count: 2,
          total_formations: 67,
          total_shows: 23,
          monthly_revenue: 890,
          created_at: '2024-02-01T09:15:00Z',
          updated_at: '2024-03-18T11:45:00Z',
          owner: {
            id: 'user2',
            name: 'Sarah Johnson',
            email: 'sarah@skyart.co'
          }
        }
      ];

      setOrganizations(mockOrganizations);
    } catch (error) {
      console.error('Failed to load organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const mockStats: OrganizationStats = {
        total: 24,
        active: 21,
        trial: 5,
        expired: 3,
        total_members: 187,
        total_revenue: 45780,
        by_plan: {
          free: 8,
          basic: 7,
          pro: 6,
          enterprise: 3
        },
        by_size: {
          startup: 5,
          small: 8,
          medium: 7,
          large: 3,
          enterprise: 1
        }
      };

      setStats(mockStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const toggleOrgSelection = (orgId: string) => {
    setSelectedOrgs(prev =>
      prev.includes(orgId)
        ? prev.filter(id => id !== orgId)
        : [...prev, orgId]
    );
  };

  const selectAllOrgs = () => {
    if (selectedOrgs.length === filteredOrganizations.length) {
      setSelectedOrgs([]);
    } else {
      setSelectedOrgs(filteredOrganizations.map(org => org.id));
    }
  };

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.industry?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPlan = filterPlan === 'all' || org.subscription_plan === filterPlan;
    const matchesStatus = filterStatus === 'all' || org.subscription_status === filterStatus;
    const matchesSize = filterSize === 'all' || org.size === filterSize;

    return matchesSearch && matchesPlan && matchesStatus && matchesSize;
  });

  const getPlanBadge = (plan: string) => {
    const colors = {
      free: 'bg-gray-100 text-gray-800',
      basic: 'bg-blue-100 text-blue-800',
      pro: 'bg-green-100 text-green-800',
      enterprise: 'bg-purple-100 text-purple-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[plan as keyof typeof colors]}`}>
        {plan.charAt(0).toUpperCase() + plan.slice(1)}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      trial: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-gray-100 text-gray-800',
      expired: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getSizeBadge = (size: string) => {
    const labels = {
      startup: 'Startup (1-10)',
      small: 'Small (11-50)',
      medium: 'Medium (51-200)',
      large: 'Large (201-1000)',
      enterprise: 'Enterprise (1000+)'
    };

    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700">
        {labels[size as keyof typeof labels] || size}
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
            <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
            <p className="mt-2 text-gray-600">
              Manage companies, teams, and organizational accounts
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {selectedOrgs.length > 0 && (
              <span className="text-sm text-gray-600">
                {selectedOrgs.length} selected
              </span>
            )}

            <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>New Organization</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Organizations</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Members</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total_members}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-semibold text-gray-900">${stats.total_revenue.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Trial</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.trial}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>

            <select
              value={filterSize}
              onChange={(e) => setFilterSize(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Sizes</option>
              <option value="startup">Startup</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>

        {/* Organizations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrganizations.map((org) => (
            <div key={org.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedOrgs.includes(org.id)}
                      onChange={() => toggleOrgSelection(org.id)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{org.name}</h3>
                      <p className="text-sm text-gray-500">{org.industry}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {getPlanBadge(org.subscription_plan)}
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <MoreVertical className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                {org.description && (
                  <p className="mt-3 text-sm text-gray-600 line-clamp-2">{org.description}</p>
                )}
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Owner */}
                <div className="flex items-center space-x-3">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{org.owner.name}</p>
                    <p className="text-xs text-gray-500">{org.owner.email}</p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2">
                  {org.website && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Globe className="h-4 w-4" />
                      <span className="truncate">{org.website}</span>
                    </div>
                  )}
                  {org.email && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{org.email}</span>
                    </div>
                  )}
                  {org.address && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{org.address}</span>
                    </div>
                  )}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-lg font-semibold text-gray-900">{org.member_count}</p>
                    <p className="text-xs text-gray-500">Members</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-lg font-semibold text-gray-900">{org.total_formations}</p>
                    <p className="text-xs text-gray-500">Formations</p>
                  </div>
                </div>

                {/* Status & Size */}
                <div className="flex items-center justify-between">
                  {getStatusBadge(org.subscription_status)}
                  {getSizeBadge(org.size)}
                </div>

                {/* Revenue */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span className="text-sm text-gray-600">Monthly Revenue</span>
                  <span className="text-sm font-semibold text-green-600">${org.monthly_revenue.toLocaleString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  Created {new Date(org.created_at).toLocaleDateString()}
                </span>

                <div className="flex space-x-2">
                  <button className="p-2 text-blue-600 hover:bg-blue-100 rounded">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-green-600 hover:bg-green-100 rounded">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-purple-600 hover:bg-purple-100 rounded">
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredOrganizations.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations found</h3>
            <p className="text-gray-600">
              {searchTerm || filterPlan !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your search filters'
                : 'Get started by creating your first organization'
              }
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
