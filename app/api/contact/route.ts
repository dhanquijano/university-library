import { NextRequest, NextResponse } from "next/server";
import { sendContactEmail, sendContactEmailAlternative, sendContactEmailFallback } from "@/lib/email-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, type, subject, message } = body;

    // Validate required fields
    if (!name || !email || !type || !subject || !message) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate message type
    const validTypes = ["feedback", "suggestion", "complaint", "general"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { message: "Invalid message type" },
        { status: 400 }
      );
    }

    // Determine priority based on type
    let priority: "low" | "medium" | "high" = "medium";
    if (type === "complaint") {
      priority = "high";
    } else if (type === "general") {
      priority = "low";
    }

    // Prepare email data
    const emailData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim(),
      type: type as "feedback" | "suggestion" | "complaint" | "general",
      subject: subject.trim(),
      message: message.trim(),
      priority,
    };

    try {
      // Try to send email using Resend
      console.log('Attempting to send email via Resend...');
      const emailSent = await sendContactEmail(emailData);
      
      if (!emailSent) {
        // Try alternative email service
        console.log('Resend failed, trying alternative email service...');
        const altEmailSent = await sendContactEmailAlternative(emailData);
        
        if (!altEmailSent) {
          // Final fallback to console logging
          console.log('All email services failed, using console fallback...');
          await sendContactEmailFallback(emailData);
        }
      }

      return NextResponse.json(
        {
          message: "Thank you for contacting us! We've received your message and will get back to you soon.",
          type: type,
          priority: priority,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      
      // Still try alternative and fallback methods
      try {
        console.log('Email service error occurred, trying alternatives...');
        const altEmailSent = await sendContactEmailAlternative(emailData);
        if (!altEmailSent) {
          await sendContactEmailFallback(emailData);
        }
        return NextResponse.json(
          {
            message: "Your message has been received. We'll get back to you soon.",
            timestamp: new Date().toISOString(),
          },
          { status: 200 }
        );
      } catch (fallbackError) {
        console.error("Fallback email method also failed:", fallbackError);
        return NextResponse.json(
          { message: "Failed to send message. Please try again later or contact us directly." },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("Error processing contact form:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

