export interface AuthResult {
  success: boolean;
  message?: string;
}

// Generic auth function that works with both Next.js and Express requests
export function checkAdminAuth(request: any): AuthResult {
  const adminKey = process.env.ADMIN_KEY;
  
  if (!adminKey) {
    return { success: false, message: 'Admin authentication not configured' };
  }

  let authHeader: string | null = null;
  let url: string | null = null;

  // Handle Next.js request
  if (request && typeof request.headers?.get === 'function') {
    authHeader = request.headers.get('authorization');
    url = request.url;
  }
  // Handle Express request
  else if (request && request.headers) {
    authHeader = request.headers.authorization;
    url = request.url;
  }

  // Check Authorization header
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token === adminKey) {
      return { success: true };
    }
  }

  // Check query parameter as fallback
  if (url) {
    try {
      const { searchParams } = new URL(url, 'http://localhost');
      const keyParam = searchParams.get('key');
      if (keyParam === adminKey) {
        return { success: true };
      }
    } catch (error) {
      // URL parsing failed, skip query param check
    }
  }

  return { success: false, message: 'Invalid admin key' };
}
