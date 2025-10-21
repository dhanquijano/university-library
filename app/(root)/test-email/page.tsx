"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Mail } from "lucide-react";

export default function TestEmailPage() {
  const [testEmail, setTestEmail] = useState("dhyler21@gmail.com");
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const testEmailConfiguration = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/test-email");
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({ error: "Failed to test email configuration" });
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestEmail = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testEmail }),
      });
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({ error: "Failed to send test email" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Email System Test</h1>
          <p className="text-gray-600">Test the contact form email configuration</p>
        </div>

        <div className="grid gap-6">
          {/* Configuration Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Configuration Test
              </CardTitle>
              <CardDescription>
                Check if the email service is properly configured
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={testEmailConfiguration} disabled={isLoading}>
                {isLoading ? "Testing..." : "Test Configuration"}
              </Button>
            </CardContent>
          </Card>

          {/* Send Test Email */}
          <Card>
            <CardHeader>
              <CardTitle>Send Test Email</CardTitle>
              <CardDescription>
                Send a test email to verify delivery
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Test Email Address</label>
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              <Button onClick={sendTestEmail} disabled={isLoading || !testEmail}>
                {isLoading ? "Sending..." : "Send Test Email"}
              </Button>
            </CardContent>
          </Card>

          {/* Test Results */}
          {testResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {testResult.success !== false && !testResult.error ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  Test Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {testResult.error ? (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>Error:</strong> {testResult.error}
                      {testResult.details && (
                        <div className="mt-2">
                          <strong>Details:</strong> {testResult.details}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {testResult.resendTokenConfigured !== undefined && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Resend Token Configured:</strong>{" "}
                          <span className={testResult.resendTokenConfigured ? "text-green-600" : "text-red-600"}>
                            {testResult.resendTokenConfigured ? "Yes" : "No"}
                          </span>
                        </div>
                        <div>
                          <strong>Token Length:</strong> {testResult.resendTokenLength}
                        </div>
                        <div className="col-span-2">
                          <strong>Token Prefix:</strong> {testResult.resendTokenPrefix}
                        </div>
                      </div>
                    )}

                    {testResult.testEmailSent !== undefined && (
                      <Alert className={testResult.testEmailSent ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                        <AlertDescription className={testResult.testEmailSent ? "text-green-800" : "text-red-800"}>
                          <strong>Test Email:</strong>{" "}
                          {testResult.testEmailSent ? "Sent successfully" : "Failed to send"}
                          {testResult.testEmailError && (
                            <div className="mt-2">
                              <strong>Error:</strong> {testResult.testEmailError}
                            </div>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}

                    {testResult.success !== undefined && (
                      <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                        <AlertDescription className={testResult.success ? "text-green-800" : "text-red-800"}>
                          <strong>Email Delivery:</strong>{" "}
                          {testResult.success ? "Successful" : "Failed"}
                          <div className="mt-2">
                            <strong>Status:</strong> {testResult.status}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {testResult.response && (
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <strong>API Response:</strong>
                        <pre className="mt-2 text-xs overflow-auto">
                          {JSON.stringify(testResult.response, null, 2)}
                        </pre>
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      <strong>Timestamp:</strong> {testResult.timestamp}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Troubleshooting</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">If emails are not being received:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Check your spam/junk folder</li>
                  <li>Verify the RESEND_TOKEN environment variable is set</li>
                  <li>Ensure the Resend API key has proper permissions</li>
                  <li>Check the server console logs for error messages</li>
                  <li>Try using the fallback console logging method</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Environment Setup:</h4>
                <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                  RESEND_TOKEN=your_resend_api_key_here
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Alternative Solutions:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Use Formspree.io for form handling</li>
                  <li>Set up EmailJS for client-side email sending</li>
                  <li>Use Netlify Forms if hosted on Netlify</li>
                  <li>Check console logs for fallback notifications</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}