'use client';

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

  // Connected - will be handled by other pages later
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Connected Successfully! 🎉
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          You are now connected. The full interface will be implemented in the next phases.
        </p>
        <p className="text-sm text-gray-500">
          Navigate using the header menu above.
        </p>
      </div>
    </div>
  );
}
