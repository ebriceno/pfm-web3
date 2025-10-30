import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, ArrowRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface TokenCardProps {
  token: {
    id: number;
    name: string;
    totalSupply: number;
    features: string;
    creator: string;
    dateCreated: number;
    parentId: number;
  };
  balance: number;
}

/**
 * TokenCard Component
 * Displays a token in a card format
 */
export function TokenCard({ token, balance }: TokenCardProps) {
  const features = parseFeatures(token.features);
  const hasParent = token.parentId > 0;

  return (
    <Link href={`/tokens/${token.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">{token.name}</CardTitle>
                <CardDescription className="text-xs">
                  Token #{token.id}
                </CardDescription>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Balance */}
          <div className="flex items-center justify-between py-2 px-3 bg-green-50 rounded-lg">
            <span className="text-sm font-medium text-green-800">Your Balance</span>
            <span className="text-lg font-bold text-green-900">{balance}</span>
          </div>

          {/* Total Supply */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total Supply</span>
            <span className="font-semibold">{token.totalSupply}</span>
          </div>

          {/* Parent Badge */}
          {hasParent && (
            <div className="flex items-center gap-2">
              <Badge variant="warning" className="text-xs">
                Derived Product
              </Badge>
              <span className="text-xs text-gray-500">
                Parent: #{token.parentId}
              </span>
            </div>
          )}

          {/* Features */}
          {features && Object.keys(features).length > 0 && (
            <div className="pt-2 border-t">
              <span className="text-xs text-gray-500 block mb-1">Features:</span>
              <div className="flex flex-wrap gap-1">
                {Object.entries(features).slice(0, 3).map(([key, value]) => (
                  <Badge key={key} variant="default" className="text-xs">
                    {key}: {String(value)}
                  </Badge>
                ))}
                {Object.keys(features).length > 3 && (
                  <Badge variant="default" className="text-xs">
                    +{Object.keys(features).length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Created Date */}
          <div className="text-xs text-gray-500 pt-2 border-t">
            Created: {formatDate(token.dateCreated)}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * Parse features JSON safely
 */
function parseFeatures(features: string): Record<string, unknown> | null {
  try {
    return JSON.parse(features);
  } catch {
    return null;
  }
}

