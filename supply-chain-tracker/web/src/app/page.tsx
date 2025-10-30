'use client';

import React, { useState } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { isConnected, isLoading, connectWallet } = useWeb3();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <p className="text-lg text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Welcome to Supply Chain Tracker
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              A blockchain-based supply chain tracking DApp built with Ethereum
            </p>
            <Button onClick={connectWallet} size="lg" className="gap-2">
              <span>🔗</span>
              Connect MetaMask to Get Started
            </Button>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>👨‍🌾</span>
                  For Producers
                </CardTitle>
                <CardDescription>
                  Register raw materials and track them through the supply chain
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>🏭</span>
                  For Factories & Retailers
                </CardTitle>
                <CardDescription>
                  Transform materials into products and distribute to consumers
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>🛒</span>
                  For Consumers
                </CardTitle>
                <CardDescription>
                  View complete traceability of products from origin to shelf
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* How it Works */}
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
              <CardDescription>
                Four simple steps to get started with Supply Chain Tracker
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Connect Your Wallet</h4>
                  <p className="text-sm text-gray-600">
                    Use MetaMask to connect to the Anvil local network
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Request a Role</h4>
                  <p className="text-sm text-gray-600">
                    Choose your role: Producer, Factory, Retailer, or Consumer
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Wait for Approval</h4>
                  <p className="text-sm text-gray-600">
                    Admin will approve your request to join the network
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Start Tracking</h4>
                  <p className="text-sm text-gray-600">
                    Create tokens, transfer products, and track the full supply chain
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Connected - handle different user states
  return <AuthenticatedView />;
}

/**
 * Authenticated View - Handles different user states
 */
