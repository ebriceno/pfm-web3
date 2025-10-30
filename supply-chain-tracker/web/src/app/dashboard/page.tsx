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
  Package, 
  ArrowRightLeft, 
  TrendingUp,
  Factory,
  Store,
  User,
  Plus,
  Send,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
} from 'lucide-react';
import { 
  truncateAddress, 
  formatDate, 
  formatNumber,
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
  tokenName?: string;
  amount: number;
  status: number;
  dateCreated: number;
}

/**
 * Dashboard Page
 * Role-based dashboard with personalized views
 */
export default function DashboardPage() {
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
            try {
              const token = await web3Service.getToken(transfer.tokenId);
              return {
                ...transfer,
                tokenName: token.name,
              };
            } catch {
              return transfer;
            }
          })
        );

        setTokens(tokenDetails);
        setTransfers(transferDetails.sort((a, b) => b.dateCreated - a.dateCreated));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
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
  const pendingTransfers = transfers.filter(t => 
    t.status === 0 && t.to.toLowerCase() === account?.toLowerCase()
  ).length;
  const sentTransfers = transfers.filter(t => 
    t.from.toLowerCase() === account?.toLowerCase()
  ).length;
  const receivedTransfers = transfers.filter(t => 
    t.to.toLowerCase() === account?.toLowerCase() && t.status === 1
  ).length;

  // Render role-specific dashboard
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          Dashboard
        </h1>
        <p className="text-gray-600">
          Welcome back, {userInfo.role}! Here's your supply chain overview.
        </p>
      </div>

      {/* Role-specific content */}
      {userInfo.role === 'Producer' && (
        <ProducerDashboard 
          tokens={tokens}
          transfers={transfers}
          stats={{ totalTokens, tokensCreated, sentTransfers }}
          isLoading={isLoadingData}
        />
      )}
      {userInfo.role === 'Factory' && (
        <FactoryDashboard 
          tokens={tokens}
          transfers={transfers}
          stats={{ totalTokens, tokensCreated, sentTransfers, receivedTransfers }}
          isLoading={isLoadingData}
        />
      )}
      {userInfo.role === 'Retailer' && (
        <RetailerDashboard 
          tokens={tokens}
          transfers={transfers}
          stats={{ totalTokens, totalBalance, sentTransfers, receivedTransfers }}
          isLoading={isLoadingData}
        />
      )}
      {userInfo.role === 'Consumer' && (
        <ConsumerDashboard 
          tokens={tokens}
          transfers={transfers}
          stats={{ totalTokens, totalBalance, receivedTransfers, pendingTransfers }}
          isLoading={isLoadingData}
        />
      )}
    </div>
  );
}

/**
 * Producer Dashboard
 * Focus: Raw material production and distribution
 */
