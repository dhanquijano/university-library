"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VerificationStats as VerificationStatsType } from "@/types/gcash-verification";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  Loader2 
} from "lucide-react";

interface VerificationStatsProps {
  stats: VerificationStatsType;
  loading?: boolean;
  error?: string;
}

export function VerificationStats({ stats, loading = false, error }: VerificationStatsProps) {
  // Calculate verification rate percentage
  const verificationRate = stats.total > 0 
    ? Math.round(((stats.verified + stats.rejected) / stats.total) * 100)
    : 0;

  const processedRate = stats.total > 0
    ? Math.round((stats.verified / (stats.verified + stats.rejected)) * 100)
    : 0;

  if (error) {
    return (
      <Card className="col-span-full border-destructive/50">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-3">
            <XCircle className="h-8 w-8 text-destructive mx-auto" />
            <div>
              <p className="font-medium text-destructive mb-1">Statistics Unavailable</p>
              <p className="text-sm text-muted-foreground">
                {error}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Pending Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  Pending
                </Badge>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Awaiting verification
          </p>
        </CardContent>
      </Card>

      {/* Verified Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Verified</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.verified}</div>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Verified
                </Badge>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Successfully verified
          </p>
        </CardContent>
      </Card>

      {/* Rejected Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          <XCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.rejected}</div>
                <Badge variant="destructive" className="bg-red-100 text-red-800">
                  Rejected
                </Badge>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Failed verification
          </p>
        </CardContent>
      </Card>

      {/* Verification Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Processing Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{verificationRate}%</div>
                <Badge 
                  variant={verificationRate >= 80 ? "default" : "secondary"}
                  className={
                    verificationRate >= 80 
                      ? "bg-blue-100 text-blue-800" 
                      : "bg-gray-100 text-gray-800"
                  }
                >
                  {verificationRate >= 80 ? "Good" : "Needs Attention"}
                </Badge>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.total > 0 ? `${stats.verified + stats.rejected}/${stats.total} processed` : "No transactions"}
          </p>
        </CardContent>
      </Card>

      {/* Additional Summary Card */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-lg">Verification Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Loading statistics...</span>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
                <p className="text-sm text-muted-foreground">Total GCash Transactions</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {stats.verified + stats.rejected > 0 ? processedRate : 0}%
                </div>
                <p className="text-sm text-muted-foreground">
                  Approval Rate ({stats.verified}/{stats.verified + stats.rejected})
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{stats.pending}</div>
                <p className="text-sm text-muted-foreground">Awaiting Review</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}