function AuthenticatedView() {
  const { userInfo } = useWeb3();

  // Not registered - show registration form
  if (!userInfo) {
    return <RegistrationForm />;
  }

  // Pending approval - show waiting screen
  if (userInfo.status === 0) {
    return <PendingApproval />;
  }

  // Rejected - show rejection message
  if (userInfo.status === 2) {
    return <RejectedStatus />;
  }

  // Approved - show welcome and redirect
  if (userInfo.status === 1) {
    return <ApprovedWelcome />;
  }

  // Cancelled or unknown status
  return (
    <div className="container mx-auto px-4 py-16">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Unknown Status</CardTitle>
          <CardDescription>
            Your account has an unknown status. Please contact support.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

/**
 * Step 3.2: Registration Form
 */
function RegistrationForm() {
  const { refreshUserInfo } = useWeb3();
  const [selectedRole, setSelectedRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { web3Service } = await import('@/lib/web3');
      await web3Service.requestUserRole(selectedRole);
      
      // Wait a moment for transaction to be mined
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh user info
      await refreshUserInfo();
    } catch (err: unknown) {
      console.error('Registration error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to register. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Register Your Role</CardTitle>
            <CardDescription>
              Choose your role in the supply chain to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Selection */}
              <div className="space-y-4">
                <label className="block">
                  <input
                    type="radio"
                    name="role"
                    value="Producer"
                    checked={selectedRole === 'Producer'}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="mr-3"
                  />
                  <span className="text-lg">👨‍🌾 <strong>Producer</strong></span>
                  <p className="ml-7 text-sm text-gray-600">
                    Register raw materials and start the supply chain
                  </p>
                </label>

                <label className="block">
                  <input
                    type="radio"
                    name="role"
                    value="Factory"
                    checked={selectedRole === 'Factory'}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="mr-3"
                  />
                  <span className="text-lg">🏭 <strong>Factory</strong></span>
                  <p className="ml-7 text-sm text-gray-600">
                    Transform raw materials into products
                  </p>
                </label>

                <label className="block">
                  <input
                    type="radio"
                    name="role"
                    value="Retailer"
                    checked={selectedRole === 'Retailer'}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="mr-3"
                  />
                  <span className="text-lg">🏪 <strong>Retailer</strong></span>
                  <p className="ml-7 text-sm text-gray-600">
                    Distribute products to consumers
                  </p>
                </label>

                <label className="block">
                  <input
                    type="radio"
                    name="role"
                    value="Consumer"
                    checked={selectedRole === 'Consumer'}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="mr-3"
                  />
                  <span className="text-lg">🛒 <strong>Consumer</strong></span>
                  <p className="ml-7 text-sm text-gray-600">
                    View product traceability and history
                  </p>
                </label>
              </div>

              {/* Error message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {error}
                </div>
              )}

              {/* Submit button */}
              <Button
                type="submit"
                disabled={!selectedRole || isSubmitting}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Registration'
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Your registration will be reviewed by an administrator
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Step 3.3: Pending Approval Screen
 */
function PendingApproval() {
  const { userInfo, refreshUserInfo } = useWeb3();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshUserInfo();
    setIsRefreshing(false);
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">⏳</span>
              </div>
            </div>
            <CardTitle>Registration Pending</CardTitle>
            <CardDescription>
              Your request to join as a <strong>{userInfo?.role}</strong> is awaiting approval
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>What happens next?</strong>
              </p>
              <ul className="mt-2 space-y-1 text-sm text-yellow-700 list-disc list-inside">
                <li>An administrator will review your registration</li>
                <li>You will be notified once approved</li>
                <li>You can check your status anytime by refreshing</li>
              </ul>
            </div>

            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              className="w-full"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                'Check Status'
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              Note: If you&apos;re testing locally, you can approve yourself using the admin account
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Step 3.4: Approved Welcome Screen
 */
function ApprovedWelcome() {
  const { userInfo, isAdmin } = useWeb3();
  const [redirecting, setRedirecting] = useState(false);

  // Auto-redirect after 3 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setRedirecting(true);
      window.location.href = '/dashboard';
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">✅</span>
              </div>
            </div>
            <CardTitle className="text-2xl">Welcome to Supply Chain Tracker!</CardTitle>
            <CardDescription>
              Your account has been approved as a <strong>{userInfo?.role}</strong>
              {isAdmin && <span className="block mt-2 text-red-600 font-semibold">You are also an Administrator</span>}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>You can now:</strong>
              </p>
              <ul className="mt-2 space-y-1 text-sm text-green-700 list-disc list-inside">
                {userInfo?.role === 'Producer' && (
                  <>
                    <li>Create raw material tokens</li>
                    <li>Transfer materials to factories</li>
                    <li>Track your products through the supply chain</li>
                  </>
                )}
                {userInfo?.role === 'Factory' && (
                  <>
                    <li>Receive raw materials from producers</li>
                    <li>Create derived product tokens</li>
                    <li>Transfer products to retailers</li>
                  </>
                )}
                {userInfo?.role === 'Retailer' && (
                  <>
                    <li>Receive products from factories</li>
                    <li>Create retail packages</li>
                    <li>Transfer products to consumers</li>
                  </>
                )}
                {userInfo?.role === 'Consumer' && (
                  <>
                    <li>Receive products from retailers</li>
                    <li>View complete product traceability</li>
                    <li>Track products from origin to shelf</li>
                  </>
                )}
                {isAdmin && <li className="font-semibold">Manage user registrations and approvals</li>}
              </ul>
            </div>

            <div className="text-center">
              {redirecting ? (
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Redirecting to dashboard...</span>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Redirecting to dashboard in a few seconds...
                </p>
              )}
            </div>

            <Button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full"
              size="lg"
            >
              Go to Dashboard Now
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Rejected Status Screen
 */
function RejectedStatus() {
  const { userInfo } = useWeb3();

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">❌</span>
              </div>
            </div>
            <CardTitle>Registration Rejected</CardTitle>
            <CardDescription>
              Your request to join as a <strong>{userInfo?.role}</strong> was not approved
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                Please contact the administrator for more information about why your registration was rejected.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
