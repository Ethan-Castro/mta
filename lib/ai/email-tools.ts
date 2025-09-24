import { z } from "zod";
import { sendChatEmail } from "@/lib/email";

export const emailTools = {
  sendEmail: {
    description: "Send an email with the current chat response to a specified email address",
    inputSchema: z.object({
      to: z.string().email().describe("Recipient email address"),
      subject: z.string().optional().describe("Email subject line"),
      messageContent: z.string().describe("The content to send in the email"),
      conversationId: z.string().optional().describe("Conversation ID for reference"),
    }),
    execute: async ({ to, subject, messageContent, conversationId }: {
      to: string;
      subject?: string;
      messageContent: string;
      conversationId?: string;
    }) => {
      try {
        const result = await sendChatEmail({
          to,
          subject: subject || "AI Chat Response from MTA Data Assistant",
          conversationId: conversationId || "",
          messageContent,
        });

        if (result.success) {
          return {
            success: true,
            messageId: result.messageId,
            message: `Email sent successfully to ${to}`,
          };
        } else {
          return {
            success: false,
            error: result.error || "Failed to send email",
          };
        }
      } catch (error: any) {
        // Handle missing SendGrid API key gracefully
        if (error.message?.includes('SENDGRID_API_KEY')) {
          return {
            success: false,
            error: "Email functionality is not configured. Please contact the administrator to set up SendGrid.",
          };
        }
        return {
          success: false,
          error: error.message || "Email sending failed",
        };
      }
    },
  },
};
