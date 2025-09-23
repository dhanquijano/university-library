"use client";

import React from "react";
import { AlertTriangle, RefreshCw, Wifi, WifiOff, AlertCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { isNetworkError, getUserFriendlyErrorMessage } from "@/lib/retry-utils";

interface ErrorDisplayProps {
  error: Error | string;
  title?: string;
  variant?: "card" | "alert" | "inline";
  size?: "sm" | "md" | "lg";
  showRetry?: boolean;
  onRetry?: () => void;
  retryDisabled?: boolean;
  retryText?: string;
  className?: string;
  showDetails?: boolean;
}

export function ErrorDisplay({
  error,
  title,
  variant = "card",
  size = "md",
  showRetry = true,
  onRetry,
  retryDisabled = false,
  retryText = "Try Again",
  className,
  showDetails = false,
}: ErrorDisplayProps) {
  const errorMessage = typeof error === "string" ? error : error.message;
  const isNetwork = typeof error === "object" && isNetworkError(error);
  const friendlyMessage = typeof error === "string" ? error : getUserFriendlyErrorMessage(error);

  const getIcon = () => {
    if (isNetwork) return <WifiOff className="h-5 w-5" />;
    if (errorMessage.includes("permission") || errorMessage.includes("unauthorized")) {
      return <XCircle className="h-5 w-5" />;
    }
    return <AlertTriangle className="h-5 w-5" />;
  };

  const getIconColor = () => {
    if (isNetwork) return "text-orange-500";
    if (errorMessage.includes("permission") || errorMessage.includes("unauthorized")) {
      return "text-red-500";
    }
    return "text-yellow-500";
  };

  if (variant === "alert") {
    return (
      <Alert className={cn("border-destructive/50 text-destructive dark:border-destructive", className)}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{friendlyMessage}</span>
          {showRetry && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              disabled={retryDisabled}
              className="ml-4 h-8"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              {retryText}
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-destructive", className)}>
        {getIcon()}
        <span>{friendlyMessage}</span>
        {showRetry && onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            disabled={retryDisabled}
            className="h-auto p-1 text-destructive hover:text-destructive"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  // Card variant (default)
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
  };

  return (
    <Card className={cn("w-full", sizeClasses[size], className)}>
      <CardHeader className="pb-3">
        <CardTitle className={cn("flex items-center gap-2", getIconColor())}>
          {getIcon()}
          {title || (isNetwork ? "Connection Error" : "Error")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{friendlyMessage}</p>
        
        {showDetails && typeof error === "object" && process.env.NODE_ENV === "development" && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Technical Details
            </summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
              {error.stack || error.message}
            </pre>
          </details>
        )}

        <div className="flex gap-2">
          {showRetry && onRetry && (
            <Button
              onClick={onRetry}
              disabled={retryDisabled}
              className="flex items-center gap-2"
              variant={isNetwork ? "default" : "outline"}
            >
              <RefreshCw className="h-4 w-4" />
              {retryText}
            </Button>
          )}
          
          {isNetwork && (
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <Wifi className="h-4 w-4" />
              Reload Page
            </Button>
          )}
        </div>

        {isNetwork && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
            <p className="font-medium mb-1">Troubleshooting tips:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Check your internet connection</li>
              <li>Try refreshing the page</li>
              <li>Contact support if the problem persists</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Specialized error components
export function NetworkErrorDisplay({ onRetry, className }: { onRetry?: () => void; className?: string }) {
  return (
    <ErrorDisplay
      error="Unable to connect to the server. Please check your internet connection."
      title="Connection Error"
      variant="card"
      onRetry={onRetry}
      className={className}
    />
  );
}

export function PermissionErrorDisplay({ className }: { className?: string }) {
  return (
    <ErrorDisplay
      error="You don't have permission to access this feature."
      title="Access Denied"
      variant="card"
      showRetry={false}
      className={className}
    />
  );
}

export function NotFoundErrorDisplay({ onRetry, className }: { onRetry?: () => void; className?: string }) {
  return (
    <ErrorDisplay
      error="The requested resource was not found."
      title="Not Found"
      variant="card"
      onRetry={onRetry}
      retryText="Go Back"
      className={className}
    />
  );
}