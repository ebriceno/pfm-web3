import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Truncate Ethereum address for display
 * @example "0xf39F...2266"
 */
export function truncateAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format Unix timestamp to readable date
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format number with thousand separators
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Validate Ethereum address format
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Parse JSON safely with fallback
 */
export function parseJSON<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Get role badge color classes
 */
export function getRoleBadgeColor(role: string): string {
  const colors: Record<string, string> = {
    Producer: 'bg-blue-100 text-blue-800 border-blue-300',
    Factory: 'bg-purple-100 text-purple-800 border-purple-300',
    Retailer: 'bg-orange-100 text-orange-800 border-orange-300',
    Consumer: 'bg-green-100 text-green-800 border-green-300',
    Admin: 'bg-red-100 text-red-800 border-red-300',
  };
  return colors[role] || 'bg-gray-100 text-gray-800 border-gray-300';
}

/**
 * Get status badge color classes
 */
export function getStatusBadgeColor(status: number): string {
  const colors = [
    'bg-yellow-100 text-yellow-800 border-yellow-300', // Pending
    'bg-green-100 text-green-800 border-green-300',     // Approved/Accepted
    'bg-red-100 text-red-800 border-red-300',           // Rejected
    'bg-gray-100 text-gray-800 border-gray-300',        // Canceled
  ];
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
}

/**
 * Get status label
 */
export function getStatusLabel(status: number, type: 'user' | 'transfer' = 'user'): string {
  if (type === 'user') {
    const labels = ['Pending', 'Approved', 'Rejected', 'Canceled'];
    return labels[status] || 'Unknown';
  } else {
    const labels = ['Pending', 'Accepted', 'Rejected'];
    return labels[status] || 'Unknown';
  }
}

/**
 * Convert BigInt to number safely (for display)
 */
export function bigIntToNumber(value: bigint): number {
  return Number(value);
}

/**
 * Convert BigInt to string (for JSON serialization)
 */
export function bigIntToString(value: bigint): string {
  return value.toString();
}

/**
 * Sleep/delay utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

