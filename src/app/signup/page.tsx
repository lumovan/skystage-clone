"use client";

import React from 'react';
// Type definitions for better type safety
interface FormationData {
  id: string;
  name: string;
  description: string;
  category: string;
  drone_count: number;
  duration: number;
  thumbnail_url: string;
  file_url: string | null;
  price: number | null;
  created_by: string;
  is_public: boolean;
  tags: string;
  formation_data: string;
  metadata: string;
  source: string;
  source_id: string;
  sync_status: string;
  download_count: number;
  rating: number;
  created_at: string;
  updated_at: string;
}

interface APIResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: string | null;
  message?: string;
}

interface DronePosition {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

interface AdminDashboardData {
  overview: {
    total_users: number;
    total_organizations: number;
    total_formations: number;
    total_bookings: number;
    total_sync_jobs: number;
  };
  users: {
    total: number;
    new_this_week: number;
    new_this_month: number;
    by_type: Array<{ user_type: string; count: number }>;
  };
  formations: {
    total: number;
    by_category: Array<{ category: string; count: number }>;
    most_popular: Array<{ id: string; name: string; downloads: number; rating: number }>;
  };
  bookings: {
    total: number;
    pending: number;
    by_status: Array<{ status: string; count: number }>;
  };
  activity: {
    recent_events: unknown[];
    daily_active_users: number;
  };
}


/**
 * User Registration/Signup Page
 * Allows new users to create accounts
 */

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

// Validation schema
const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  full_name: z.string().min(1, 'Full name is required').max(100),
  user_type: z.enum(['customer', 'operator', 'artist']),
  company_name: z.string().optional(),
  agree_terms: z.boolean().refine(val => val === true, 'You must agree to the terms and conditions')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

function SignupContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      user_type: 'customer'
    }
  });

  const watchUserType = watch('user_type');

  const onSubmit = async (data: SignupForm) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(true);

        // Redirect after a short delay
        setTimeout(() => {
          router.push(redirect);
        }, 2000);
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (error: unknown) {
      console.error('Registration error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Header />
        <div className="pt-[70px] min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Created!</h2>
            <p className="text-gray-600 mb-6">
              Welcome to SkyStage! Your account has been created successfully.
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Redirecting you to your dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="pt-[70px] min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Join SkyStage to design and book amazing drone shows
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white p-8 rounded-lg shadow">
              {error && (
                <Alert className="mb-6 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    type="text"
                    {...register('full_name')}
                    className="mt-1"
                    placeholder="Enter your full name"
                  />
                  {errors.full_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    className="mt-1"
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    {...register('password')}
                    className="mt-1"
                    placeholder="Choose a strong password"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...register('confirmPassword')}
                    className="mt-1"
                    placeholder="Confirm your password"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* User Type */}
                <div>
                  <Label htmlFor="user_type">Account Type</Label>
                  <Select
                    value={watchUserType}
                    onValueChange={(value) => setValue('user_type', value as any)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer - Book drone shows</SelectItem>
                      <SelectItem value="operator">Operator - Provide drone services</SelectItem>
                      <SelectItem value="artist">Artist - Create formations</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.user_type && (
                    <p className="mt-1 text-sm text-red-600">{errors.user_type.message}</p>
                  )}
                </div>

                {/* Company Name (for operators and artists) */}
                {(watchUserType === 'operator' || watchUserType === 'artist') && (
                  <div>
                    <Label htmlFor="company_name">Company Name (Optional)</Label>
                    <Input
                      id="company_name"
                      type="text"
                      {...register('company_name')}
                      className="mt-1"
                      placeholder="Enter your company name"
                    />
                  </div>
                )}

                {/* Terms Agreement */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agree_terms"
                    {...register('agree_terms')}
                  />
                  <Label htmlFor="agree_terms" className="text-sm">
                    I agree to the{' '}
                    <Link href="/terms" className="text-blue-600 hover:text-blue-800">
                      Terms and Conditions
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-blue-600 hover:text-blue-800">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>
                {errors.agree_terms && (
                  <p className="mt-1 text-sm text-red-600">{errors.agree_terms.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="mt-6">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </div>

              {/* Login Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link
                    href={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <div className="pt-[70px] min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </>
    }>
      <SignupContent />
    </Suspense>
  );
}
