'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWeb3 } from '@/contexts/Web3Context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  User, 
  Package, 
  ArrowRightLeft, 
  Calendar, 
  Wallet,
  TrendingUp,
  Activity,
  ExternalLink,
} from 'lucide-react';
import { 
  truncateAddress, 
  formatDate, 
  formatNumber, 
  getRoleBadgeVariant,
  getStatusBadgeVariant,
} from '@/lib/utils';

interface Token {
  id: number;
  name: string;
  totalSupply: number;
  balance: number;
  creator: string;
  dateCreated: number;
  parentId: number;
  features: string;
}

interface Transfer {
  id: number;
  from: string;
  to: string;
  tokenId: number;
  tokenName: string;
  amount: number;
  status: number;
  dateCreated: number;
}

const statusLabels = ['Pending', 'Approved', 'Rejected', 'Cancelled'];

/**
 * User Profile Page
 * Displays user information, portfolio, and activity
 */
export default function ProfilePage() {
  const router = useRouter();
  const { isConnected, isLoading, account, userInfo, isApproved } = useWeb3();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Check access
  useEffect(() => {
    if (!isLoading && !isConnected) {
      router.push('/');
    }
    if (!isLoading && isConnected && !isApproved) {
      router.push('/');
    }
  }, [isLoading, isConnected, isApproved, router]);

  // Fetch user's data
  useEffect(() => {
    async function fetchData() {
      if (!isConnected || !isApproved || !account) return;

      try {
        setIsLoadingData(true);
        const { web3Service } = await import('@/lib/web3');
        
        // Fetch tokens
        const tokenIds = await web3Service.getUserTokens(account);
        const tokenDetails = await Promise.all(
          tokenIds.map(async (tokenId) => {
            const token = await web3Service.getToken(tokenId);
            const balance = await web3Service.getTokenBalance(tokenId, account);
            return {
              ...token,
              balance,
            };
          })
        );

        // Fetch transfers
        const transferIds = await web3Service.getUserTransfers(account);
        const transferDetails = await Promise.all(
          transferIds.map(async (transferId) => {
            const transfer = await web3Service.getTransfer(transferId);
            const token = await web3Service.getToken(transfer.tokenId);
            return {
              ...transfer,
              tokenName: token.name,
            };
          })
        );

        setTokens(tokenDetails);
        setTransfers(transferDetails.sort((a, b) => b.dateCreated - a.dateCreated));
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setIsLoadingData(false);
      }
    }

    fetchData();
  }, [isConnected, isApproved, account]);

  // Show loading while checking permissions
  if (isLoading || !isConnected || !isApproved || !userInfo) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  // Calculate statistics
  const totalTokens = tokens.length;
  const totalBalance = tokens.reduce((sum, token) => sum + token.balance, 0);
  const tokensCreated = tokens.filter(token => 
    token.creator.toLowerCase() === account?.toLowerCase()
  ).length;
  const totalTransfers = transfers.length;
  const pendingTransfers = transfers.filter(t => t.status === 0).length;
  const completedTransfers = transfers.filter(t => t.status === 1).length;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <User className="h-8 w-8 text-blue-600" />
          My Profile
        </h1>
        <p className="text-gray-600">
          View your portfolio, activity, and statistics
        </p>
      </div>

      {/* User Information Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Address */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                Wallet Address
              </label>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-gray-100 px-3 py-2 rounded font-mono">
                  {account}
                </code>
              </div>
            </div>

            {/* User ID */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                User ID
              </label>
              <div className="text-lg font-semibold text-gray-900">
                #{userInfo.id}
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                Role
              </label>
              <div>
                <Badge variant={getRoleBadgeVariant(userInfo.role)}>
                  {userInfo.role}
                </Badge>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                Account Status
              </label>
              <div>
                <Badge variant={getStatusBadgeVariant(userInfo.status)}>
                  {statusLabels[userInfo.status]}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Tokens */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Tokens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {totalTokens}
                </div>
                <div className="text-xs text-gray-500">
                  {tokensCreated} created by you
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Balance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {formatNumber(totalBalance)}
                </div>
                <div className="text-xs text-gray-500">
                  Across all tokens
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Transfers */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Transfers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <ArrowRightLeft className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {totalTransfers}
                </div>
                <div className="text-xs text-gray-500">
                  {pendingTransfers} pending, {completedTransfers} completed
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Member Since */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Member Since
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div>
                <div className="text-lg font-bold text-gray-900">
                  User #{userInfo.id}
                </div>
                <div className="text-xs text-gray-500">
                  Registered user
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Token Portfolio */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Token Portfolio
          </CardTitle>
          <CardDescription>
            All tokens you currently own
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingData ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : tokens.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No tokens in your portfolio yet</p>
              {userInfo.role !== 'Consumer' && (
                <Link href="/tokens/create">
                  <Button size="sm">
                    Create Your First Token
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Token
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      Balance
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      Total Supply
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                      Ownership
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                      Creator
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((token) => {
                    const ownershipPercentage = token.totalSupply > 0 
                      ? (token.balance / token.totalSupply) * 100 
                      : 0;
                    const isCreator = token.creator.toLowerCase() === account?.toLowerCase();

                    return (
                      <tr key={token.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-900">
                              {token.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: #{token.id}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900">
                          {formatNumber(token.balance)}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600">
                          {formatNumber(token.totalSupply)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={ownershipPercentage === 100 ? 'success' : 'default'}>
                            {ownershipPercentage.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isCreator ? (
                            <Badge variant="success">You</Badge>
                          ) : (
                            <span className="text-xs text-gray-500">
                              {truncateAddress(token.creator)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Link href={`/tokens/${token.id}`}>
                            <Button size="sm" variant="outline">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Your latest transfers and transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingData ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : transfers.length === 0 ? (
            <div className="text-center py-12">
              <ArrowRightLeft className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No transfer activity yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transfers.slice(0, 10).map((transfer) => {
                const isSender = transfer.from.toLowerCase() === account?.toLowerCase();
                const statusLabel = ['Pending', 'Accepted', 'Rejected', 'Cancelled'][transfer.status];
                const statusVariant = getStatusBadgeVariant(transfer.status);

                return (
                  <div 
                    key={transfer.id} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        isSender ? 'bg-red-100' : 'bg-green-100'
                      }`}>
                        <ArrowRightLeft className={`h-5 w-5 ${
                          isSender ? 'text-red-600' : 'text-green-600'
                        }`} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {isSender ? 'Sent' : 'Received'} {formatNumber(transfer.amount)} {transfer.tokenName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {isSender ? 'To' : 'From'}: {truncateAddress(isSender ? transfer.to : transfer.from)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(transfer.dateCreated)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={statusVariant}>
                        {statusLabel}
                      </Badge>
                      <Link href="/transfers">
                        <Button size="sm" variant="ghost">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
              {transfers.length > 10 && (
                <div className="text-center pt-4">
                  <Link href="/transfers">
                    <Button variant="outline" size="sm">
                      View All Transfers ({transfers.length})
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

