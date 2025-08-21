import { NextRequest } from 'next/server';

export interface AuthResult {
  success: boolean;
  message?: string;
}

export function checkAdminAuth(request: NextRequest): AuthResult {
  const adminKey = process.env.ADMIN_KEY;
  
  if (!adminKey) {
    return { success: false, message: 'Admin authentication not configured' };
  }

  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token === adminKey) {
      return { success: true };
    }
  }

  // Check query parameter as fallback
  const { searchParams } = new URL(request.url);
  const keyParam = searchParams.get('key');
  if (keyParam === adminKey) {
    return { success: true };
  }

  return { success: false, message: 'Invalid admin key' };
}
