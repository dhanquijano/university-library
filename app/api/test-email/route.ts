import { NextRequest, NextResponse } from "next/server";
import config from "@/lib/config";

export async function GET(request: NextRequest) {
  try {
    // Test email configuration
    const testResult = {
      resendTokenConfigured: !!config.env.resendToken,
      resendTokenLength: config.env.resendToken ? config.env.resendToken.length : 0,
      resendTokenPrefix: config.env.resendToken ? config.env.resendToken.substring(0, 10) + '...' : 'Not set',
      timestamp: new Date().toISOString(),
    };

    console.log('Email configuration test:', testResult);

    // Try a simple test email if token is available
    if (config.env.resendToken) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.env.resendToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'onboarding@resend.dev',
            to: 'dhyler21@gmail.com',
            subject: 'Test Email from Contact Form System',
            text: `This is a test email sent at ${new Date().toLocaleString()} to verify the email configuration is working.`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Test Email</h2>
                <p>This is a test email sent at <strong>${new Date().toLocaleString()}</strong> to verify the email configuration is working.</p>
                <p>If you receive this email, the contact form should be working correctly.</p>
              </div>
            `,
          }),
        });

        const responseData = await response.json();
        
        return NextResponse.json({
          ...testResult,
          testEmailSent: response.ok,
          testEmailResponse: responseData,
          testEmailStatus: response.status,
        });
      } catch (emailError) {
        return NextResponse.json({
          ...testResult,
          testEmailSent: false,
          testEmailError: emailError instanceof Error ? emailError.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      ...testResult,
      message: 'RESEND_TOKEN not configured, cannot test email sending',
    });

  } catch (error) {
    console.error('Error testing email configuration:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test email configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testEmail } = body;

    if (!testEmail) {
      return NextResponse.json(
        { message: "Test email address is required" },
        { status: 400 }
      );
    }

    if (!config.env.resendToken) {
      return NextResponse.json(
        { message: "RESEND_TOKEN not configured" },
        { status: 400 }
      );
    }

    // Send test email to specified address
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.env.resendToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: testEmail,
        subject: 'Contact Form Test Email',
        text: `This is a test email sent to ${testEmail} at ${new Date().toLocaleString()}.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Contact Form Test Email</h2>
            <p>This is a test email sent to <strong>${testEmail}</strong> at ${new Date().toLocaleString()}.</p>
            <p>If you receive this email, the contact form email system is working correctly.</p>
          </div>
        `,
      }),
    });

    const responseData = await response.json();

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      response: responseData,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}