'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useWeb3 } from '@/contexts/Web3Context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { truncateAddress } from '@/lib/utils';
import { ROLE_ICONS } from '@/contracts/config';
import { Loader2, Wallet, LogOut, Menu, X } from 'lucide-react';

export default function Header() {
  const { account, isConnected, isLoading, userInfo, isAdmin, connectWallet, disconnectWallet, error } = useWeb3();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-gray-200 bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Brand */}
          <div className="flex items-center gap-4 md:gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🔗</span>
              <span className="text-lg md:text-xl font-bold text-gray-900 hidden sm:block">
                Supply Chain Tracker
              </span>
              <span className="text-lg md:text-xl font-bold text-gray-900 sm:hidden">
                SCT
              </span>
            </Link>

            {/* Desktop Navigation - Only show if connected and approved */}
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
          <div className="flex items-center gap-2 md:gap-4">
            {/* Error message */}
            {error && (
              <div className="hidden lg:block text-sm text-red-600 max-w-xs truncate">
                {error}
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Loading...</span>
              </div>
            )}

            {/* Connected state */}
            {!isLoading && isConnected && account && (
              <>
                <div className="hidden md:flex items-center gap-3">
                  {/* User info badges */}
                  {userInfo && (
                    <div className="flex items-center gap-2">
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
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
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
                    Disconnect
                  </Button>
                </div>

                {/* Mobile menu button */}
                {userInfo && userInfo.status === 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden"
                  >
                    {mobileMenuOpen ? (
                      <X className="h-5 w-5" />
                    ) : (
                      <Menu className="h-5 w-5" />
                    )}
                  </Button>
                )}
              </>
            )}

            {/* Not connected state */}
            {!isLoading && !isConnected && (
              <Button onClick={connectWallet} className="gap-2 text-sm md:text-base px-3 md:px-4">
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">Connect Wallet</span>
                <span className="sm:hidden">Connect</span>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && isConnected && userInfo && userInfo.status === 1 && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-1">
            {/* User info mobile */}
            <div className="px-4 py-3 bg-gray-50 rounded-lg mb-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Wallet className="h-4 w-4 text-gray-600" />
                <span className="font-mono text-gray-900">
                  {truncateAddress(account!)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Badge variant="danger" className="text-xs">
                    <span className="mr-1">{ROLE_ICONS.Admin}</span>
                    Admin
                  </Badge>
                )}
                {userInfo && (
                  <Badge variant="secondary" className="text-xs">
                    <span className="mr-1">{ROLE_ICONS[userInfo.role as keyof typeof ROLE_ICONS]}</span>
                    {userInfo.role}
                  </Badge>
                )}
              </div>
            </div>

            {/* Navigation links */}
            <Link 
              href="/dashboard" 
              className="block px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              📊 Dashboard
            </Link>
            <Link 
              href="/tokens" 
              className="block px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              📦 Tokens
            </Link>
            <Link 
              href="/transfers" 
              className="block px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              🔄 Transfers
            </Link>
            {isAdmin && (
              <Link 
                href="/admin" 
                className="block px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                🛡️ Admin Panel
              </Link>
            )}
            <Link 
              href="/profile" 
              className="block px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              👤 Profile
            </Link>

            {/* Disconnect button mobile */}
            <div className="px-4 pt-3 border-t border-gray-200 mt-3">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  disconnectWallet();
                  setMobileMenuOpen(false);
                }}
                className="w-full gap-2 justify-center"
              >
                <LogOut className="h-4 w-4" />
                Disconnect Wallet
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

