'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '@/contexts/Web3Context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Package, Info } from 'lucide-react';

interface Token {
  id: number;
  name: string;
  totalSupply: number;
  balance: number;
}

/**
 * Create Token Page
 * Allows users to create new tokens based on their role
 */
export default function CreateTokenPage() {
  const router = useRouter();
  const { isConnected, isLoading, account, userInfo, isApproved } = useWeb3();
  const [name, setName] = useState('');
  const [totalSupply, setTotalSupply] = useState('');
  const [features, setFeatures] = useState('');
  const [parentId, setParentId] = useState('0');
  const [availableTokens, setAvailableTokens] = useState<Token[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userRole = userInfo?.role || '';
  const isProducer = userRole === 'Producer';
  const needsParentToken = userRole === 'Factory' || userRole === 'Retailer';

  // Check access
  useEffect(() => {
    if (!isLoading && !isConnected) {
      router.push('/');
    }
    if (!isLoading && isConnected && !isApproved) {
      router.push('/');
    }
    if (!isLoading && isConnected && isApproved && userRole === 'Consumer') {
      router.push('/tokens');
    }
  }, [isLoading, isConnected, isApproved, userRole, router]);

  // Fetch available tokens for parent selection
  useEffect(() => {
    async function fetchTokens() {
      if (!needsParentToken || !account) return;

      try {
        setIsLoadingTokens(true);
        const { web3Service } = await import('@/lib/web3');
        
        const tokenIds = await web3Service.getUserTokens(account);
        const tokenDetails = await Promise.all(
          tokenIds.map(async (tokenId) => {
            const token = await web3Service.getToken(tokenId);
            const balance = await web3Service.getTokenBalance(tokenId, account);
            return {
              id: token.id,
              name: token.name,
              totalSupply: token.totalSupply,
              balance,
            };
          })
        );

        // Filter tokens with balance > 0
        setAvailableTokens(tokenDetails.filter(t => t.balance > 0));
      } catch (err) {
        console.error('Error fetching tokens:', err);
      } finally {
        setIsLoadingTokens(false);
      }
    }

    fetchTokens();
  }, [needsParentToken, account]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Please enter a token name');
      return;
    }
    if (!totalSupply || parseInt(totalSupply) <= 0) {
      setError('Please enter a valid total supply');
      return;
    }
    if (needsParentToken && parentId === '0') {
      setError('Please select a parent token');
      return;
    }

    // Validate features JSON
    let parsedFeatures = features.trim() || '{}';
    if (parsedFeatures) {
      try {
        JSON.parse(parsedFeatures);
      } catch {
        setError('Features must be valid JSON format. Example: {"origin": "Spain", "type": "wheat"}');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const { web3Service } = await import('@/lib/web3');
      
      await web3Service.createToken(
        name.trim(),
        parseInt(totalSupply),
        parsedFeatures,
        parseInt(parentId)
      );

      // Wait for transaction to be mined
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Redirect to tokens page
      router.push('/tokens');
    } catch (err: unknown) {
      console.error('Error creating token:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create token';
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  // Show loading while checking permissions
  if (isLoading || !isConnected || !isApproved) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create New Token
        </h1>
        <p className="text-gray-600">
          {isProducer && 'Create a new raw material token'}
          {userRole === 'Factory' && 'Create a new processed product token'}
          {userRole === 'Retailer' && 'Create a new retail package token'}
        </p>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Token Information
            </CardTitle>
            <CardDescription>
              Fill in the details for your new token
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Token Name *</Label>
                <Input
                  id="name"
                  placeholder={
                    isProducer 
                      ? "e.g., Organic Wheat" 
                      : userRole === 'Factory'
                      ? "e.g., Wheat Flour"
                      : "e.g., Flour Package 1kg"
                  }
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Total Supply */}
              <div className="space-y-2">
                <Label htmlFor="totalSupply">Total Supply *</Label>
                <Input
                  id="totalSupply"
                  type="number"
                  placeholder="e.g., 1000"
                  value={totalSupply}
                  onChange={(e) => setTotalSupply(e.target.value)}
                  disabled={isSubmitting}
                  min="1"
                />
                <p className="text-xs text-gray-500">
                  The total number of units for this token
                </p>
              </div>

              {/* Parent Token Selection (Factory/Retailer only) */}
              {needsParentToken && (
                <div className="space-y-2">
                  <Label htmlFor="parentId">Parent Token *</Label>
                  {isLoadingTokens ? (
                    <div className="flex items-center gap-2 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-gray-600">Loading your tokens...</span>
                    </div>
                  ) : availableTokens.length === 0 ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        You don&apos;t have any tokens yet. You need to receive tokens from a previous step in the supply chain before creating derived products.
                      </p>
                    </div>
                  ) : (
                    <>
                      <select
                        id="parentId"
                        value={parentId}
                        onChange={(e) => setParentId(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="0">Select a parent token</option>
                        {availableTokens.map((token) => (
                          <option key={token.id} value={token.id}>
                            #{token.id} - {token.name} (Balance: {token.balance})
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500">
                        Select the token that this product is derived from
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Features */}
              <div className="space-y-2">
                <Label htmlFor="features">Features (JSON format)</Label>
                <textarea
                  id="features"
                  rows={4}
                  placeholder='{"origin": "Spain", "type": "wheat", "certification": "organic"}'
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex items-start gap-2 text-xs text-gray-500">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">JSON Format Examples:</p>
                    {isProducer && (
                      <p>&#123;&quot;origin&quot;: &quot;Spain&quot;, &quot;type&quot;: &quot;wheat&quot;, &quot;certification&quot;: &quot;organic&quot;&#125;</p>
                    )}
                    {userRole === 'Factory' && (
                      <p>&#123;&quot;process&quot;: &quot;milled&quot;, &quot;quality&quot;: &quot;premium&quot;, &quot;date&quot;: &quot;2024-01-15&quot;&#125;</p>
                    )}
                    {userRole === 'Retailer' && (
                      <p>&#123;&quot;package&quot;: &quot;1kg&quot;, &quot;brand&quot;: &quot;MyBrand&quot;, &quot;price&quot;: &quot;5.99&quot;&#125;</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || (needsParentToken && availableTokens.length === 0)}
                  size="lg"
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Token...
                    </>
                  ) : (
                    'Create Token'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/tokens')}
                  disabled={isSubmitting}
                  size="lg"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Helper Information */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Token Creation Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-900">
            {isProducer && (
              <>
                <p>• As a <strong>Producer</strong>, you create raw material tokens</p>
                <p>• These tokens represent the origin of the supply chain</p>
                <p>• You can transfer them to Factories for processing</p>
              </>
            )}
            {userRole === 'Factory' && (
              <>
                <p>• As a <strong>Factory</strong>, you create processed product tokens</p>
                <p>• You must select a parent token (raw material from Producer)</p>
                <p>• Your tokens can be transferred to Retailers</p>
              </>
            )}
            {userRole === 'Retailer' && (
              <>
                <p>• As a <strong>Retailer</strong>, you create retail package tokens</p>
                <p>• You must select a parent token (processed product from Factory)</p>
                <p>• Your tokens can be transferred to Consumers</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

