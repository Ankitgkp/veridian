import axios from "axios";
import { BACKEND_URL } from "./config";
import { createClient } from "./supabase/client";

const supabase = createClient();

async function getAuthHeader(): Promise<string | undefined> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

export interface Conversation {
  id: string;
  slug: string;
  title: string | null;
  userId: string;
  messages: Message[];
  _count?: { messages: number };
}

export interface Message {
  id: number;
  content: string;
  role: "User" | "Assistant";
  conversationId: string;
  createdAt: string;
}

export interface Source {
  index: number;
  title: string;
  url: string;
}

export interface StreamCallbacks {
  onMeta: (meta: { conversationId: string; slug: string }) => void;
  onSources: (sources: Source[]) => void;
  onTextDelta: (delta: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
}

// ---- Non-streaming endpoints ----

export async function fetchConversations(): Promise<Conversation[]> {
  const jwt = await getAuthHeader();
  const res = await axios.get<{ conversations: Conversation[] }>(
    `${BACKEND_URL}/conversations`,
    { headers: { Authorization: jwt } }
  );
  return res.data.conversations;
}

export async function fetchConversation(id: string): Promise<Conversation> {
  const jwt = await getAuthHeader();
  const res = await axios.get<{ conversation: Conversation }>(
    `${BACKEND_URL}/conversation/${id}`,
    { headers: { Authorization: jwt } }
  );
  return res.data.conversation;
}

// ---- Streaming endpoints ----

async function consumeSSE(
  url: string,
  body: Record<string, unknown>,
  callbacks: StreamCallbacks
) {
  const jwt = await getAuthHeader();

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: jwt ?? "",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok || !response.body) {
    const text = await response.text();
    let msg = "Request failed";
    try { msg = JSON.parse(text).message ?? msg; } catch {}
    callbacks.onError(msg);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE lines are separated by double newlines
    const parts = buffer.split("\n\n");
    // Keep the last (potentially incomplete) part in the buffer
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      for (const line of part.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const json = line.slice(6);
        try {
          const event = JSON.parse(json);
          switch (event.type) {
            case "meta":
              callbacks.onMeta({ conversationId: event.conversationId, slug: event.slug });
              break;
            case "sources":
              callbacks.onSources(event.sources);
              break;
            case "text_delta":
              callbacks.onTextDelta(event.delta);
              break;
            case "done":
              callbacks.onDone();
              break;
            case "error":
              callbacks.onError(event.message);
              break;
          }
        } catch {}
      }
    }
  }
}

export function askQuestionStream(query: string, callbacks: StreamCallbacks) {
  consumeSSE(`${BACKEND_URL}/veridian_ask`, { query }, callbacks);
}

export function askFollowUpStream(
  query: string,
  conversationId: string,
  callbacks: StreamCallbacks
) {
  consumeSSE(
    `${BACKEND_URL}/veridian_ask/follow_up`,
    { query, conversationId },
    callbacks
  );
}
