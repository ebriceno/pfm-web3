'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '@/contexts/Web3Context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, ArrowRightLeft, Check, X, RefreshCcw, Clock, CheckCircle, XCircle } from 'lucide-react';
import { truncateAddress, formatDate, getStatusBadgeVariant } from '@/lib/utils';

interface Transfer {
  id: number;
  tokenId: number;
  from: string;
  to: string;
  amount: number;
  status: number; // 0: Pending, 1: Accepted, 2: Rejected
  dateCreated: number;
}

interface TokenInfo {
  id: number;
  name: string;
}

interface TransferWithToken extends Transfer {
  tokenName: string;
}

/**
 * Transfers Page
 * Shows pending transfers (to accept/reject) and transfer history
 */
export default function TransfersPage() {
  const router = useRouter();
  const { isConnected, isLoading, account, userInfo, isApproved } = useWeb3();
  const [transfers, setTransfers] = useState<TransferWithToken[]>([]);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(true);
  const [processingTransferId, setProcessingTransferId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const userRole = userInfo?.role || '';
  const canTransfer = userRole !== 'Consumer';

  // Check access
  useEffect(() => {
    if (!isLoading && !isConnected) {
      router.push('/');
    }
    if (!isLoading && isConnected && !isApproved) {
      router.push('/');
    }
  }, [isLoading, isConnected, isApproved, router]);

  // Fetch transfers
  const fetchTransfers = async () => {
    if (!isConnected || !account) return;

    try {
      setIsLoadingTransfers(true);
      const { web3Service } = await import('@/lib/web3');
      
      // Get user's transfer IDs
      const transferIds = await web3Service.getUserTransfers(account);
      
      // Fetch details for each transfer
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

      // Sort by dateCreated (most recent first)
      transferDetails.sort((a, b) => b.dateCreated - a.dateCreated);

      setTransfers(transferDetails);
    } catch (error) {
      console.error('Error fetching transfers:', error);
    } finally {
      setIsLoadingTransfers(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [isConnected, account]);

  // Accept transfer
  const handleAccept = async (transferId: number) => {
    try {
      setProcessingTransferId(transferId);
      const { web3Service } = await import('@/lib/web3');
      await web3Service.acceptTransfer(transferId);
      
      // Wait for transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refresh transfers
      await fetchTransfers();
    } catch (error: unknown) {
      console.error('Error accepting transfer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to accept transfer';
      alert(errorMessage);
    } finally {
      setProcessingTransferId(null);
    }
  };

  // Reject transfer
  const handleReject = async (transferId: number) => {
    try {
      setProcessingTransferId(transferId);
      const { web3Service } = await import('@/lib/web3');
      await web3Service.rejectTransfer(transferId);
      
      // Wait for transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refresh transfers
      await fetchTransfers();
    } catch (error: unknown) {
      console.error('Error rejecting transfer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject transfer';
      alert(errorMessage);
    } finally {
      setProcessingTransferId(null);
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

  // Filter transfers
  const pendingTransfers = transfers.filter(t => t.status === 0 && t.to.toLowerCase() === account?.toLowerCase());
  const filteredTransfers = filter === 'all' 
    ? transfers 
    : filter === 'pending'
    ? transfers.filter(t => t.status === 0)
    : transfers.filter(t => t.status !== 0);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Transfers
          </h1>
          <p className="text-gray-600">
            View and manage your token transfers
          </p>
        </div>
        
        {canTransfer && (
          <Button
            onClick={() => router.push('/transfers/create')}
            size="lg"
            className="gap-2"
          >
            <Plus className="h-5 w-5" />
            New Transfer
          </Button>
        )}
      </div>

      {/* Stats */}
      {!isLoadingTransfers && transfers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Transfers"
            value={transfers.length}
            icon={<ArrowRightLeft className="h-5 w-5 text-blue-600" />}
          />
          <StatCard
            label="Pending"
            value={transfers.filter(t => t.status === 0).length}
            icon={<Clock className="h-5 w-5 text-yellow-600" />}
          />
          <StatCard
            label="Accepted"
            value={transfers.filter(t => t.status === 1).length}
            icon={<CheckCircle className="h-5 w-5 text-green-600" />}
          />
          <StatCard
            label="Rejected"
            value={transfers.filter(t => t.status === 2).length}
            icon={<XCircle className="h-5 w-5 text-red-600" />}
          />
        </div>
      )}

      {/* Pending Transfers Alert */}
      {pendingTransfers.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800 font-semibold mb-2">
            <Clock className="h-5 w-5" />
            You have {pendingTransfers.length} pending transfer{pendingTransfers.length !== 1 ? 's' : ''} to review
          </div>
          <p className="text-sm text-yellow-700">
            Review and accept or reject incoming transfers below
          </p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          All ({transfers.length})
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilter('pending')}
          size="sm"
        >
          Pending ({transfers.filter(t => t.status === 0).length})
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          onClick={() => setFilter('completed')}
          size="sm"
        >
          Completed ({transfers.filter(t => t.status !== 0).length})
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTransfers}
          disabled={isLoadingTransfers}
          className="ml-auto"
        >
          <RefreshCcw className={`h-4 w-4 ${isLoadingTransfers ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Transfers List */}
      {isLoadingTransfers ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
        </div>
      ) : filteredTransfers.length === 0 ? (
        <EmptyState 
          canCreate={canTransfer}
          onCreateClick={() => router.push('/transfers/create')}
        />
      ) : (
        <div className="space-y-4">
          {filteredTransfers.map((transfer) => (
            <TransferCard
              key={transfer.id}
              transfer={transfer}
              currentAccount={account || ''}
              onAccept={handleAccept}
              onReject={handleReject}
              isProcessing={processingTransferId === transfer.id}
            />
          ))}
        </div>
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
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <ArrowRightLeft className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No transfers yet
        </h3>
        {canCreate ? (
          <>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              You haven&apos;t made or received any transfers yet. Create your first transfer to move tokens in the supply chain.
            </p>
            <Button onClick={onCreateClick} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Create Your First Transfer
            </Button>
          </>
        ) : (
          <p className="text-gray-600 text-center max-w-md">
            You haven&apos;t received any transfers yet. Transfers will appear here once other participants send you tokens.
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
      <CardContent className="flex items-center justify-between py-4">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        {icon}
      </CardContent>
    </Card>
  );
}

/**
 * TransferCard Component
 */
interface TransferCardProps {
  transfer: TransferWithToken;
  currentAccount: string;
  onAccept: (transferId: number) => void;
  onReject: (transferId: number) => void;
  isProcessing: boolean;
}

function TransferCard({ transfer, currentAccount, onAccept, onReject, isProcessing }: TransferCardProps) {
  const isRecipient = transfer.to.toLowerCase() === currentAccount.toLowerCase();
  const isSender = transfer.from.toLowerCase() === currentAccount.toLowerCase();
  const isPending = transfer.status === 0;
  const canRespond = isRecipient && isPending;

  return (
    <Card className={isPending && isRecipient ? 'border-2 border-yellow-300' : ''}>
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4">
          {/* Transfer Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ArrowRightLeft className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {transfer.tokenName}
                </h3>
                <p className="text-sm text-gray-600">
                  Transfer #{transfer.id} • {transfer.amount} units
                </p>
              </div>
              <Badge variant={getStatusBadgeVariant(transfer.status)}>
                {transfer.status === 0 && 'Pending'}
                {transfer.status === 1 && 'Accepted'}
                {transfer.status === 2 && 'Rejected'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">From:</span>
                <p className="font-medium">
                  {truncateAddress(transfer.from)}
                  {isSender && <span className="text-green-600 ml-2">(You)</span>}
                </p>
              </div>
              <div>
                <span className="text-gray-600">To:</span>
                <p className="font-medium">
                  {truncateAddress(transfer.to)}
                  {isRecipient && <span className="text-blue-600 ml-2">(You)</span>}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Date:</span>
                <p className="font-medium">{formatDate(transfer.dateCreated)}</p>
              </div>
              <div>
                <span className="text-gray-600">Token ID:</span>
                <p className="font-medium">#{transfer.tokenId}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          {canRespond && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onAccept(transfer.id)}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="mr-1 h-4 w-4" />
                    Accept
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReject(transfer.id)}
                disabled={isProcessing}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <X className="mr-1 h-4 w-4" />
                    Reject
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

