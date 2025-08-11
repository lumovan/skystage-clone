/**
 * Import Hub Admin Page
 * Comprehensive data import center for all system entities
 */

"use client";

import { useState, useEffect } from 'react';
import {
  Download,
  Upload,
  FileText,
  Users,
  Plane,
  Building2,
  Calendar,
  Database,
  Cloud,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Trash2,
  Play,
  Pause,
  BarChart3,
  Settings,
  Info,
  Clock,
  Target,
  Zap
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

interface ImportTemplate {
  id: string;
  name: string;
  description: string;
  entity_type: 'users' | 'formations' | 'organizations' | 'shows' | 'bookings';
  file_format: 'csv' | 'json' | 'xlsx' | 'xml';
  required_fields: string[];
  optional_fields: string[];
  sample_url: string;
  validation_rules: string[];
  icon: any;
}

interface ImportJob {
  id: string;
  name: string;
  entity_type: string;
  file_name: string;
  file_size: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  total_records: number;
  processed_records: number;
  successful_records: number;
  failed_records: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
    value: string;
  }>;
  started_at?: string;
  completed_at?: string;
  created_by: string;
  created_at: string;
}

interface ImportStats {
  total_imports: number;
  successful_imports: number;
  failed_imports: number;
  processing_imports: number;
  total_records_imported: number;
  recent_activity: Array<{
    type: string;
    entity: string;
    count: number;
    timestamp: string;
  }>;
}

