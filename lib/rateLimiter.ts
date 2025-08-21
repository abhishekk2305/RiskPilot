interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory rate limiting (10 requests per 10 minutes per IP)
const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 10; // 10 requests

export interface RateLimitResult {
  allowed: boolean;
  remainingRequests?: number;
  resetTime?: number;
}

export function checkRateLimit(identifier: string): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    // New window or expired entry
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    
    return {
      allowed: true,
      remainingRequests: RATE_LIMIT_MAX - 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return {
      allowed: false,
      remainingRequests: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;
  rateLimitMap.set(identifier, entry);

  return {
    allowed: true,
    remainingRequests: RATE_LIMIT_MAX - entry.count,
    resetTime: entry.resetTime,
  };
}

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes
