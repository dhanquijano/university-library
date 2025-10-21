# Contact Form Testing Guide

## How to Test the Contact Form

### 1. Access the Contact Form
- Navigate to `/contact` in your browser
- The form should load with all required fields

### 2. Test Form Validation
Try submitting with missing fields to verify validation:
- Empty name → Should show "Missing required fields"
- Invalid email → Should show "Invalid email format"
- Missing message type → Should show "Missing required fields"

### 3. Test Successful Submission
Fill out the form completely:
```
Name: John Doe
Email: john@example.com
Phone: +1234567890
Type: Complaint (to test high priority)
Subject: Test complaint submission
Message: This is a test message to verify the contact form works correctly.
```

### 4. Expected Results

#### On Form Submission:
- Success message appears with priority-specific response time
- Form fields are cleared
- No errors in browser console

#### Email Delivery:
Check the target email `dhyler21@gmail.com` for:

**Subject**: 🚨 [COMPLAINT] Test complaint submission

**Content**: Professional HTML email with:
- Contact information (Name, Email, Phone)
- Message type and priority highlighted
- Full message content
- Timestamp of submission
- Reply-to set to customer's email

#### Console Logs (Fallback):
If Resend API is not configured, check browser/server console for:
```
=== CONTACT FORM SUBMISSION ===
To: dhyler21@gmail.com
Subject: [COMPLAINT] Test complaint submission
Content: [Full formatted message]
================================
```

### 5. Test Different Message Types

#### Feedback (Medium Priority):
- Subject: ⚠️ [FEEDBACK] Your subject
- Response time: 48 hours

#### Suggestion (Medium Priority):
- Subject: ⚠️ [SUGGESTION] Your subject  
- Response time: 48 hours

#### General (Low Priority):
- Subject: ℹ️ [GENERAL] Your subject
- Response time: 24 hours

#### Complaint (High Priority):
- Subject: 🚨 [COMPLAINT] Your subject
- Response time: 12 hours

### 6. Environment Setup for Email

To enable Resend email delivery, ensure:
```env
RESEND_TOKEN=your_resend_api_key_here
```

If not configured, the system will gracefully fall back to console logging.

### 7. Troubleshooting

#### Form Not Submitting:
- Check browser console for JavaScript errors
- Verify all required fields are filled
- Check network tab for API call status

#### Email Not Received:
- Check spam/junk folder
- Verify Resend API key is valid
- Check server logs for email service errors
- Fallback logs should appear in console

#### API Errors:
- Check server logs for detailed error messages
- Verify API route is accessible at `/api/contact`
- Test with curl or Postman if needed

### 8. Manual API Testing

Test the API directly with curl:
```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+1234567890",
    "type": "complaint",
    "subject": "API Test",
    "message": "Testing the contact API directly"
  }'
```

Expected response:
```json
{
  "message": "Thank you for contacting us! We've received your message and will get back to you soon.",
  "type": "complaint",
  "priority": "high",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```