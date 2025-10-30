'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWeb3 } from '@/contexts/Web3Context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Send, Package, Info } from 'lucide-react';
import { isValidAddress } from '@/lib/utils';
import { VALID_TRANSFERS } from '@/contracts/config';

interface Token {
  id: number;
  name: string;
  balance: number;
}

/**
 * Create Transfer Page
 * Allows users to initiate transfers to other participants
 */
export default function CreateTransferPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CreateTransferForm />
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
    </div>
  );
}

function CreateTransferForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isConnected, isLoading, account, userInfo, isApproved } = useWeb3();
  
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedTokenId, setSelectedTokenId] = useState<string>('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userRole = userInfo?.role || '';
  const canTransfer = userRole !== 'Consumer';

  // Pre-select token from URL params
  useEffect(() => {
    const tokenId = searchParams.get('tokenId');
    if (tokenId) {
      setSelectedTokenId(tokenId);
    }
  }, [searchParams]);

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

  // Fetch user's tokens
  useEffect(() => {
    async function fetchTokens() {
      if (!account) return;

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
              balance,
            };
          })
        );

        // Filter tokens with balance > 0
        setTokens(tokenDetails.filter(t => t.balance > 0));
      } catch (err) {
        console.error('Error fetching tokens:', err);
      } finally {
        setIsLoadingTokens(false);
      }
    }

    fetchTokens();
  }, [account]);

  // Get selected token details
  const selectedToken = tokens.find(t => t.id === parseInt(selectedTokenId));

  // Get valid recipient roles based on user role
  const validRecipientRoles = userRole ? VALID_TRANSFERS[userRole as keyof typeof VALID_TRANSFERS] : [];

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!selectedTokenId) {
      setError('Please select a token');
      return;
    }
    if (!recipientAddress.trim()) {
      setError('Please enter recipient address');
      return;
    }
    if (!isValidAddress(recipientAddress)) {
      setError('Invalid Ethereum address format');
      return;
    }
    if (recipientAddress.toLowerCase() === account?.toLowerCase()) {
      setError('Cannot transfer to yourself');
      return;
    }
    if (!amount || parseInt(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (selectedToken && parseInt(amount) > selectedToken.balance) {
      setError(`Insufficient balance. You have ${selectedToken.balance} units`);
      return;
    }

    try {
      setIsSubmitting(true);
      const { web3Service } = await import('@/lib/web3');
      
      await web3Service.transfer(
        recipientAddress,
        parseInt(selectedTokenId),
        parseInt(amount)
      );

      // Wait for transaction to be mined
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Redirect to transfers page
      router.push('/transfers');
    } catch (err: unknown) {
      console.error('Error creating transfer:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create transfer';
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
          Create Transfer
        </h1>
        <p className="text-gray-600">
          Transfer tokens to another participant in the supply chain
        </p>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Transfer Details
            </CardTitle>
            <CardDescription>
              Fill in the transfer information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTokens ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
              </div>
            ) : tokens.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  You don&apos;t have any tokens with balance to transfer
                </p>
                <Button onClick={() => router.push('/tokens')} variant="outline">
                  View Tokens
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Token Selection */}
                <div className="space-y-2">
                  <Label htmlFor="token">Select Token *</Label>
                  <select
                    id="token"
                    value={selectedTokenId}
                    onChange={(e) => setSelectedTokenId(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a token</option>
                    {tokens.map((token) => (
                      <option key={token.id} value={token.id}>
                        #{token.id} - {token.name} (Balance: {token.balance})
                      </option>
                    ))}
                  </select>
                  {selectedToken && (
                    <p className="text-xs text-gray-500">
                      Available balance: {selectedToken.balance} units
                    </p>
                  )}
                </div>

                {/* Recipient Address */}
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient Address *</Label>
                  <Input
                    id="recipient"
                    placeholder="0x..."
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500">
                    Enter the Ethereum address of the recipient
                  </p>
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="e.g., 100"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={isSubmitting}
                    min="1"
                    max={selectedToken?.balance}
                  />
                  <p className="text-xs text-gray-500">
                    Number of units to transfer
                  </p>
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
                    disabled={isSubmitting || tokens.length === 0}
                    size="lg"
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Transfer...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Create Transfer
                      </>
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
            )}
          </CardContent>
        </Card>

        {/* Helper Information */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Transfer Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-900">
            <p>• As a <strong>{userRole}</strong>, you can transfer to: <strong>{validRecipientRoles.join(', ')}</strong></p>
            <p>• The transfer will be <strong>pending</strong> until the recipient accepts it</p>
            <p>• The recipient can accept or reject the transfer</p>
            <p>• Your balance will only update after the recipient accepts</p>
            <p>• Make sure you enter the correct recipient address</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

