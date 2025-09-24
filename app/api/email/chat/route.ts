import { NextRequest, NextResponse } from 'next/server';
import { sendChatEmail } from '@/lib/email';
import { stackServerApp } from '@/stack/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const currentUser = await stackServerApp.getUser({ tokenStore: req, or: "return-null" });
    
    const body = await req.json();
    const { to, subject, conversationId, messageContent, userEmail } = body;

    // Validate required fields
    if (!to || !messageContent) {
      return NextResponse.json(
        { success: false, error: 'Email address and message content are required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Send the email
    const result = await sendChatEmail({
      to,
      subject,
      conversationId,
      messageContent,
      userEmail: userEmail || currentUser?.emailAddress,
    });

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
