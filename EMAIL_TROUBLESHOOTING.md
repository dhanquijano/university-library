# Email System Troubleshooting Guide

## Issue: Emails Not Being Received

### Quick Diagnosis Steps

1. **Visit the test page**: Go to `/test-email` to run diagnostics
2. **Check server logs**: Look for console output when submitting the contact form
3. **Verify environment**: Ensure `RESEND_TOKEN` is properly configured

### Common Issues and Solutions

#### 1. Resend API Token Not Configured

**Symptoms:**
- Console shows "RESEND_TOKEN not configured"
- Test page shows token as "Not set"

**Solution:**
```bash
# Add to your .env.local file
RESEND_TOKEN=re_your_actual_token_here
```

**How to get a Resend token:**
1. Sign up at https://resend.com
2. Go to API Keys section
3. Create a new API key
4. Copy the token to your environment file

#### 2. Invalid or Expired API Token

**Symptoms:**
- Console shows "Resend API error" with 401 status
- Test email fails with authentication error

**Solution:**
- Regenerate API key in Resend dashboard
- Update environment variable with new token
- Restart your development server

#### 3. Domain Verification Issues

**Symptoms:**
- Emails send but don't arrive
- Resend API returns success but no delivery

**Solution:**
- Use `onboarding@resend.dev` as sender (already configured)
- For production, verify your own domain in Resend
- Check Resend dashboard for delivery status

#### 4. Gmail Spam Filtering

**Symptoms:**
- Test emails work but contact form emails don't arrive
- No errors in logs

**Solution:**
- Check spam/junk folder in Gmail
- Add sender to safe senders list
- Use a different test email address

### Testing Methods

#### Method 1: Use the Test Page
1. Navigate to `/test-email`
2. Click "Test Configuration"
3. Send a test email to your address
4. Check results and logs

#### Method 2: Manual API Testing
```bash
curl -X GET http://localhost:3000/api/test-email
```

#### Method 3: Check Console Logs
When submitting the contact form, check for:
```
=== CONTACT FORM SUBMISSION (FALLBACK) ===
To: dhyler21@gmail.com
Subject: [COMPLAINT] Test Subject
Content: [Message content]
==========================================
```

### Fallback Systems

The system has multiple fallback layers:

1. **Primary**: Resend API with `onboarding@resend.dev`
2. **Alternative**: Webhook service (configurable)
3. **Fallback**: Console logging (always works)

### Environment Configuration

#### Required Environment Variables
```env
# Required for email functionality
RESEND_TOKEN=re_your_token_here

# Optional for enhanced features
WEBHOOK_URL=https://webhook.site/your-unique-id
```

#### Verifying Configuration
```javascript
// Check in browser console or server logs
console.log('Resend token configured:', !!process.env.RESEND_TOKEN);
```

### Alternative Email Solutions

If Resend continues to fail, consider these alternatives:

#### Option 1: Formspree
```javascript
// Replace in lib/email-service.ts
const response = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: email,
    message: message,
    _replyto: email,
    _subject: subject,
  }),
});
```

#### Option 2: EmailJS (Client-side)
```javascript
// Install: npm install @emailjs/browser
import emailjs from '@emailjs/browser';

emailjs.send('service_id', 'template_id', {
  to_email: 'dhyler21@gmail.com',
  from_name: name,
  message: message,
}, 'public_key');
```

#### Option 3: Netlify Forms
```html
<!-- Add to contact form -->
<form netlify>
  <input type="hidden" name="form-name" value="contact" />
  <!-- your form fields -->
</form>
```

### Production Deployment Checklist

- [ ] `RESEND_TOKEN` environment variable set
- [ ] Domain verified in Resend (for custom sender)
- [ ] Test email delivery to target address
- [ ] Monitor server logs for errors
- [ ] Set up error alerting/monitoring
- [ ] Configure backup notification methods

### Monitoring and Alerts

#### Server-side Logging
```javascript
// Add to your logging system
console.log('Email attempt:', {
  timestamp: new Date().toISOString(),
  recipient: 'dhyler21@gmail.com',
  success: emailSent,
  method: 'resend|alternative|fallback'
});
```

#### Error Tracking
Consider integrating with:
- Sentry for error tracking
- LogRocket for session replay
- DataDog for monitoring

### Contact Information

If all else fails, the system will:
1. Log complete form data to server console
2. Show success message to user
3. Allow manual processing of submissions

**Manual Processing:**
- Check server logs for form submissions
- Copy contact details from console output
- Manually email or call the customer

### Support Resources

- **Resend Documentation**: https://resend.com/docs
- **Resend Status Page**: https://status.resend.com
- **Test Email Page**: `/test-email`
- **Contact Form**: `/contact`

### Emergency Backup Plan

If the entire email system fails:
1. Form submissions are logged to console
2. Set up log monitoring/alerts
3. Process submissions manually from logs
4. Consider temporary external form service