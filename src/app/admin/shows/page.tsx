/**
 * Shows Management Admin Page
 * Comprehensive drone show administration interface
 */

"use client";

import { useState, useEffect } from 'react';
import {
  Bookmark,
  Calendar,
  Clock,
  MapPin,
  Users,
  Plane,
  Play,
  Pause,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Search,
  Filter,
  Plus,
  Star,
  DollarSign,
  Music,
  Palette,
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle,
  Timer,
  Target,
  Zap
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Show {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  event_date: string;
  duration: number; // in minutes
  location: {
    name: string;
    address: string;
    coordinates?: { lat: number; lng: number };
  };
  client: {
    id: string;
    name: string;
    email: string;
    company?: string;
  };
  formations: Array<{
    id: string;
    name: string;
    duration: number;
    drone_count: number;
    order: number;
  }>;
  total_drones: number;
  estimated_cost: number;
  actual_cost?: number;
  music_file?: string;
  weather_requirements?: string;
  special_requirements?: string;
  crew_assigned: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  equipment_checklist: Array<{
    item: string;
    checked: boolean;
    notes?: string;
  }>;
  safety_clearance: boolean;
  rehearsal_date?: string;
  created_at: string;
  updated_at: string;
  created_by: {
    id: string;
    name: string;
  };
  tags: string[];
  rating?: number;
  feedback?: string;
}

interface ShowStats {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  in_progress: number;
  draft: number;
  total_revenue: number;
  avg_duration: number;
  avg_drones: number;
  monthly_shows: number;
}

export default function ShowsAdminPage() {
  const [shows, setShows] = useState<Show[]>([]);
  const [stats, setStats] = useState<ShowStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('event_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedShows, setSelectedShows] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'calendar'>('grid');

  useEffect(() => {
    loadShows();
    loadStats();
  }, []);

  const loadShows = async () => {
    try {
      setLoading(true);
      // Simulated API call - replace with actual endpoint
      const mockShows: Show[] = [
        {
          id: '1',
          title: 'New Year Celebration Spectacular',
          description: 'Grand drone light show for New Year celebration with 500 drones',
          status: 'scheduled',
          event_date: '2024-12-31T23:45:00Z',
          duration: 15,
          location: {
            name: 'Central Park',
            address: 'New York, NY 10019',
            coordinates: { lat: 40.7829, lng: -73.9654 }
          },
          client: {
            id: 'client1',
            name: 'NYC Events',
            email: 'contact@nycevents.com',
            company: 'NYC Events Corporation'
          },
          formations: [
            { id: 'f1', name: 'Countdown Numbers', duration: 5, drone_count: 500, order: 1 },
            { id: 'f2', name: 'Fireworks Burst', duration: 3, drone_count: 500, order: 2 },
            { id: 'f3', name: 'Happy New Year', duration: 7, drone_count: 500, order: 3 }
          ],
          total_drones: 500,
          estimated_cost: 75000,
          music_file: 'new_year_symphony.mp3',
          weather_requirements: 'Wind speed < 15mph, No precipitation',
          special_requirements: 'FAA clearance required, Backup power systems',
          crew_assigned: [
            { id: 'crew1', name: 'Mike Johnson', role: 'Flight Director' },
            { id: 'crew2', name: 'Sarah Chen', role: 'Safety Officer' },
            { id: 'crew3', name: 'David Wilson', role: 'Technical Lead' }
          ],
          equipment_checklist: [
            { item: 'Drones', checked: true },
            { item: 'Ground Control Station', checked: true },
            { item: 'Backup Batteries', checked: false },
            { item: 'Weather Station', checked: true }
          ],
          safety_clearance: true,
          rehearsal_date: '2024-12-30T14:00:00Z',
          created_at: '2024-10-15T09:00:00Z',
          updated_at: '2024-11-20T16:30:00Z',
          created_by: { id: 'admin1', name: 'John Smith' },
          tags: ['celebration', 'large-scale', 'holiday'],
          rating: 5
        },
        {
          id: '2',
          title: 'Corporate Anniversary Show',
          description: 'Elegant drone formation for company 50th anniversary',
          status: 'completed',
          event_date: '2024-11-15T19:00:00Z',
          duration: 8,
          location: {
            name: 'Company Headquarters',
            address: 'San Francisco, CA 94105'
          },
          client: {
            id: 'client2',
            name: 'Tech Corp',
            email: 'events@techcorp.com',
            company: 'Tech Corp Inc.'
          },
          formations: [
            { id: 'f4', name: 'Company Logo', duration: 4, drone_count: 150, order: 1 },
            { id: 'f5', name: 'Anniversary Numbers', duration: 4, drone_count: 150, order: 2 }
          ],
          total_drones: 150,
          estimated_cost: 25000,
          actual_cost: 23500,
          crew_assigned: [
            { id: 'crew4', name: 'Lisa Park', role: 'Flight Director' },
            { id: 'crew5', name: 'Tom Davis', role: 'Safety Officer' }
          ],
          equipment_checklist: [
            { item: 'Drones', checked: true },
            { item: 'Ground Control Station', checked: true },
            { item: 'Backup Batteries', checked: true }
          ],
          safety_clearance: true,
          created_at: '2024-09-20T11:30:00Z',
          updated_at: '2024-11-16T08:15:00Z',
          created_by: { id: 'admin2', name: 'Sarah Johnson' },
          tags: ['corporate', 'anniversary', 'indoor'],
          rating: 4,
          feedback: 'Excellent execution, client very satisfied'
        }
      ];

      setShows(mockShows);
    } catch (error) {
      console.error('Failed to load shows:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const mockStats: ShowStats = {
        total: 45,
        scheduled: 8,
        completed: 32,
        cancelled: 3,
        in_progress: 1,
        draft: 1,
        total_revenue: 890000,
        avg_duration: 12.5,
        avg_drones: 275,
        monthly_shows: 6
      };

      setStats(mockStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: Edit },
      scheduled: { color: 'bg-blue-100 text-blue-800', icon: Calendar },
      in_progress: { color: 'bg-yellow-100 text-yellow-800', icon: Play },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const IconComponent = config?.icon || AlertCircle;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config?.color || 'bg-gray-100 text-gray-800'}`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const filteredShows = shows.filter(show => {
    const matchesSearch =
      show.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      show.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      show.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      show.location.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || show.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

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
            <h1 className="text-3xl font-bold text-gray-900">Shows Management</h1>
            <p className="mt-2 text-gray-600">
              Manage drone shows, schedules, and production workflows
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {selectedShows.length > 0 && (
              <span className="text-sm text-gray-600">
                {selectedShows.length} selected
              </span>
            )}

            <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>

            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              <span>New Show</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Bookmark className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Shows</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Scheduled</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.scheduled}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.total_revenue)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Plane className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Drones</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.avg_drones}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and View Controls */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search shows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <div className="grid grid-cols-2 gap-1 w-4 h-4">
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                </div>
              </button>

              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <div className="space-y-1 w-4 h-4">
                  <div className="bg-current h-0.5 rounded"></div>
                  <div className="bg-current h-0.5 rounded"></div>
                  <div className="bg-current h-0.5 rounded"></div>
                  <div className="bg-current h-0.5 rounded"></div>
                </div>
              </button>

              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-lg ${viewMode === 'calendar' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Calendar className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Shows Display */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredShows.map((show) => (
              <div key={show.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{show.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{show.client.name}</p>
                    </div>
                    {getStatusBadge(show.status)}
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{show.description}</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* Event Details */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(show.event_date).toLocaleDateString()}</span>
                      <Clock className="h-4 w-4 ml-2" />
                      <span>{formatDuration(show.duration)}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{show.location.name}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Plane className="h-4 w-4" />
                      <span>{show.total_drones} drones</span>
                      <Target className="h-4 w-4 ml-2" />
                      <span>{show.formations.length} formations</span>
                    </div>
                  </div>

                  {/* Progress Indicators */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Equipment Checklist</span>
                      <span>{show.equipment_checklist.filter(item => item.checked).length}/{show.equipment_checklist.length}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(show.equipment_checklist.filter(item => item.checked).length / show.equipment_checklist.length) * 100}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Crew */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Crew ({show.crew_assigned.length})</p>
                    <div className="flex -space-x-2">
                      {show.crew_assigned.slice(0, 3).map((crew, index) => (
                        <div
                          key={crew.id}
                          className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                          title={`${crew.name} - ${crew.role}`}
                        >
                          {crew.name.charAt(0)}
                        </div>
                      ))}
                      {show.crew_assigned.length > 3 && (
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white">
                          +{show.crew_assigned.length - 3}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cost */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <span className="text-sm text-gray-600">
                      {show.actual_cost ? 'Actual Cost' : 'Estimated Cost'}
                    </span>
                    <span className="text-sm font-semibold text-green-600">
                      {formatCurrency(show.actual_cost || show.estimated_cost)}
                    </span>
                  </div>

                  {/* Rating */}
                  {show.rating && (
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${star <= show.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                        />
                      ))}
                      <span className="text-sm text-gray-600 ml-2">{show.rating}/5</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                  <div className="flex space-x-1">
                    {show.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        {tag}
                      </span>
                    ))}
                  </div>

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
        )}

        {filteredShows.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Bookmark className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No shows found</h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search filters'
                : 'Get started by creating your first drone show'
              }
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
