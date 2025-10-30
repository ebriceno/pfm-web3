'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useWeb3 } from '@/contexts/Web3Context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Package, User, Calendar, ArrowUpRight, Send } from 'lucide-react';
import { truncateAddress, formatDate } from '@/lib/utils';

interface Token {
  id: number;
  name: string;
  totalSupply: number;
  features: string;
  creator: string;
  dateCreated: number;
  parentId: number;
}

interface ParentToken {
  id: number;
  name: string;
}

/**
 * Token Details Page
 * Displays complete information about a token
 */
export default function TokenDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const tokenId = params?.id as string;
  const { isConnected, isLoading, account, isApproved } = useWeb3();
  const [token, setToken] = useState<Token | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [parentToken, setParentToken] = useState<ParentToken | null>(null);
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check access
  useEffect(() => {
    if (!isLoading && !isConnected) {
      router.push('/');
    }
    if (!isLoading && isConnected && !isApproved) {
      router.push('/');
    }
  }, [isLoading, isConnected, isApproved, router]);

  // Fetch token details
  useEffect(() => {
    async function fetchTokenDetails() {
      if (!tokenId || !account) return;

      try {
        setIsLoadingToken(true);
        setError(null);
        const { web3Service } = await import('@/lib/web3');
        
        const tokenDetails = await web3Service.getToken(parseInt(tokenId));
        setToken(tokenDetails);

        // Get balance
        const tokenBalance = await web3Service.getTokenBalance(parseInt(tokenId), account);
        setBalance(tokenBalance);

        // Get parent token if exists
        if (tokenDetails.parentId > 0) {
          try {
            const parent = await web3Service.getToken(tokenDetails.parentId);
            setParentToken({
              id: parent.id,
              name: parent.name,
            });
          } catch (err) {
            console.error('Error fetching parent token:', err);
          }
        }
      } catch (err: unknown) {
        console.error('Error fetching token:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load token';
        setError(errorMessage);
      } finally {
        setIsLoadingToken(false);
      }
    }

    fetchTokenDetails();
  }, [tokenId, account]);

  // Show loading while checking permissions
  if (isLoading || !isConnected || !isApproved) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  // Show loading while fetching token
  if (isLoadingToken) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  // Show error
  if (error || !token) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Token Not Found
            </h3>
            <p className="text-gray-600 text-center mb-6">
              {error || 'The token you&apos;re looking for doesn&apos;t exist or has been deleted.'}
            </p>
            <Button onClick={() => router.push('/tokens')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tokens
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const features = parseFeatures(token.features);
  const isCreator = token.creator.toLowerCase() === account?.toLowerCase();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Button
        onClick={() => router.push('/tokens')}
        variant="outline"
        size="sm"
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Tokens
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
            <Package className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              {token.name}
            </h1>
            <p className="text-gray-600">
              Token #{token.id}
            </p>
          </div>
        </div>

        {balance > 0 && (
          <Button size="lg" className="gap-2" onClick={() => router.push(`/transfers/create?tokenId=${token.id}`)}>
            <Send className="h-5 w-5" />
            Transfer
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Balance Card */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle>Your Balance</CardTitle>
              <CardDescription>Amount of this token you currently own</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-700">
                {balance}
                <span className="text-xl text-green-600 ml-2">/ {token.totalSupply}</span>
              </div>
              <div className="mt-2 text-sm text-green-600">
                {balance === 0 && "You don't own any of this token"}
                {balance > 0 && balance < token.totalSupply && `You own ${((balance / token.totalSupply) * 100).toFixed(1)}% of total supply`}
                {balance === token.totalSupply && 'You own the entire supply'}
              </div>
            </CardContent>
          </Card>

          {/* Features Card */}
          {features && Object.keys(features).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Features & Metadata</CardTitle>
                <CardDescription>Additional information about this token</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(features).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {key}
                      </span>
                      <span className="text-sm text-gray-900">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Raw Features JSON */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Raw Features (JSON)</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-x-auto font-mono">
                {JSON.stringify(features || {}, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Information */}
        <div className="space-y-6">
          {/* Supply Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Supply Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Total Supply</div>
                <div className="text-2xl font-bold text-gray-900">{token.totalSupply}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Your Balance</div>
                <div className="text-2xl font-bold text-green-600">{balance}</div>
              </div>
            </CardContent>
          </Card>

          {/* Creator Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Creator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded block break-all">
                  {truncateAddress(token.creator)}
                </code>
                {isCreator && (
                  <Badge variant="success" className="mt-2 text-xs">
                    You created this token
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Creation Date */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Created
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-700">
                {formatDate(token.dateCreated)}
              </div>
            </CardContent>
          </Card>

          {/* Parent Token */}
          {token.parentId > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4" />
                  Parent Token
                </CardTitle>
                <CardDescription>This is a derived product</CardDescription>
              </CardHeader>
              <CardContent>
                {parentToken ? (
                  <Link href={`/tokens/${parentToken.id}`}>
                    <Button variant="outline" className="w-full justify-between" size="sm">
                      <span className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        {parentToken.name}
                      </span>
                      <Badge variant="warning" className="text-xs">
                        #{parentToken.id}
                      </Badge>
                    </Button>
                  </Link>
                ) : (
                  <div className="text-sm text-gray-600">
                    Parent Token #{token.parentId}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Parse features JSON safely
 */
function parseFeatures(features: string): Record<string, any> | null {
  try {
    return JSON.parse(features);
  } catch {
    return null;
  }
}

