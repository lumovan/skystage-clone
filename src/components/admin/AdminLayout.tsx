/**
 * Enhanced Admin Layout Component
 * Enterprise-level CMS interface for complete system management
 */

"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Bookmark,
  Plane,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  User,
  Cloud,
  Building2,
  Palette,
  Globe,
  FileText,
  Upload,
  Download,
  Code,
  Database,
  Shield,
  Mail,
  CreditCard,
  Zap,
  ChevronDown,
  ChevronRight,
  Loader2
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface User {
  id: string;
  email: string;
  full_name?: string;
  user_type: string;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  current: boolean;
  badge?: string;
  children?: NavigationItem[];
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['content', 'system']);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => { $1 }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      setAuthError(false);

      // In dev, also check localStorage as a fallback
      const headers: HeadersInit = {};
      if (process.env.NODE_ENV !== 'production') {
        const devToken = localStorage.getItem('auth-token-dev');
        if (devToken) {
          headers['Authorization'] = `Bearer ${devToken}`;
        }
      }

      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        headers
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.user_type === 'admin') {
          setUser(data.data);
        } else {
          setAuthError(true);
        }
      } else {
        setAuthError(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      // Clear localStorage in dev
      if (process.env.NODE_ENV !== 'production') {
        localStorage.removeItem('auth-token-dev');
      }

      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
      router.push('/');
    }
  };

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionName)
        ? prev.filter(s => s !== sectionName)
        : [...prev, sectionName]
    );
  };

  const navigationSections = [
    {
      name: 'Overview',
      items: [
        {
          name: 'Dashboard',
          href: '/admin',
          icon: LayoutDashboard,
          current: pathname === '/admin'
        },
        {
          name: 'Analytics',
          href: '/admin/analytics',
          icon: BarChart3,
          current: pathname.startsWith('/admin/analytics')
        }
      ]
    },
    {
      name: 'User Management',
      key: 'users',
      items: [
        {
          name: 'All Users',
          href: '/admin/users',
          icon: Users,
          current: pathname === '/admin/users'
        },
        {
          name: 'Organizations',
          href: '/admin/organizations',
          icon: Building2,
          current: pathname.startsWith('/admin/organizations')
        },
        {
          name: 'Roles & Permissions',
          href: '/admin/roles',
          icon: Shield,
          current: pathname.startsWith('/admin/roles')
        },
        {
          name: 'Account Settings',
          href: '/admin/accounts',
          icon: CreditCard,
          current: pathname.startsWith('/admin/accounts')
        }
      ]
    },
    {
      name: 'Content Management',
      key: 'content',
      items: [
        {
          name: 'Formations',
          href: '/admin/formations',
          icon: Plane,
          current: pathname.startsWith('/admin/formations')
        },
        {
          name: 'Shows Management',
          href: '/admin/shows',
          icon: Bookmark,
          current: pathname.startsWith('/admin/shows')
        },
        {
          name: 'Pages & Content',
          href: '/admin/pages',
          icon: FileText,
          current: pathname.startsWith('/admin/pages')
        },
        {
          name: 'Media Library',
          href: '/admin/media',
          icon: Upload,
          current: pathname.startsWith('/admin/media')
        }
      ]
    },
    {
      name: 'Site Management',
      key: 'site',
      items: [
        {
          name: 'Site Settings',
          href: '/admin/site-settings',
          icon: Globe,
          current: pathname.startsWith('/admin/site-settings')
        },
        {
          name: 'Design System',
          href: '/admin/design-system',
          icon: Palette,
          current: pathname.startsWith('/admin/design-system')
        },
        {
          name: 'Navigation & Menus',
          href: '/admin/navigation',
          icon: Menu,
          current: pathname.startsWith('/admin/navigation')
        },
        {
          name: 'Email Templates',
          href: '/admin/email-templates',
          icon: Mail,
          current: pathname.startsWith('/admin/email-templates')
        }
      ]
    },
    {
      name: 'Integration & Data',
      key: 'integration',
      items: [
        {
          name: 'Skystage Sync',
          href: '/admin/skystage',
          icon: Cloud,
          current: pathname.startsWith('/admin/skystage'),
          badge: 'New'
        },
        {
          name: 'Import Hub',
          href: '/admin/import',
          icon: Download,
          current: pathname.startsWith('/admin/import')
        },
        {
          name: 'Export Center',
          href: '/admin/export',
          icon: Upload,
          current: pathname.startsWith('/admin/export')
        },
        {
          name: 'API Management',
          href: '/admin/api',
          icon: Code,
          current: pathname.startsWith('/admin/api')
        },
        {
          name: 'Database',
          href: '/admin/database',
          icon: Database,
          current: pathname.startsWith('/admin/database')
        }
      ]
    },
    {
      name: 'System',
      key: 'system',
      items: [
        {
          name: 'System Settings',
          href: '/admin/settings',
          icon: Settings,
          current: pathname.startsWith('/admin/settings')
        },
        {
          name: 'Automation',
          href: '/admin/automation',
          icon: Zap,
          current: pathname.startsWith('/admin/automation')
        },
        {
          name: 'Logs & Monitoring',
          href: '/admin/logs',
          icon: BarChart3,
          current: pathname.startsWith('/admin/logs')
        }
      ]
    }
  ];

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Show auth error state
  if (authError || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You need admin privileges to access this area.
            </p>
            <div className="space-y-3">
              <Link
                href="/login?redirect=/admin"
                className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                Login as Admin
              </Link>
              <Link
                href="/"
                className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                Go to Homepage
              </Link>
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Demo Admin:</strong> admin@skystage.local / admin123
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center flex-shrink-0 px-4 mb-6">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <div className="ml-3">
            <h1 className="text-xl font-bold text-gray-900">SkyStage</h1>
            <p className="text-xs text-gray-500">Enterprise CMS</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 space-y-2">
          {navigationSections.map((section) => (
            <div key={section.name} className="space-y-1">
              {/* Section Header */}
              {section.key ? (
                <button
                  onClick={() => toggleSection(section.key)}
                  className="w-full flex items-center justify-between px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  <span>{section.name}</span>
                  {expandedSections.includes(section.key) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              ) : (
                <div className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {section.name}
                </div>
              )}

              {/* Section Items */}
              {(!section.key || expandedSections.includes(section.key)) && (
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                        item.current
                          ? 'bg-blue-100 text-blue-900 border-r-2 border-blue-500'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <div className="flex items-center">
                        <item.icon className={`mr-3 h-5 w-5 ${
                          item.current ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                        }`} />
                        {item.name}
                      </div>
                      {item.badge && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* User Profile Section */}
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
        <div className="flex items-center w-full">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-700 truncate">
              {user.full_name || user.email}
            </p>
            <p className="text-xs text-gray-500 capitalize">{user.user_type} Admin</p>
          </div>
          <button
            onClick={handleLogout}
            className="ml-2 p-1 rounded-full text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />

        <div className="relative flex-1 flex flex-col max-w-xs w-full">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <SidebarContent />
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Top header */}
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-50">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Page header for desktop */}
        <div className="hidden md:block bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <div className="flex items-center space-x-3">
                  <h2 className="text-lg font-medium text-gray-900">Enterprise Admin</h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    CMS v2.0
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Quick Actions */}
                <div className="flex items-center space-x-2">
                  <Link
                    href="/admin/import"
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Import
                  </Link>
                  <Link
                    href="/admin/export"
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Export
                  </Link>
                </div>

                {/* Notifications */}
                <button className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
                </button>

                {/* User Menu */}
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="hidden lg:block">
                    <span className="text-sm font-medium text-gray-700">
                      {user.full_name || user.email}
                    </span>
                    <p className="text-xs text-gray-500">Administrator</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
