# SendGrid Email Integration Setup

This document explains how to set up and use the SendGrid email integration for the MTA Data Assistant.

## Setup Instructions

### 1. Environment Variables

Add your SendGrid API key to your environment variables:

```bash
# .env.local
SENDGRID_API_KEY=your_sendgrid_api_key_here
```

### 2. DNS Records (Already Completed)

The following DNS records have been added to your `mta-data.com` domain:

- **CNAME** `url622.mta-data.com` → `sendgrid.net`
- **CNAME** `56285903.mta-data.com` → `sendgrid.net`
- **CNAME** `em3637.mta-data.com` → `u56285903.wl154.sendgrid.net`
- **CNAME** `s1._domainkey.mta-data.com` → `s1.domainkey.u56285903.wl154.sendgrid.net`
- **CNAME** `s2._domainkey.mta-data.com` → `s2.domainkey.u56285903.wl154.sendgrid.net`
- **TXT** `_dmarc.mta-data.com` → `v=DMARC1; p=none;`

### 3. Features Available

#### For Users:
- **Email Button**: Click the email icon on any AI response to send it via email
- **Email Modal**: Enter recipient email address and send formatted emails
- **Professional Templates**: Beautiful HTML emails with MTA branding

#### For AI Assistant:
- **Direct Email Tool**: The AI can send emails directly using the `sendEmail` tool
- **Natural Language**: Users can ask "Email this analysis to john@example.com"

### 4. Testing

#### Test the Integration:
```bash
# Send a test email
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@example.com"}'
```

#### Test in the UI:
1. Start your development server: `npm run dev`
2. Go to the chat interface
3. Ask a question and get a response
4. Click the email icon (📧) on the response
5. Enter an email address and send

### 5. Email Features

- **HTML Formatting**: Professional email templates with MTA branding
- **Conversation Links**: Links to continue conversations in the web interface
- **Mobile Responsive**: Emails look great on all devices
- **Authentication**: Emails are sent from your verified `mta-data.com` domain
- **Reply-To**: Recipients can reply to the sender

### 6. API Endpoints

- `POST /api/email/chat` - Send chat response via email
- `POST /api/email/test` - Send test email

### 7. Troubleshooting

#### Common Issues:

1. **"Invalid API Key"**: Check that `SENDGRID_API_KEY` is set correctly
2. **"Sender not verified"**: Ensure your domain is verified in SendGrid
3. **"Email not received"**: Check spam folder, verify recipient email

#### Debug Steps:

1. Check environment variables: `console.log(process.env.SENDGRID_API_KEY)`
2. Test with the test endpoint: `/api/email/test`
3. Check SendGrid dashboard for delivery status
4. Verify DNS records are propagated

### 8. Usage Examples

#### User Interface:
```typescript
// User clicks email button → modal opens → enters email → sends
```

#### AI Assistant:
```typescript
// User: "Email this analysis to john@example.com"
// AI: Uses sendEmail tool to send the response
```

#### Direct API:
```typescript
const response = await fetch('/api/email/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'recipient@example.com',
    messageContent: 'AI response content',
    conversationId: 'conv-123'
  })
});
```

## Security Notes

- API key is server-side only (not exposed to client)
- Email validation prevents injection attacks
- Rate limiting should be implemented for production
- Consider implementing user authentication for email features

## Next Steps

1. Test the integration with the test endpoint
2. Verify emails are received and formatted correctly
3. Test the UI email functionality
4. Consider adding email templates for different types of responses
5. Implement rate limiting for production use
