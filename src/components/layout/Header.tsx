"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Menu,
  X,
  ChevronDown,
  User,
  LogOut,
  Settings,
  BookOpen,
  Sparkles,
  Calendar,
  Search,
  Bell,
  ShoppingCart,
  Grid,
  Users,
  Home,
  Compass,
  HelpCircle
} from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  full_name?: string;
  user_type: string;
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth-token') || localStorage.getItem('auth-token-dev');
        if (!token) return;

        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setUser(data.data);
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };

    checkAuth();

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('auth-token');
      localStorage.removeItem('auth-token-dev');
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Discover', href: '/discover', icon: Compass },
    { name: 'Show Builder', href: '/show-builder', icon: Sparkles },
    { name: 'Book Show', href: '/book-show', icon: Calendar },
    { name: 'Help', href: '/help', icon: HelpCircle },
  ];

  const userNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Grid },
    { name: 'My Shows', href: '/my-shows', icon: BookOpen },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
    }`}>
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <span className={`font-bold text-xl ${scrolled ? 'text-gray-900' : 'text-white'}`}>
                SkyStage
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? scrolled
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-white bg-white/20'
                      : scrolled
                        ? 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Search Button */}
            <button
              className={`p-2 rounded-lg transition-colors ${
                scrolled
                  ? 'text-gray-600 hover:bg-gray-100'
                  : 'text-white/90 hover:bg-white/10'
              }`}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Notifications */}
            {user && (
              <button
                className={`relative p-2 rounded-lg transition-colors ${
                  scrolled
                    ? 'text-gray-600 hover:bg-gray-100'
                    : 'text-white/90 hover:bg-white/10'
                }`}
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
            )}

            {/* User Menu or Login */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    scrolled
                      ? 'text-gray-700 hover:bg-gray-100'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user.full_name ? user.full_name[0].toUpperCase() : user.email[0].toUpperCase()}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {/* User Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50">
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-semibold text-gray-900">
                        {user.full_name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {user.user_type}
                      </span>
                    </div>

                    {userNavigation.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}

                    {user.user_type === 'admin' && (
                      <>
                        <div className="border-t my-2"></div>
                        <Link
                          href="/admin"
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4" />
                          <span>Admin Dashboard</span>
                        </Link>
                      </>
                    )}

                    <div className="border-t mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    scrolled
                      ? 'text-gray-700 hover:bg-gray-100'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 rounded-lg transition-colors ${
                scrolled
                  ? 'text-gray-600 hover:bg-gray-100'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white rounded-lg shadow-lg mt-2 py-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium ${
                    isActive
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {user && (
              <>
                <div className="border-t my-2"></div>
                {userNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center space-x-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
