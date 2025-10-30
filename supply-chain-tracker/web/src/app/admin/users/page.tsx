'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '@/contexts/Web3Context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, RefreshCcw, ArrowLeft } from 'lucide-react';
import { truncateAddress, getRoleBadgeVariant, getStatusBadgeVariant } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  userAddress: string;
  role: string;
  status: number;
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

/**
 * User Management Page
 * Allows admin to view and manage all users
 */
export default function AdminUsersPage() {
  const router = useRouter();
  const { isConnected, isAdmin, isLoading } = useWeb3();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [processingUserId, setProcessingUserId] = useState<number | null>(null);

  // Check admin access
  useEffect(() => {
    if (!isLoading && !isConnected) {
      router.push('/');
    }
    if (!isLoading && isConnected && !isAdmin) {
      router.push('/dashboard');
    }
  }, [isLoading, isConnected, isAdmin, router]);

  // Fetch users
  const fetchUsers = async () => {
    if (!isConnected || !isAdmin) return;

    try {
      setIsLoadingUsers(true);
      const { web3Service } = await import('@/lib/web3');
      const allUsers = await web3Service.getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [isConnected, isAdmin]);

  // Apply filter
  useEffect(() => {
    if (filter === 'all') {
      setFilteredUsers(users);
    } else if (filter === 'pending') {
      setFilteredUsers(users.filter(u => u.status === 0));
    } else if (filter === 'approved') {
      setFilteredUsers(users.filter(u => u.status === 1));
    } else if (filter === 'rejected') {
      setFilteredUsers(users.filter(u => u.status === 2));
    }
  }, [users, filter]);

  const { toast } = useToast();

  // Approve user
  const handleApprove = async (user: User) => {
    try {
      setProcessingUserId(user.id);
      const { web3Service } = await import('@/lib/web3');
      await web3Service.changeUserStatus(user.userAddress, 1); // 1 = Approved
      
      toast({
        title: 'User Approved',
        description: `${truncateAddress(user.userAddress)} has been approved as ${user.role}`,
        variant: 'success',
      });
      
      // Wait a moment for transaction to be mined
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh users list
      await fetchUsers();
    } catch (error: unknown) {
      console.error('Error approving user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve user';
      toast({
        title: 'Approval Failed',
        description: errorMessage,
        variant: 'danger',
      });
    } finally {
      setProcessingUserId(null);
    }
  };

  // Reject user
  const handleReject = async (user: User) => {
    try {
      setProcessingUserId(user.id);
      const { web3Service } = await import('@/lib/web3');
      await web3Service.changeUserStatus(user.userAddress, 2); // 2 = Rejected
      
      toast({
        title: 'User Rejected',
        description: `${truncateAddress(user.userAddress)} has been rejected`,
        variant: 'warning',
      });
      
      // Wait a moment for transaction to be mined
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh users list
      await fetchUsers();
    } catch (error: unknown) {
      console.error('Error rejecting user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject user';
      toast({
        title: 'Rejection Failed',
        description: errorMessage,
        variant: 'danger',
      });
    } finally {
      setProcessingUserId(null);
    }
  };

  // Show loading while checking permissions
  if (isLoading || !isConnected || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  const pendingCount = users.filter(u => u.status === 0).length;
  const approvedCount = users.filter(u => u.status === 1).length;
  const rejectedCount = users.filter(u => u.status === 2).length;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          onClick={() => router.push('/admin')}
          variant="outline"
          size="sm"
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              User Management
            </h1>
            <p className="text-gray-600">
              Review and manage user registrations
            </p>
          </div>
          
          <Button
            onClick={fetchUsers}
            variant="outline"
            disabled={isLoadingUsers}
          >
            <RefreshCcw className={`mr-2 h-4 w-4 ${isLoadingUsers ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <FilterButton
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          label="All Users"
          count={users.length}
        />
        <FilterButton
          active={filter === 'pending'}
          onClick={() => setFilter('pending')}
          label="Pending"
          count={pendingCount}
          variant="warning"
        />
        <FilterButton
          active={filter === 'approved'}
          onClick={() => setFilter('approved')}
          label="Approved"
          count={approvedCount}
          variant="success"
        />
        <FilterButton
          active={filter === 'rejected'}
          onClick={() => setFilter('rejected')}
          label="Rejected"
          count={rejectedCount}
          variant="danger"
        />
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filter === 'all' && 'All Users'}
            {filter === 'pending' && 'Pending Approvals'}
            {filter === 'approved' && 'Approved Users'}
            {filter === 'rejected' && 'Rejected Users'}
          </CardTitle>
          <CardDescription>
            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No users found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Address</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <span className="font-mono text-sm text-gray-600">#{user.id}</span>
                      </td>
                      <td className="py-4 px-4">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {truncateAddress(user.userAddress)}
                        </code>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={getStatusBadgeVariant(user.status)}>
                          {user.status === 0 && 'Pending'}
                          {user.status === 1 && 'Approved'}
                          {user.status === 2 && 'Rejected'}
                          {user.status === 3 && 'Canceled'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2 justify-end">
                          {user.status === 0 && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(user)}
                                disabled={processingUserId === user.id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {processingUserId === user.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Check className="mr-1 h-4 w-4" />
                                    Approve
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReject(user)}
                                disabled={processingUserId === user.id}
                                className="border-red-300 text-red-600 hover:bg-red-50"
                              >
                                {processingUserId === user.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <X className="mr-1 h-4 w-4" />
                                    Reject
                                  </>
                                )}
                              </Button>
                            </>
                          )}
                          {user.status === 1 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(user)}
                              disabled={processingUserId === user.id}
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              {processingUserId === user.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <X className="mr-1 h-4 w-4" />
                                  Revoke
                                </>
                              )}
                            </Button>
                          )}
                          {user.status === 2 && (
                            <Button
                              size="sm"
                              onClick={() => handleApprove(user)}
                              disabled={processingUserId === user.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {processingUserId === user.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Check className="mr-1 h-4 w-4" />
                                  Approve
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * FilterButton Component
 */
interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  variant?: 'default' | 'warning' | 'success' | 'danger';
}

function FilterButton({ active, onClick, label, count, variant = 'default' }: FilterButtonProps) {
  const variantClasses = {
    default: active ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    warning: active ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
    success: active ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200',
    danger: active ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200',
  };

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${variantClasses[variant]}`}
    >
      {label} ({count})
    </button>
  );
}