export default function ImportHubPage() {
  const [templates, setTemplates] = useState<ImportTemplate[]>([]);
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedTemplate, setSelectedTemplate] = useState<ImportTemplate | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadImportData();
  }, []);

  const loadImportData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadTemplates(),
        loadJobs(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Failed to load import data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    const mockTemplates: ImportTemplate[] = [
      {
        id: 'users-csv',
        name: 'Users (CSV)',
        description: 'Import user accounts from CSV file',
        entity_type: 'users',
        file_format: 'csv',
        required_fields: ['email', 'full_name', 'user_type'],
        optional_fields: ['company_name', 'phone', 'location'],
        sample_url: '/samples/users-sample.csv',
        validation_rules: ['Email must be unique', 'User type must be valid'],
        icon: Users
      },
      {
        id: 'formations-json',
        name: 'Formations (JSON)',
        description: 'Import drone formations from JSON format',
        entity_type: 'formations',
        file_format: 'json',
        required_fields: ['name', 'drone_count', 'duration', 'category'],
        optional_fields: ['description', 'tags', 'price', 'formation_data'],
        sample_url: '/samples/formations-sample.json',
        validation_rules: ['Name must be unique', 'Drone count must be positive'],
        icon: Plane
      },
      {
        id: 'organizations-csv',
        name: 'Organizations (CSV)',
        description: 'Import company and organization data',
        entity_type: 'organizations',
        file_format: 'csv',
        required_fields: ['name', 'email', 'owner_email'],
        optional_fields: ['description', 'website', 'phone', 'address'],
        sample_url: '/samples/organizations-sample.csv',
        validation_rules: ['Organization name must be unique', 'Owner email must exist'],
        icon: Building2
      },
      {
        id: 'shows-csv',
        name: 'Shows (CSV)',
        description: 'Import scheduled drone shows',
        entity_type: 'shows',
        file_format: 'csv',
        required_fields: ['title', 'event_date', 'client_email', 'location'],
        optional_fields: ['description', 'duration', 'estimated_cost'],
        sample_url: '/samples/shows-sample.csv',
        validation_rules: ['Event date must be in future', 'Client email must exist'],
        icon: Calendar
      }
    ];
    setTemplates(mockTemplates);
  };

  const loadJobs = async () => {
    const mockJobs: ImportJob[] = [
      {
        id: 'job-1',
        name: 'User Import - December 2024',
        entity_type: 'users',
        file_name: 'users_december_2024.csv',
        file_size: 2048576,
        status: 'completed',
        progress: 100,
        total_records: 1250,
        processed_records: 1250,
        successful_records: 1198,
        failed_records: 52,
        errors: [
          { row: 15, field: 'email', message: 'Invalid email format', value: 'invalid-email' },
          { row: 32, field: 'user_type', message: 'Invalid user type', value: 'invalid' }
        ],
        started_at: '2024-12-01T10:00:00Z',
        completed_at: '2024-12-01T10:15:00Z',
        created_by: 'admin@skystage.com',
        created_at: '2024-12-01T09:55:00Z'
      },
      {
        id: 'job-2',
        name: 'Formation Library Sync',
        entity_type: 'formations',
        file_name: 'formations_library.json',
        file_size: 5242880,
        status: 'processing',
        progress: 65,
        total_records: 850,
        processed_records: 552,
        successful_records: 545,
        failed_records: 7,
        errors: [],
        started_at: '2024-12-01T14:30:00Z',
        created_by: 'admin@skystage.com',
        created_at: '2024-12-01T14:25:00Z'
      }
    ];
    setJobs(mockJobs);
  };

  const loadStats = async () => {
    const mockStats: ImportStats = {
      total_imports: 45,
      successful_imports: 38,
      failed_imports: 4,
      processing_imports: 3,
      total_records_imported: 125000,
      recent_activity: [
        { type: 'import', entity: 'users', count: 1250, timestamp: '2024-12-01T10:15:00Z' },
        { type: 'import', entity: 'formations', count: 75, timestamp: '2024-11-30T16:20:00Z' },
        { type: 'import', entity: 'organizations', count: 25, timestamp: '2024-11-29T09:10:00Z' }
      ]
    };
    setStats(mockStats);
  };

  const handleFileUpload = async (file: File, template: ImportTemplate) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      // Simulate file upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Create new import job
      const newJob: ImportJob = {
        id: `job-${Date.now()}`,
        name: `${template.name} - ${file.name}`,
        entity_type: template.entity_type,
        file_name: file.name,
        file_size: file.size,
        status: 'processing',
        progress: 0,
        total_records: Math.floor(Math.random() * 1000) + 100,
        processed_records: 0,
        successful_records: 0,
        failed_records: 0,
        errors: [],
        started_at: new Date().toISOString(),
        created_by: 'admin@skystage.com',
        created_at: new Date().toISOString()
      };

      setJobs(prev => [newJob, ...prev]);
      setActiveTab('jobs');

      alert('File uploaded successfully! Import job started.');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0] && selectedTemplate) {
      handleFileUpload(e.dataTransfer.files[0], selectedTemplate);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
            <h1 className="text-3xl font-bold text-gray-900">Import Hub</h1>
            <p className="mt-2 text-gray-600">
              Import users, formations, and other data into the system
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              <Download className="h-4 w-4" />
              <span>Templates</span>
            </button>

            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Upload className="h-4 w-4" />
              <span>Quick Import</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Database className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Imports</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total_imports}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Successful</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.successful_imports}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <RefreshCw className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Processing</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.processing_imports}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Records Imported</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total_records_imported.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'upload', label: 'Upload Files', icon: Upload },
              { id: 'jobs', label: 'Import Jobs', icon: BarChart3 },
              { id: 'templates', label: 'Templates', icon: FileText },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Upload Data File</h3>

              {/* Template Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Import Template
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {templates.map((template) => {
                    const IconComponent = template.icon;
                    return (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className={`p-4 border-2 rounded-lg text-left transition-colors ${
                          selectedTemplate?.id === template.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3 mb-2">
                          <IconComponent className="h-6 w-6 text-blue-600" />
                          <span className="font-medium text-gray-900">{template.name}</span>
                        </div>
                        <p className="text-sm text-gray-600">{template.description}</p>
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                            {template.file_format.toUpperCase()}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* File Upload Area */}
              {selectedTemplate && (
                <div className="space-y-4">
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-lg font-medium text-gray-900">
                          Drop your {selectedTemplate.file_format.toUpperCase()} file here
                        </span>
                        <p className="text-sm text-gray-600 mt-2">
                          or click to browse files
                        </p>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          accept={`.${selectedTemplate.file_format}`}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUpload(e.target.files[0], selectedTemplate);
                            }
                          }}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Template Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Template Requirements</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-xs font-medium text-gray-700 mb-2">Required Fields</h5>
                        <ul className="space-y-1">
                          {selectedTemplate.required_fields.map((field) => (
                            <li key={field} className="text-xs text-gray-600 flex items-center">
                              <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                              {field}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h5 className="text-xs font-medium text-gray-700 mb-2">Optional Fields</h5>
                        <ul className="space-y-1">
                          {selectedTemplate.optional_fields.map((field) => (
                            <li key={field} className="text-xs text-gray-600 flex items-center">
                              <Info className="h-3 w-3 text-blue-500 mr-2" />
                              {field}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <a
                        href={selectedTemplate.sample_url}
                        download
                        className="inline-flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download Sample File</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Progress */}
              {uploading && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Uploading...</span>
                    <span className="text-sm text-gray-500">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Import Jobs Tab */}
          {activeTab === 'jobs' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Import Jobs</h3>
                <button
                  onClick={loadJobs}
                  className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="space-y-4">
                {jobs.map((job) => (
                  <div key={job.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        {getStatusIcon(job.status)}
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{job.name}</h4>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span>{job.file_name}</span>
                            <span>•</span>
                            <span>{formatFileSize(job.file_size)}</span>
                            <span>•</span>
                            <span>{job.total_records.toLocaleString()} records</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {getStatusBadge(job.status)}
                        <button className="p-2 text-gray-400 hover:text-gray-600">
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {job.status === 'processing' && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">
                            Processing {job.processed_records.toLocaleString()} of {job.total_records.toLocaleString()} records
                          </span>
                          <span className="text-sm text-gray-500">{job.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Results Summary */}
                    {job.status === 'completed' && (
                      <div className="mt-4 grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-lg font-semibold text-green-700">{job.successful_records.toLocaleString()}</p>
                          <p className="text-xs text-green-600">Successful</p>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <p className="text-lg font-semibold text-red-700">{job.failed_records.toLocaleString()}</p>
                          <p className="text-xs text-red-600">Failed</p>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-lg font-semibold text-blue-700">{((job.successful_records / job.total_records) * 100).toFixed(1)}%</p>
                          <p className="text-xs text-blue-600">Success Rate</p>
                        </div>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                      <span>Started: {job.started_at ? new Date(job.started_at).toLocaleString() : 'Not started'}</span>
                      {job.completed_at && (
                        <span>Completed: {new Date(job.completed_at).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {jobs.length === 0 && (
                <div className="text-center py-12">
                  <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No import jobs found</h3>
                  <p className="text-gray-600">Upload a file to start your first import job</p>
                </div>
              )}
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Import Templates</h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {templates.map((template) => {
                  const IconComponent = template.icon;
                  return (
                    <div key={template.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <IconComponent className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900">{template.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{template.description}</p>

                          <div className="mt-4 space-y-3">
                            <div>
                              <h5 className="text-xs font-medium text-gray-700 mb-2">File Format</h5>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                                {template.file_format.toUpperCase()}
                              </span>
                            </div>

                            <div>
                              <h5 className="text-xs font-medium text-gray-700 mb-2">Required Fields ({template.required_fields.length})</h5>
                              <div className="flex flex-wrap gap-1">
                                {template.required_fields.slice(0, 3).map((field) => (
                                  <span key={field} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                    {field}
                                  </span>
                                ))}
                                {template.required_fields.length > 3 && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                                    +{template.required_fields.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex space-x-3">
                            <a
                              href={template.sample_url}
                              download
                              className="inline-flex items-center space-x-2 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                            >
                              <Download className="h-4 w-4" />
                              <span>Sample</span>
                            </a>

                            <button
                              onClick={() => {
                                setSelectedTemplate(template);
                                setActiveTab('upload');
                              }}
                              className="inline-flex items-center space-x-2 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                            >
                              <Upload className="h-4 w-4" />
                              <span>Use Template</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
