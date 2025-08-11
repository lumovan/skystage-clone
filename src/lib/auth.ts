/**
 * Authentication and User Management Utilities
 * Provides JWT-based authentication with support for database operations
 */

import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { ensureDatabaseConnection } from './database/init';
import { userDb } from './db';

// JWT Secret (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'skystage-dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Get JWT secret for token operations
 */
function getJwtSecret(): string {
  return JWT_SECRET;
}

/**
 * User type definitions
 */
export interface User {
  id: string;
  email: string;
  full_name?: string;
  user_type: 'customer' | 'operator' | 'artist' | 'admin';
  company_name?: string;
  phone?: string;
  location?: string;
  avatar_url?: string;
  is_verified: boolean;
  is_active: boolean;
  preferences?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  user_type: string;
  is_verified: boolean;
  is_active?: boolean;
}

/**
 * Generate a secure random salt for password hashing
 */
export function generateSalt(): string {
  return bcrypt.genSaltSync(12);
}

/**
 * Hash a password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = generateSalt();
  return bcrypt.hash(password, salt);
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for user authentication
 */
export function generateToken(data: unknown): string {
  const payload = {
    id: user.id,
    email: user.email,
    user_type: user.user_type,
    is_verified: user.is_verified,
    is_active: user.is_active
  };

  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: '7d',
    issuer: 'skystage',
    audience: 'skystage-users'
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, getJwtSecret(), {
      issuer: 'skystage',
      audience: 'skystage-users'
    });
  } catch (error) {
    return null;
  }
}

/**
 * Extract user information from NextRequest
 */
export async function getUserFromRequest(request: NextRequest): Promise<any> {
  try {
    // Ensure database is initialized
    await ensureDatabaseConnection();

    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    let token: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // If no bearer token, try cookies (try multiple methods for compatibility)
    if (!token) {
      // Method 1: Direct from request cookies
      const cookieToken = request.cookies.get('auth-token')?.value;
      const devCookieToken = request.cookies.get('auth-token-dev')?.value;

      token = cookieToken || devCookieToken || null;

      // Method 2: Try the cookies() function as fallback
      if (!token) {
        try {
          const cookieStore = await cookies();
          const altCookieToken = cookieStore.get('auth-token')?.value;
          const altDevCookieToken = cookieStore.get('auth-token-dev')?.value;

          token = altCookieToken || altDevCookieToken || null;
        } catch (cookieError) {
          // If cookies() fails, continue with null token
          console.log('Cookie access method failed, continuing without cookies');
        }
      }
    }

    if (!token) {
      return null;
    }

    const user = verifyToken(token);

    if (!user) {
      return null;
    }

    // Verify user still exists and is active
    const dbUser = await userDb.findById(user.id);
    if (!dbUser || !dbUser.is_active) {
      return null;
    }

    // Update last login if it's been more than an hour
    const lastLogin = dbUser.last_login ? new Date(dbUser.last_login) : null;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    if (!lastLogin || lastLogin < oneHourAgo) {
      await userDb.updateLastLogin(user.id);
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      full_name: dbUser.full_name,
      user_type: dbUser.user_type,
      is_verified: dbUser.is_verified,
      is_active: dbUser.is_active,
      company_name: dbUser.company_name,
      phone: dbUser.phone,
      location: dbUser.location,
      preferences: dbUser.preferences,
      created_at: dbUser.created_at,
      updated_at: dbUser.updated_at,
      last_login: dbUser.last_login
    };

  } catch (error: unknown) {
    console.error('Error getting user from request:', error);
    return null;
  }
}

/**
 * Require authentication middleware
 */
export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await getUserFromRequest(request);
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

/**
 * Require admin role middleware
 */
export async function requireAdmin(request: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(request);
  if (user.user_type !== 'admin') {
    throw new Error('Admin access required');
  }
  return user;
}

/**
 * Require specific user type
 */
export async function requireUserType(
  request: NextRequest,
  allowedTypes: string[]
): Promise<AuthUser> {
  const user = await requireAuth(request);
  if (!allowedTypes.includes(user.user_type)) {
    throw new Error(`Access denied. Allowed types: ${allowedTypes.join(', ')}`);
  }
  return user;
}

