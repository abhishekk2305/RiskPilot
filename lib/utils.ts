import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function maskEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return email || 'no-email';
  }
  
  const [username, domain] = email.split('@');
  if (!username || !domain) return email;
  
  const maskedUsername = username.charAt(0) + '***' + (username.length > 1 ? username.charAt(username.length - 1) : '');
  return `${maskedUsername}@${domain}`;
}

export function getLastIpOctet(ip: string): string {
  const octets = ip.split('.');
  if (octets.length === 4) {
    return octets[3];
  }
  
  // For IPv6 or other formats, just return last few characters
  return ip.slice(-3);
}
