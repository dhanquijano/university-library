"use client";

import React from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  variant?: "spinner" | "skeleton" | "card";
  className?: string;
  showRetry?: boolean;
  onRetry?: () => void;
  retryDisabled?: boolean;
}

export function LoadingState({
  message = "Loading...",
  size = "md",
  variant = "spinner",
  className,
  showRetry = false,
  onRetry,
  retryDisabled = false,
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
          <Loader2 className={cn("animate-spin text-muted-foreground", sizeClasses[size])} />
          <p className={cn("text-muted-foreground text-center", textSizeClasses[size])}>
            {message}
          </p>
          {showRetry && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              disabled={retryDisabled}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("flex items-center justify-center space-x-2", className)}>
      <Loader2 className={cn("animate-spin text-muted-foreground", sizeClasses[size])} />
      <span className={cn("text-muted-foreground", textSizeClasses[size])}>
        {message}
      </span>
      {showRetry && onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          disabled={retryDisabled}
          className="ml-4"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// Skeleton components for specific use cases
export function TableSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4 animate-pulse">
          {Array.from({ length: columns }).map((_, j) => (
            <div
              key={j}
              className={cn(
                "h-4 bg-muted rounded",
                j === 0 ? "w-16" : j === columns - 1 ? "w-20" : "flex-1"
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-muted rounded w-20"></div>
                <div className="h-4 w-4 bg-muted rounded"></div>
              </div>
              <div className="h-8 bg-muted rounded w-16"></div>
              <div className="h-3 bg-muted rounded w-24"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ButtonLoadingState({
  loading,
  children,
  loadingText = "Loading...",
  ...props
}: {
  loading: boolean;
  children: React.ReactNode;
  loadingText?: string;
} & React.ComponentProps<typeof Button>) {
  return (
    <Button disabled={loading} {...props}>
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}