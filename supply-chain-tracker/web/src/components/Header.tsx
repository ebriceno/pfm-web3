'use client';

import Link from 'next/link';
import { useWeb3 } from '@/contexts/Web3Context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { truncateAddress } from '@/lib/utils';
import { ROLE_ICONS } from '@/contracts/config';
import { Loader2, Wallet, LogOut } from 'lucide-react';

export default function Header() {
  const { account, isConnected, isLoading, userInfo, isAdmin, connectWallet, disconnectWallet, error } = useWeb3();

  return (
    <header className="border-b border-gray-200 bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Brand */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🔗</span>
              <span className="text-xl font-bold text-gray-900">Supply Chain Tracker</span>
            </Link>

            {/* Navigation - Only show if connected and approved */}
            {isConnected && userInfo && userInfo.status === 1 && (
              <nav className="hidden md:flex items-center gap-6">
                <Link 
                  href="/dashboard" 
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/tokens" 
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Tokens
                </Link>
                <Link 
                  href="/transfers" 
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Transfers
                </Link>
                {isAdmin && (
                  <Link 
                    href="/admin" 
                    className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <Link 
                  href="/profile" 
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Profile
                </Link>
              </nav>
            )}
          </div>

          {/* Right side - Connection status */}
          <div className="flex items-center gap-4">
            {/* Error message */}
            {error && (
              <div className="hidden md:block text-sm text-red-600 max-w-xs truncate">
                {error}
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </div>
            )}

            {/* Connected state */}
            {!isLoading && isConnected && account && (
              <div className="flex items-center gap-3">
                {/* User info badges */}
                {userInfo && (
                  <div className="hidden sm:flex items-center gap-2">
                    {isAdmin && (
                      <Badge variant="danger">
                        <span className="mr-1">{ROLE_ICONS.Admin}</span>
                        Admin
                      </Badge>
                    )}
                    <Badge variant="secondary">
                      <span className="mr-1">{ROLE_ICONS[userInfo.role as keyof typeof ROLE_ICONS]}</span>
                      {userInfo.role}
                    </Badge>
                  </div>
                )}

                {/* Address */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                  <Wallet className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-mono text-gray-900">
                    {truncateAddress(account)}
                  </span>
                </div>

                {/* Disconnect button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={disconnectWallet}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Disconnect</span>
                </Button>
              </div>
            )}

            {/* Not connected state */}
            {!isLoading && !isConnected && (
              <Button onClick={connectWallet} className="gap-2">
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