function ProducerDashboard({ tokens, transfers, stats, isLoading }: {
  tokens: Token[];
  transfers: Transfer[];
  stats: { totalTokens: number; tokensCreated: number; sentTransfers: number };
  isLoading: boolean;
}) {
  const recentTransfers = transfers.slice(0, 5);

  return (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Raw Materials Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.tokensCreated}
                </div>
                <div className="text-xs text-gray-500">
                  Total tokens created
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Transfers Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Send className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.sentTransfers}
                </div>
                <div className="text-xs text-gray-500">
                  To factories
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Inventory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.totalTokens}
                </div>
                <div className="text-xs text-gray-500">
                  Token types
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Manage your raw materials production
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Link href="/tokens/create">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create New Raw Material
              </Button>
            </Link>
            <Link href="/tokens">
              <Button variant="outline" className="gap-2">
                <Package className="h-4 w-4" />
                View All Materials
              </Button>
            </Link>
            <Link href="/transfers">
              <Button variant="outline" className="gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                View Transfers
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transfers</CardTitle>
          <CardDescription>
            Your latest material distributions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : recentTransfers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No transfers yet. Start by creating a raw material token!
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransfers.map((transfer) => (
                <div 
                  key={transfer.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Send className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900">
                        Sent {formatNumber(transfer.amount)} {transfer.tokenName || `Token #${transfer.tokenId}`}
                      </div>
                      <div className="text-sm text-gray-600">
                        To: {truncateAddress(transfer.to)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(transfer.dateCreated)}
                      </div>
                    </div>
                  </div>
                  <Badge variant={getStatusBadgeVariant(transfer.status)}>
                    {['Pending', 'Accepted', 'Rejected', 'Cancelled'][transfer.status]}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

/**
 * Factory Dashboard
 * Focus: Processing raw materials into products
 */
function FactoryDashboard({ tokens, transfers, stats, isLoading }: {
  tokens: Token[];
  transfers: Transfer[];
  stats: { totalTokens: number; tokensCreated: number; sentTransfers: number; receivedTransfers: number };
  isLoading: boolean;
}) {
  const { account } = useWeb3();
  const pendingIncoming = transfers.filter(t => 
    t.status === 0 && t.to.toLowerCase() === account?.toLowerCase()
  );
  const recentActivity = transfers.slice(0, 5);

  return (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Products Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Factory className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.tokensCreated}
                </div>
                <div className="text-xs text-gray-500">
                  Processed items
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Materials Received
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Download className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.receivedTransfers}
                </div>
                <div className="text-xs text-gray-500">
                  From producers
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Products Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Send className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.sentTransfers}
                </div>
                <div className="text-xs text-gray-500">
                  To retailers
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Incoming
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {pendingIncoming.length}
                </div>
                <div className="text-xs text-gray-500">
                  Awaiting acceptance
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Transfers Alert */}
      {pendingIncoming.length > 0 && (
        <Card className="mb-8 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertCircle className="h-5 w-5" />
              Pending Incoming Transfers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-800 mb-4">
              You have {pendingIncoming.length} pending transfer{pendingIncoming.length > 1 ? 's' : ''} waiting for your acceptance.
            </p>
            <Link href="/transfers">
              <Button size="sm" variant="outline" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Review Transfers
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Manage your production and inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Link href="/tokens/create">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Processed Product
              </Button>
            </Link>
            <Link href="/transfers">
              <Button variant="outline" className="gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                Manage Transfers
              </Button>
            </Link>
            <Link href="/tokens">
              <Button variant="outline" className="gap-2">
                <Package className="h-4 w-4" />
                View Inventory
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest transfers and production
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No activity yet. Accept materials to start production!
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((transfer) => {
                const isSender = transfer.from.toLowerCase() === account?.toLowerCase();
                return (
                  <div 
                    key={transfer.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {isSender ? (
                        <Send className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Download className="h-5 w-5 text-green-600" />
                      )}
                      <div>
                        <div className="font-medium text-gray-900">
                          {isSender ? 'Sent' : 'Received'} {formatNumber(transfer.amount)} {transfer.tokenName || `Token #${transfer.tokenId}`}
                        </div>
                        <div className="text-sm text-gray-600">
                          {isSender ? 'To' : 'From'}: {truncateAddress(isSender ? transfer.to : transfer.from)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(transfer.dateCreated)}
                        </div>
                      </div>
                    </div>
                    <Badge variant={getStatusBadgeVariant(transfer.status)}>
                      {['Pending', 'Accepted', 'Rejected', 'Cancelled'][transfer.status]}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

/**
 * Retailer Dashboard
 * Focus: Distributing to consumers
 */
function RetailerDashboard({ tokens, transfers, stats, isLoading }: {
  tokens: Token[];
  transfers: Transfer[];
  stats: { totalTokens: number; totalBalance: number; sentTransfers: number; receivedTransfers: number };
  isLoading: boolean;
}) {
  const { account } = useWeb3();
  const pendingIncoming = transfers.filter(t => 
    t.status === 0 && t.to.toLowerCase() === account?.toLowerCase()
  );
  const recentSales = transfers.filter(t => 
    t.from.toLowerCase() === account?.toLowerCase()
  ).slice(0, 5);

  return (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Inventory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Store className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.totalTokens}
                </div>
                <div className="text-xs text-gray-500">
                  Product types
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {formatNumber(stats.totalBalance)}
                </div>
                <div className="text-xs text-gray-500">
                  Units available
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Sales to Consumers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Send className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.sentTransfers}
                </div>
                <div className="text-xs text-gray-500">
                  Transfers sent
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Incoming
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {pendingIncoming.length}
                </div>
                <div className="text-xs text-gray-500">
                  From factories
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Transfers Alert */}
      {pendingIncoming.length > 0 && (
        <Card className="mb-8 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertCircle className="h-5 w-5" />
              Pending Stock Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-800 mb-4">
              You have {pendingIncoming.length} pending delivery{pendingIncoming.length > 1 ? 'ies' : ''} from factories.
            </p>
            <Link href="/transfers">
              <Button size="sm" variant="outline" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Review Deliveries
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Manage your retail operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Link href="/transfers/create">
              <Button className="gap-2">
                <Send className="h-4 w-4" />
                Sell to Consumer
              </Button>
            </Link>
            <Link href="/tokens/create">
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Create Retail Product
              </Button>
            </Link>
            <Link href="/tokens">
              <Button variant="outline" className="gap-2">
                <Package className="h-4 w-4" />
                View Inventory
              </Button>
            </Link>
            <Link href="/transfers">
              <Button variant="outline" className="gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                Manage Transfers
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
          <CardDescription>
            Latest sales to consumers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : recentSales.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No sales yet. Start selling products to consumers!
            </div>
          ) : (
            <div className="space-y-3">
              {recentSales.map((transfer) => (
                <div 
                  key={transfer.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Send className="h-5 w-5 text-purple-600" />
                    <div>
                      <div className="font-medium text-gray-900">
                        Sold {formatNumber(transfer.amount)} {transfer.tokenName || `Token #${transfer.tokenId}`}
                      </div>
                      <div className="text-sm text-gray-600">
                        To: {truncateAddress(transfer.to)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(transfer.dateCreated)}
                      </div>
                    </div>
                  </div>
                  <Badge variant={getStatusBadgeVariant(transfer.status)}>
                    {['Pending', 'Accepted', 'Rejected', 'Cancelled'][transfer.status]}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

/**
 * Consumer Dashboard
 * Focus: Product traceability and purchases
 */
function ConsumerDashboard({ tokens, transfers, stats, isLoading }: {
  tokens: Token[];
  transfers: Transfer[];
  stats: { totalTokens: number; totalBalance: number; receivedTransfers: number; pendingTransfers: number };
  isLoading: boolean;
}) {
  const recentPurchases = transfers.slice(0, 5);

  return (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Products Owned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.totalTokens}
                </div>
                <div className="text-xs text-gray-500">
                  Different products
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Units
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {formatNumber(stats.totalBalance)}
                </div>
                <div className="text-xs text-gray-500">
                  Items owned
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Purchases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Download className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.receivedTransfers}
                </div>
                <div className="text-xs text-gray-500">
                  Items received
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.pendingTransfers}
                </div>
                <div className="text-xs text-gray-500">
                  Awaiting acceptance
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Transfers Alert */}
      {stats.pendingTransfers > 0 && (
        <Card className="mb-8 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertCircle className="h-5 w-5" />
              Pending Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-800 mb-4">
              You have {stats.pendingTransfers} pending delivery{stats.pendingTransfers > 1 ? 'ies' : ''} waiting for your acceptance.
            </p>
            <Link href="/transfers">
              <Button size="sm" variant="outline" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Review Deliveries
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Manage your products and view traceability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Link href="/tokens">
              <Button className="gap-2">
                <Package className="h-4 w-4" />
                View My Products
              </Button>
            </Link>
            <Link href="/transfers">
              <Button variant="outline" className="gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                View Deliveries
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="outline" className="gap-2">
                <User className="h-4 w-4" />
                My Profile
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Purchases */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Purchases</CardTitle>
          <CardDescription>
            Your latest product acquisitions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : recentPurchases.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No purchases yet. Products will appear here once you receive transfers.
            </div>
          ) : (
            <div className="space-y-3">
              {recentPurchases.map((transfer) => (
                <div 
                  key={transfer.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Download className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium text-gray-900">
                        Received {formatNumber(transfer.amount)} {transfer.tokenName || `Token #${transfer.tokenId}`}
                      </div>
                      <div className="text-sm text-gray-600">
                        From: {truncateAddress(transfer.from)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(transfer.dateCreated)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(transfer.status)}>
                      {['Pending', 'Accepted', 'Rejected', 'Cancelled'][transfer.status]}
                    </Badge>
                    {transfer.status === 1 && (
                      <Link href={`/tokens/${transfer.tokenId}`}>
                        <Button size="sm" variant="ghost">
                          View
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

