import { sql } from "@/lib/db";
import { nanoid } from "nanoid";

export type ChatRole = "user" | "assistant";

export type Conversation = {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  role: ChatRole;
  content: string;
  created_at: string;
  meta?: unknown;
};

export async function ensureChatSchema(): Promise<void> {
  // Use text ids so we don't depend on extensions
  await sql`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      title TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('user','assistant')),
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  // Add meta column if it's missing to store tool metadata
  await sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS meta JSONB`;
}

export async function createConversation(title?: string | null): Promise<Conversation> {
  const id = nanoid();
  await ensureChatSchema();
  const rows = (await sql`
    INSERT INTO conversations (id, title)
    VALUES (${id}, ${title ?? null})
    RETURNING id, title, created_at, updated_at
  `) as Conversation[];
  return rows[0];
}

export async function touchConversation(conversationId: string): Promise<void> {
  await ensureChatSchema();
  await sql`UPDATE conversations SET updated_at = now() WHERE id = ${conversationId}`;
}

export async function upsertConversation(conversationId?: string | null, title?: string | null): Promise<Conversation> {
  await ensureChatSchema();
  if (!conversationId) {
    return createConversation(title ?? null);
  }
  const existing = (await sql`
    SELECT id, title, created_at, updated_at FROM conversations WHERE id = ${conversationId}
  `) as Conversation[];
  if (existing.length) {
    if (title != null && title !== existing[0].title) {
      const rows = (await sql`
        UPDATE conversations SET title = ${title}, updated_at = now() WHERE id = ${conversationId}
        RETURNING id, title, created_at, updated_at
      `) as Conversation[];
      return rows[0];
    }
    await touchConversation(conversationId);
    return existing[0];
  }
  // If not found, create
  const rows = (await sql`
    INSERT INTO conversations (id, title)
    VALUES (${conversationId}, ${title ?? null})
    RETURNING id, title, created_at, updated_at
  `) as Conversation[];
  return rows[0];
}

export async function listConversations(limit = 50): Promise<Conversation[]> {
  await ensureChatSchema();
  const rows = (await sql`
    SELECT id, title, created_at, updated_at
    FROM conversations
    ORDER BY updated_at DESC
    LIMIT ${limit}
  `) as Conversation[];
  return rows;
}

export async function addMessage(params: { conversationId: string; role: ChatRole; content: string; meta?: unknown }): Promise<ChatMessage> {
  await ensureChatSchema();
  const id = nanoid();
  const rows = (await sql`
    INSERT INTO messages (id, conversation_id, role, content, meta)
    VALUES (${id}, ${params.conversationId}, ${params.role}, ${params.content}, ${params.meta ?? null})
    RETURNING id, conversation_id, role, content, created_at, meta
  `) as ChatMessage[];
  // Touch conversation updated_at
  await touchConversation(params.conversationId);
  return rows[0];
}

export async function getMessages(conversationId: string, limit = 200): Promise<ChatMessage[]> {
  await ensureChatSchema();
  const rows = (await sql`
    SELECT id, conversation_id, role, content, created_at, meta
    FROM messages
    WHERE conversation_id = ${conversationId}
    ORDER BY created_at ASC
    LIMIT ${limit}
  `) as ChatMessage[];
  return rows;
}

export async function getConversation(conversationId: string): Promise<Conversation | null> {
  await ensureChatSchema();
  const rows = (await sql`
    SELECT id, title, created_at, updated_at FROM conversations WHERE id = ${conversationId}
  `) as Conversation[];
  return rows[0] ?? null;
}
