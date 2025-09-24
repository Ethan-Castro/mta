import { NextRequest, NextResponse } from 'next/server';
import { sendChatEmail } from '@/lib/email';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to } = body;

    if (!to) {
      return NextResponse.json(
        { success: false, error: 'Email address is required' },
        { status: 400 }
      );
    }

    // Send a test email
    const result = await sendChatEmail({
      to,
      subject: "Test Email from MTA Data Assistant",
      conversationId: "test-123",
      messageContent: "This is a test email to verify that SendGrid integration is working correctly. If you receive this email, the setup is successful!",
      userEmail: "test@mta-data.com",
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Test email sent successfully!",
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
