# Contact Us Feature Documentation

## Overview
The Contact Us feature allows users to submit feedback, suggestions, complaints, and general inquiries through a web form. All submissions are sent directly via email to the designated support address for immediate attention.

## Features

### User-Facing Contact Form
- **Location**: `/contact`
- **Form Fields**:
  - Full Name (required)
  - Email Address (required)
  - Phone Number (optional)
  - Message Type (required): Feedback, Suggestion, Complaint, General Inquiry
  - Subject (required)
  - Message (required)

### Email Delivery System
- **Target Email**: `dhyler21@gmail.com`
- **Email Service**: Resend API with fallback logging
- **Features**:
  - Priority-based subject lines with emojis
  - HTML formatted emails with professional styling
  - Reply-to field set to customer's email for direct responses
  - Automatic priority assignment based on message type

## Email Format

### Subject Line Format
- 🚨 [COMPLAINT] Subject - High Priority
- ⚠️ [FEEDBACK] Subject - Medium Priority  
- ⚠️ [SUGGESTION] Subject - Medium Priority
- ℹ️ [GENERAL] Subject - Low Priority

### Email Content
- Professional HTML formatting
- Contact information clearly displayed
- Message type and priority highlighted
- Customer email set as reply-to for easy responses
- Timestamp of submission

## API Endpoints

### POST /api/contact
Submit a new contact form and send email
- **Body**: ContactFormData
- **Response**: Success message with timestamp
- **Email Service**: Primary (Resend) with console fallback

## Navigation Integration

### Public Navigation
- Added "Contact Us" link to main header navigation
- Accessible to all users

## Priority System
- **High Priority**: Complaints (🚨 red styling)
- **Medium Priority**: Feedback, Suggestions (⚠️ yellow styling)
- **Low Priority**: General inquiries (ℹ️ green styling)

## Email Service Configuration

### Primary Service: Resend
- Uses configured `RESEND_TOKEN` from environment
- Professional HTML email formatting
- Reply-to functionality for direct customer responses
- Error handling with detailed logging

### Fallback Service: Console Logging
- Activates when Resend fails or is unavailable
- Logs complete email content to console
- Ensures no contact submissions are lost

## Response Time Expectations
- **General Inquiries**: 24 hours
- **Feedback & Suggestions**: 48 hours
- **Complaints**: 12 hours (high priority)

## Usage Instructions

### For Users
1. Navigate to `/contact`
2. Fill out the contact form with required information
3. Select appropriate message type
4. Submit the form
5. Receive confirmation message

### For Support Team
1. Monitor `dhyler21@gmail.com` inbox
2. Prioritize emails based on subject line indicators
3. Reply directly to customer emails (reply-to is pre-configured)
4. Track response times based on priority levels

## Technical Implementation

### Email Service (`lib/email-service.ts`)
- `sendContactEmail()`: Primary Resend API integration
- `sendContactEmailFallback()`: Console logging fallback
- Automatic priority detection and styling
- HTML and text email formats

### Contact API (`app/api/contact/route.ts`)
- Form validation and sanitization
- Email service integration with error handling
- Graceful fallback to ensure delivery

## Future Enhancements
- Email auto-responders for customers
- Integration with ticketing systems
- Analytics dashboard for contact metrics
- Automated categorization using AI
- SMS notifications for high-priority complaints
- Webhook integrations for team notifications