/**
 * Register new user
 */
export async function registerUser(userData: {
  email: string;
  password: string;
  full_name?: string;
  user_type?: string;
  company_name?: string;
  phone?: string;
  location?: string;
}): Promise<{ user: AuthUser; token: string }> {
  // Check if user already exists
  const existingUser = await userDb.findByEmail(userData.email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const password_hash = await hashPassword(userData.password);

  // Create user data
  const userToCreate = {
    email: userData.email.toLowerCase(),
    password_hash,
    full_name: userData.full_name || '',
    user_type: (userData.user_type as any) || 'customer',
    company_name: userData.company_name,
    phone: userData.phone,
    location: userData.location,
    is_verified: false,
    is_active: true,
    preferences: {
      theme: 'light',
      notifications: true,
      language: 'en'
    }
  };

  // Create user in database
  const createdUser = await userDb.create(userToCreate);

  // Create auth user object
  const authUser: AuthUser = {
    id: createdUser.id,
    email: createdUser.email,
    full_name: createdUser.full_name,
    user_type: createdUser.user_type,
    is_verified: createdUser.is_verified,
    is_active: createdUser.is_active
  };

  // Generate token
  const token = generateToken(authUser);

  return { user: authUser, token };
}

/**
 * Login user
 */
export async function loginUser(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
  // Find user
  const dbUser = await userDb.findByEmail(email.toLowerCase());
  if (!dbUser) {
    throw new Error('Invalid email or password');
  }

  // Check if account is active
  if (!dbUser.is_active) {
    throw new Error('Account is deactivated');
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, dbUser.password_hash);
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  // Update last login
  await userDb.updateLastLogin(dbUser.id);

  // Create auth user object
  const authUser: AuthUser = {
    id: dbUser.id,
    email: dbUser.email,
    full_name: dbUser.full_name,
    user_type: dbUser.user_type,
    is_verified: dbUser.is_verified,
    is_active: dbUser.is_active
  };

  // Generate token
  const token = generateToken(authUser);

  return { user: authUser, token };
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
  // Remove sensitive fields that shouldn't be updated directly
  const { password_hash, id, created_at, ...safeUpdates } = updates as any;

  // Update user in database
  const updatedUser = await userDb.update(userId, safeUpdates);

  return updatedUser;
}

/**
 * Change user password
 */
export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await userDb.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Verify current password
  const isValidPassword = await verifyPassword(currentPassword, user.password_hash);
  if (!isValidPassword) {
    throw new Error('Current password is incorrect');
  }

  // Hash new password
  const newPasswordHash = await hashPassword(newPassword);

  // Update password
  await userDb.update(userId, { password_hash: newPasswordHash });
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  return await userDb.findById(userId);
}

/**
 * Verify user account (email verification)
 */
export async function verifyUserAccount(userId: string): Promise<User> {
  const updatedUser = await userDb.update(userId, {
    is_verified: true
  });

  return updatedUser;
}

/**
 * Deactivate user account
 */
export async function deactivateUser(userId: string): Promise<User> {
  const updatedUser = await userDb.update(userId, {
    is_active: false
  });

  return updatedUser;
}

/**
 * Reactivate user account
 */
export async function reactivateUser(userId: string): Promise<User> {
  const updatedUser = await userDb.update(userId, {
    is_active: true
  });

  return updatedUser;
}

/**
 * Create API response with authentication info
 */
export function createAuthResponse(user: AuthUser, token: string) {
  return {
    success: true,
    data: {
      user,
      token,
      expires_in: JWT_EXPIRES_IN
    }
  };
}

/**
 * Create error response
 */
export function createErrorResponse(message: string, details?: unknown) {
  return {
    success: false,
    error: message,
    ...(details && { details })
  };
}

export default {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  getUserFromRequest,
  requireAuth,
  requireAdmin,
  requireUserType,
  registerUser,
  loginUser,
  updateUserProfile,
  changeUserPassword,
  getUserById,
  verifyUserAccount,
  deactivateUser,
  reactivateUser,
  createAuthResponse,
  createErrorResponse
};
