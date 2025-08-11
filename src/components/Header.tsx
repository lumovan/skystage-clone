'use client';

import Link from "next/link";
import { useState, useEffect } from "react";

interface User {
  id: string;
  email: string;
  full_name?: string;
  user_type: string;
  is_verified: boolean;
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { $1 }, []);

  const checkAuthStatus = async () => {
    try {
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
        if (data.success) {
          setUser(data.data);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
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

      setUser(null);
      setShowUserMenu(false);
      // Optionally redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-12 py-3 h-[70px]">
        {/* Local SkyStage Logo */}
        <Link href="/" className="flex items-center">
          <img
            src="/assets/logos/skystage-logo.svg"
            alt="SkyStage Home"
            className="h-12 w-auto"
          />
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center space-x-6">
          <Link href="/book-show" className="text-gray-600 hover:text-gray-900 transition-colors font-normal text-base">
            Book a show
          </Link>
          <Link href="/discover" className="text-gray-600 hover:text-gray-900 transition-colors font-normal text-base">
            Discover
          </Link>
          <Link href="/help" className="text-gray-600 hover:text-gray-900 transition-colors font-normal text-base">
            Help
          </Link>

          {/* Development Admin Link */}
          {process.env.NODE_ENV === 'development' && (
            <Link href="/admin" className="text-orange-600 hover:text-orange-700 transition-colors font-medium text-base border border-orange-200 px-3 py-1 rounded-md bg-orange-50">
              Admin Panel
            </Link>
          )}

          <div className="w-px h-4 bg-black"></div>

          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {user.full_name || user.email}</span>
              {user.user_type === 'admin' && (
                <Link href="/admin" className="text-blue-600 hover:text-blue-700 font-medium">
                  Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-gray-600 hover:text-gray-900 transition-colors font-normal text-base">
                Log in
              </Link>
              <Link href="/signup" className="text-gray-600 hover:text-gray-900 transition-colors font-normal text-base">
                Sign up
              </Link>
              {/* Development Admin Login */}
              {process.env.NODE_ENV === 'development' && (
                <Link href="/admin/login" className="text-purple-600 hover:text-purple-700 transition-colors font-medium text-sm">
                  Admin Login
                </Link>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
