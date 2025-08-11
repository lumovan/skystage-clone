/**
 * Formation Management Admin Page
 * Manage all formations with export capabilities
 */

"use client";

import { useState, useEffect } from 'react';
import {
  Download,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Grid,
  List,
  ExternalLink,
  Upload,
  Play,
  Settings,
  FileText,
  Package
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import FormationViewer3D from '@/components/FormationViewer3D';

interface Formation {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail_url: string;
  drone_count: number;
  duration: number;
  price: number;
  created_by: string;
  is_public: boolean;
  tags: string;
  created_at: string;
  creator_name?: string;
}

interface ExportFormat {
  id: string;
  name: string;
  description: string;
  extensions: string[];
  features: string[];
}

export default function FormationsAdminPage() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFormations, setSelectedFormations] = useState<string[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewFormation, setPreviewFormation] = useState<Formation | null>(null);
  const [exportFormats, setExportFormats] = useState<ExportFormat[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadFormations();
    loadExportFormats();
  }, []);

  const loadFormations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/formations');
      const data = await response.json();

      if (data.success) {
        setFormations(data.formations || []);

        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(data.formations?.map((f: Formation) => f.category) || [])
        ).filter(Boolean);
        setCategories(uniqueCategories as string[]);
      }
    } catch (error) {
      console.error('Failed to load formations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExportFormats = async () => {
    try {
      const response = await fetch('/api/formations/export');
      const data = await response.json();

      if (data.success) {
        setExportFormats(data.formats || []);
      }
    } catch (error) {
      console.error('Failed to load export formats:', error);
    }
  };

  const exportFormation = async (formationId: string, format: string, options: unknown = {}) => {
    try {
      setExportLoading(true);

      const response = await fetch('/api/formations/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          formationId,
          format,
          options
        })
      });

      if (response.ok) {
        // Get filename from response headers
        const contentDisposition = response.headers.get('content-disposition');
        const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || `formation_${format}.zip`;

        // Download file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        alert('Formation exported successfully!');
      } else {
        const errorData = await response.json();
        alert(`Export failed: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed: Network error');
    } finally {
      setExportLoading(false);
    }
  };

  const deleteFormation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this formation?')) return;

    try {
      const response = await fetch(`/api/formations/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setFormations(prev => prev.filter(f => f.id !== id));
        alert('Formation deleted successfully');
      } else {
        alert('Failed to delete formation');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Delete failed: Network error');
    }
  };

  const toggleFormationSelection = (id: string) => {
    setSelectedFormations(prev =>
      prev.includes(id)
        ? prev.filter(fId => fId !== id)
        : [...prev, id]
    );
  };

  const selectAllFormations = () => {
    if (selectedFormations.length === filteredFormations.length) {
      setSelectedFormations([]);
    } else {
      setSelectedFormations(filteredFormations.map(f => f.id));
    }
  };

  const filteredFormations = formations.filter(formation => {
    const matchesSearch = formation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         formation.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || formation.category === selectedCategory;

    return matchesSearch && matchesCategory;
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
            <h1 className="text-3xl font-bold text-gray-900">Formation Management</h1>
            <p className="mt-2 text-gray-600">
              Manage and export drone formations
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowExportModal(true)}
              disabled={selectedFormations.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              <span>Export Selected</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Formations</p>
                <p className="text-2xl font-semibold text-gray-900">{formations.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Grid className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-semibold text-gray-900">{categories.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Public</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formations.filter(f => f.is_public).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Download className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Selected</p>
                <p className="text-2xl font-semibold text-gray-900">{selectedFormations.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search formations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={selectAllFormations}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                {selectedFormations.length === filteredFormations.length ? 'Deselect All' : 'Select All'}
              </button>

              <div className="flex border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Formations */}
        <div className="bg-white rounded-lg shadow">
          {filteredFormations.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No formations found</h3>
              <p className="text-gray-600">
                {searchTerm || selectedCategory
                  ? 'Try adjusting your search filters'
                  : 'Start by syncing formations from Skystage'
                }
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredFormations.map((formation) => (
                  <div key={formation.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative">
                      {formation.thumbnail_url ? (
                        <img
                          src={formation.thumbnail_url}
                          alt={formation.name}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                          <Package className="h-12 w-12 text-gray-400" />
                        </div>
                      )}

                      <div className="absolute top-2 left-2">
                        <input
                          type="checkbox"
                          checked={selectedFormations.includes(formation.id)}
                          onChange={() => toggleFormationSelection(formation.id)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                      </div>

                      <div className="absolute top-2 right-2 flex space-x-1">
                        <button
                          onClick={() => {
                            setPreviewFormation(formation);
                            setShowPreviewModal(true);
                          }}
                          className="p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-75"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1 truncate">{formation.name}</h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{formation.description}</p>

                      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                        <span>{formation.drone_count} drones</span>
                        <span>{formation.duration}s</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          {formation.category}
                        </span>

                        <div className="flex space-x-1">
                          <button
                            onClick={() => exportFormation(formation.id, 'json')}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="Quick export to JSON"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteFormation(formation.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Delete formation"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedFormations.length === filteredFormations.length}
                        onChange={selectAllFormations}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Drones
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredFormations.map((formation) => (
                    <tr key={formation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedFormations.includes(formation.id)}
                          onChange={() => toggleFormationSelection(formation.id)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {formation.thumbnail_url ? (
                            <img
                              src={formation.thumbnail_url}
                              alt={formation.name}
                              className="h-10 w-10 rounded object-cover mr-4"
                            />
                          ) : (
                            <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center mr-4">
                              <Package className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{formation.name}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{formation.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          {formation.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formation.drone_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formation.duration}s
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(formation.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setPreviewFormation(formation);
                              setShowPreviewModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => exportFormation(formation.id, 'json')}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteFormation(formation.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Export Formations</h2>
                <p className="text-gray-600 mt-1">
                  Export {selectedFormations.length} selected formation(s) to various formats
                </p>
              </div>

              <div className="p-6 space-y-6">
                {exportFormats.map((format) => (
                  <div key={format.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{format.name}</h3>
                      <button
                        onClick={() => {
                          selectedFormations.forEach(id =>
                            exportFormation(id, format.id)
                          );
                        }}
                        disabled={exportLoading}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        Export
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{format.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {format.features.map((feature) => (
                        <span key={feature} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreviewModal && previewFormation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{previewFormation.name}</h2>
                    <p className="text-gray-600">{previewFormation.description}</p>
                  </div>
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  {/* 3D Preview would go here */}
                  <div className="bg-gray-900 rounded-lg h-96 flex items-center justify-center">
                    <p className="text-white">3D Formation Preview</p>
                    <p className="text-gray-400 text-sm ml-2">(Coming soon)</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Drones:</span>
                    <span className="ml-2 font-medium">{previewFormation.drone_count}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <span className="ml-2 font-medium">{previewFormation.duration}s</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Category:</span>
                    <span className="ml-2 font-medium">{previewFormation.category}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <span className="ml-2 font-medium">
                      {new Date(previewFormation.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
