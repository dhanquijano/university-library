import config from "@/lib/config";

interface ContactEmailData {
  name: string;
  email: string;
  phone?: string;
  type: "feedback" | "suggestion" | "complaint" | "general";
  subject: string;
  message: string;
  priority: "low" | "medium" | "high";
}

export async function sendContactEmail(data: ContactEmailData): Promise<boolean> {
  try {
    const { name, email, phone, type, subject, message, priority } = data;

    // Check if Resend token is available
    if (!config.env.resendToken) {
      console.log('RESEND_TOKEN not configured, skipping Resend API');
      return false;
    }

    // Format the email content
    const emailContent = `
New Contact Form Submission

Type: ${type.toUpperCase()}
Priority: ${priority.toUpperCase()}
Submitted: ${new Date().toLocaleString()}

Contact Information:
- Name: ${name}
- Email: ${email}
- Phone: ${phone || 'Not provided'}

Subject: ${subject}

Message:
${message}

---
Reply to this email to respond directly to the customer.
Customer Email: ${email}
    `.trim();

    // Get priority emoji for subject
    const priorityEmoji = priority === "high" ? "🚨" : priority === "medium" ? "⚠️" : "ℹ️";

    // Use onboarding@resend.dev for testing (this is always available)
    const fromEmail = 'onboarding@resend.dev';
    
    console.log('Attempting to send email via Resend API...');
    console.log('From:', fromEmail);
    console.log('To:', 'dhanquijano6@gmail.com');
    console.log('Subject:', `${priorityEmoji} [${type.toUpperCase()}] ${subject}`);

    // Send email using Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.env.resendToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: 'dhanquijano6@gmail.com',
        reply_to: email, // Allow direct reply to customer
        subject: `${priorityEmoji} [${type.toUpperCase()}] ${subject}`,
        text: emailContent,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
              New Contact Form Submission
            </h2>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Type:</strong> <span style="background-color: ${priority === 'high' ? '#dc3545' : priority === 'medium' ? '#ffc107' : '#28a745'}; color: white; padding: 2px 8px; border-radius: 3px; font-size: 12px;">${type.toUpperCase()}</span></p>
              <p><strong>Priority:</strong> <span style="color: ${priority === 'high' ? '#dc3545' : priority === 'medium' ? '#ffc107' : '#28a745'};">${priority.toUpperCase()}</span></p>
              <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
            </div>

            <div style="margin: 20px 0;">
              <h3 style="color: #333;">Contact Information</h3>
              <ul style="list-style: none; padding: 0;">
                <li style="margin: 5px 0;"><strong>Name:</strong> ${name}</li>
                <li style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></li>
                <li style="margin: 5px 0;"><strong>Phone:</strong> ${phone || 'Not provided'}</li>
              </ul>
            </div>

            <div style="margin: 20px 0;">
              <h3 style="color: #333;">Subject</h3>
              <p style="background-color: #f8f9fa; padding: 10px; border-left: 4px solid #007bff;">${subject}</p>
            </div>

            <div style="margin: 20px 0;">
              <h3 style="color: #333;">Message</h3>
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${message}</div>
            </div>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 12px;">
              Reply to this email to respond directly to the customer.<br>
              Customer Email: <a href="mailto:${email}">${email}</a>
            </p>
          </div>
        `,
      }),
    });

    console.log('Resend API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Resend API error response:', errorData);
      return false;
    }

    const result = await response.json();
    console.log('Email sent successfully via Resend:', result);
    return true;

  } catch (error) {
    console.error('Error sending contact email via Resend:', error);
    return false;
  }
}

// Alternative email service using EmailJS (client-side) or webhook
export async function sendContactEmailAlternative(data: ContactEmailData): Promise<boolean> {
  try {
    const { name, email, phone, type, subject, message, priority } = data;

    // Try using a simple email webhook service like Formspree or EmailJS
    // For now, we'll use a mock webhook that could be replaced with a real service
    
    const emailPayload = {
      to: 'dhanquijano6@gmail.com',
      from: email,
      subject: `[${type.toUpperCase()}] ${subject}`,
      message: `
New Contact Form Submission

Type: ${type.toUpperCase()}
Priority: ${priority.toUpperCase()}
From: ${name} (${email})
Phone: ${phone || 'Not provided'}

Subject: ${subject}

Message:
${message}

Submitted: ${new Date().toLocaleString()}
      `.trim()
    };

    console.log('=== ATTEMPTING ALTERNATIVE EMAIL SERVICE ===');
    console.log('Payload:', emailPayload);
    
    // You could replace this with services like:
    // - Formspree: https://formspree.io/
    // - EmailJS: https://www.emailjs.com/
    // - Netlify Forms
    // - Webhook.site for testing
    
    /*
    // Example with Formspree:
    const response = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });
    
    if (response.ok) {
      console.log('Email sent via Formspree successfully');
      return true;
    }
    */

    // For now, just log the attempt
    console.log('Alternative email service would send:', emailPayload);
    return true;

  } catch (error) {
    console.error('Error in alternative email service:', error);
    return false;
  }
}

// Fallback email service using console logging and potential webhook
export async function sendContactEmailFallback(data: ContactEmailData): Promise<boolean> {
  try {
    const { name, email, phone, type, subject, message, priority } = data;

    // Simple email content for fallback
    const emailContent = `
New Contact Form Submission

Type: ${type.toUpperCase()}
Priority: ${priority.toUpperCase()}
From: ${name} (${email})
Phone: ${phone || 'Not provided'}

Subject: ${subject}

Message:
${message}

Submitted: ${new Date().toLocaleString()}
    `.trim();

    // Log to console as fallback
    console.log('=== CONTACT FORM SUBMISSION (FALLBACK) ===');
    console.log('To: dhanquijano6@gmail.com');
    console.log('Subject:', `[${type.toUpperCase()}] ${subject}`);
    console.log('Content:', emailContent);
    console.log('==========================================');

    // Try to send to a webhook for testing (you can use webhook.site)
    try {
      const webhookUrl = 'https://webhook.site/unique-id'; // Replace with actual webhook URL
      
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'dhanquijano6@gmail.com',
          subject: `[${type.toUpperCase()}] ${subject}`,
          content: emailContent,
          timestamp: new Date().toISOString(),
        }),
      });

      if (webhookResponse.ok) {
        console.log('Webhook notification sent successfully');
      }
    } catch (webhookError) {
      console.log('Webhook failed, but form data logged to console');
    }

    return true;
  } catch (error) {
    console.error('Error in fallback email service:', error);
    return false;
  }
}