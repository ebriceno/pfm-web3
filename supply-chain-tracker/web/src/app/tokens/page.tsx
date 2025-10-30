'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '@/contexts/Web3Context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { TokenCard } from '@/components/TokenCard';
import { Loader2, Plus, Package } from 'lucide-react';

interface Token {
  id: number;
  name: string;
  totalSupply: number;
  features: string;
  creator: string;
  dateCreated: number;
  parentId: number;
}

interface TokenWithBalance extends Token {
  balance: number;
}

/**
 * Tokens Page
 * Displays all tokens owned by the user
 */
export default function TokensPage() {
  const router = useRouter();
  const { isConnected, isLoading, account, userInfo, isApproved } = useWeb3();
  const [tokens, setTokens] = useState<TokenWithBalance[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);

  // Check access
  useEffect(() => {
    if (!isLoading && !isConnected) {
      router.push('/');
    }
    if (!isLoading && isConnected && !isApproved) {
      router.push('/');
    }
  }, [isLoading, isConnected, isApproved, router]);

  // Fetch user's tokens
  useEffect(() => {
    async function fetchTokens() {
      if (!isConnected || !isApproved || !account) return;

      try {
        setIsLoadingTokens(true);
        const { web3Service } = await import('@/lib/web3');
        
        // Get user's token IDs
        const tokenIds = await web3Service.getUserTokens(account);
        
        // Fetch details for each token
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

        setTokens(tokenDetails);
      } catch (error) {
        console.error('Error fetching tokens:', error);
      } finally {
        setIsLoadingTokens(false);
      }
    }

    fetchTokens();
  }, [isConnected, isApproved, account]);

  // Show loading while checking permissions
  if (isLoading || !isConnected || !isApproved) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  // Check if user can create tokens
  const canCreateTokens = userInfo?.role && userInfo.role !== 'Consumer';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Tokens
          </h1>
          <p className="text-gray-600">
            View and manage your supply chain tokens
          </p>
        </div>
        
        {canCreateTokens && (
          <Button
            onClick={() => router.push('/tokens/create')}
            size="lg"
            className="gap-2"
          >
            <Plus className="h-5 w-5" />
            Create Token
          </Button>
        )}
      </div>

      {/* Tokens Grid */}
      {isLoadingTokens ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
        </div>
      ) : tokens.length === 0 ? (
        <EmptyState 
          canCreate={!!canCreateTokens}
          onCreateClick={() => router.push('/tokens/create')}
        />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <StatCard
              label="Total Tokens"
              value={tokens.length}
              icon={<Package className="h-5 w-5 text-blue-600" />}
            />
            <StatCard
              label="Total Balance"
              value={tokens.reduce((sum, t) => sum + t.balance, 0)}
              icon={<Package className="h-5 w-5 text-green-600" />}
            />
            <StatCard
              label="Unique Types"
              value={new Set(tokens.map(t => t.name)).size}
              icon={<Package className="h-5 w-5 text-purple-600" />}
            />
          </div>

          {/* Tokens Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tokens.map((token) => (
              <TokenCard key={token.id} token={token} balance={token.balance} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * EmptyState Component
 */
interface EmptyStateProps {
  canCreate: boolean;
  onCreateClick: () => void;
}

function EmptyState({ canCreate, onCreateClick }: EmptyStateProps) {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Package className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No tokens yet
        </h3>
        {canCreate ? (
          <>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              You don&apos;t have any tokens yet. Create your first token to start tracking products in the supply chain.
            </p>
            <Button onClick={onCreateClick} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Create Your First Token
            </Button>
          </>
        ) : (
          <p className="text-gray-600 text-center max-w-md">
            You don&apos;t have any tokens yet. Tokens will appear here once you receive them from other participants in the supply chain.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * StatCard Component
 */
interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardDescription className="text-sm font-medium">
          {label}
        </CardDescription>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

