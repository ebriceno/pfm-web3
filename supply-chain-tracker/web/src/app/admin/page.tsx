'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '@/contexts/Web3Context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Package, ArrowRightLeft, UserCheck, UserX, Clock } from 'lucide-react';

/**
 * Admin Dashboard Page
 * Only accessible by admin users
 */
export default function AdminPage() {
  const router = useRouter();
  const { isConnected, isAdmin, isLoading, account } = useWeb3();
  const [statistics, setStatistics] = useState({
    totalUsers: 0,
    totalTokens: 0,
    totalTransfers: 0,
  });
  const [userStats, setUserStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Check admin access
  useEffect(() => {
    if (!isLoading && !isConnected) {
      router.push('/');
    }
    if (!isLoading && isConnected && !isAdmin) {
      router.push('/dashboard');
    }
  }, [isLoading, isConnected, isAdmin, router]);

  // Fetch statistics
  useEffect(() => {
    async function fetchData() {
      if (!isConnected || !isAdmin) return;

      try {
        setIsLoadingData(true);
        const { web3Service } = await import('@/lib/web3');
        
        // Get overall statistics
        const stats = await web3Service.getStatistics();
        setStatistics(stats);

        // Get all users to calculate status breakdown
        const users = await web3Service.getAllUsers();
        const pending = users.filter(u => u.status === 0).length;
        const approved = users.filter(u => u.status === 1).length;
        const rejected = users.filter(u => u.status === 2).length;

        setUserStats({ pending, approved, rejected });
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setIsLoadingData(false);
      }
    }

    fetchData();
  }, [isConnected, isAdmin]);

  // Show loading while checking permissions
  if (isLoading || !isConnected || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          👑 Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Manage users, monitor the supply chain, and view system statistics
        </p>
      </div>

      {/* Statistics Grid */}
      {isLoadingData ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
        </div>
      ) : (
        <>
          {/* Overall Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Total Users"
              value={statistics.totalUsers}
              icon={<Users className="h-6 w-6 text-blue-600" />}
              description={`${userStats.pending} pending approval`}
              color="blue"
            />
            <StatCard
              title="Total Tokens"
              value={statistics.totalTokens}
              icon={<Package className="h-6 w-6 text-green-600" />}
              description="Created in the system"
              color="green"
            />
            <StatCard
              title="Total Transfers"
              value={statistics.totalTransfers}
              icon={<ArrowRightLeft className="h-6 w-6 text-purple-600" />}
              description="Across the supply chain"
              color="purple"
            />
          </div>

          {/* User Status Breakdown */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>User Status Breakdown</CardTitle>
              <CardDescription>Distribution of users by approval status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatusCard
                  label="Pending"
                  count={userStats.pending}
                  icon={<Clock className="h-5 w-5" />}
                  color="yellow"
                />
                <StatusCard
                  label="Approved"
                  count={userStats.approved}
                  icon={<UserCheck className="h-5 w-5" />}
                  color="green"
                />
                <StatusCard
                  label="Rejected"
                  count={userStats.rejected}
                  icon={<UserX className="h-5 w-5" />}
                  color="red"
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => router.push('/admin/users')}
                className="w-full justify-start"
                size="lg"
                variant={userStats.pending > 0 ? 'default' : 'outline'}
              >
                <Users className="mr-2 h-5 w-5" />
                Manage Users
                {userStats.pending > 0 && (
                  <span className="ml-auto bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                    {userStats.pending} pending
                  </span>
                )}
              </Button>
              
              <Button
                onClick={() => router.push('/tokens')}
                className="w-full justify-start"
                size="lg"
                variant="outline"
              >
                <Package className="mr-2 h-5 w-5" />
                View All Tokens
              </Button>

              <Button
                onClick={() => router.push('/transfers')}
                className="w-full justify-start"
                size="lg"
                variant="outline"
              >
                <ArrowRightLeft className="mr-2 h-5 w-5" />
                View All Transfers
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

/**
 * StatCard Component
 */
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
  color: 'blue' | 'green' | 'purple';
}

function StatCard({ title, value, icon, description, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
  };

  return (
    <Card className={`${colorClasses[color]} border-2`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {value}
        </div>
        <p className="text-xs text-gray-600">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * StatusCard Component
 */
interface StatusCardProps {
  label: string;
  count: number;
  icon: React.ReactNode;
  color: 'yellow' | 'green' | 'red';
}

function StatusCard({ label, count, icon, color }: StatusCardProps) {
  const colorClasses = {
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className={`flex items-center gap-3 p-4 rounded-lg border ${colorClasses[color]}`}>
      {icon}
      <div>
        <div className="text-2xl font-bold">{count}</div>
        <div className="text-sm font-medium">{label}</div>
      </div>
    </div>
  );
}

