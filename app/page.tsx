"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AgentItem = {
  agentId: string;
  displayName: string;
  capabilities: string[];
  online: boolean;
  published: boolean;
  status?: string;
};

type ConversationItem = {
  conversationId: string;
  targetAgentId: string;
  updatedAt: string;
  targetAgent?: {
    displayName?: string;
  };
  lastMessage?: {
    text?: string;
  };
};

const API_BASE = process.env.NEXT_PUBLIC_MARKETPLACE_API ?? "http://localhost:8787";

export default function HomePage(): JSX.Element {
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{ from: string; content: string; messageId: string }>>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    void fetch(`${API_BASE}/api/auth/me`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        const resolved = payload?.user?.userId;
        if (typeof resolved === "string" && resolved.trim()) {
          setUserId(resolved);
        }
      })
      .finally(() => setCheckedAuth(true));
  }, []);

  useEffect(() => {
    if (!userId) return;
    void fetch(`${API_BASE}/api/agents?onlineOnly=true&publishedOnly=true`, {
      credentials: "include"
    })
      .then((res) => res.json())
      .then((payload) => setAgents(payload.items ?? []));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const loadConversations = (): void => {
      void fetch(`${API_BASE}/api/channels/marketplace/conversations`, { credentials: "include" })
        .then((res) => res.json())
        .then((payload) => setConversations(payload.items ?? []))
        .catch(() => {
          // ignore temporary refresh errors
        });
    };

    loadConversations();
    const timer = setInterval(loadConversations, 2500);
    return () => clearInterval(timer);
  }, [userId]);

  useEffect(() => {
    if (!selectedAgentId) return;
    const nextConversationId = `conv-${selectedAgentId}-${Date.now()}`;
    setConversationId(nextConversationId);
    setMessages([]);
    setError(null);
  }, [selectedAgentId]);

  useEffect(() => {
    if (!conversationId || !userId) return;

    const timer = setInterval(() => {
      void fetch(`${API_BASE}/api/channels/marketplace/messages?conversationId=${encodeURIComponent(conversationId)}`, {
        credentials: "include"
      })
        .then((res) => res.json())
        .then((payload) => {
          const mapped = (payload.items ?? []).map((item: Record<string, unknown>) => ({
            messageId: String(item.messageId ?? ""),
            from: item.fromAgentId ? "agent" : "user",
            content: String(item.text ?? "")
          }));
          setMessages(mapped);
        })
        .catch(() => {
          // keep polling on transient failures
        });
    }, 1200);

    return () => clearInterval(timer);
  }, [conversationId, userId]);

  const sendMessage = async (): Promise<void> => {
    if (!selectedAgentId || !input || !conversationId || sending || !userId) return;
    setSending(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/channels/marketplace/inbound`, {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          conversationId,
          userId,
          targetAgentId: selectedAgentId,
          text: input
        })
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}`);
      }
      setInput("");
      void fetch(`${API_BASE}/api/channels/marketplace/conversations`, { credentials: "include" })
        .then((res) => res.json())
        .then((payload) => setConversations(payload.items ?? []))
        .catch(() => undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (!checkedAuth) {
    return <main className="mx-auto max-w-4xl p-6 text-sm text-slate-500">Checking login status...</main>;
  }

  if (!userId) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <h1 className="text-2xl font-bold">Marketplace Web (Next.js + Tailwind)</h1>
        <p className="mt-2 text-sm text-slate-600">Please sign in to start chat and approve device login requests.</p>
        <Link className="mt-4 inline-block rounded bg-slate-900 px-4 py-2 text-white" href="/auth/login?redirect=/">
          Sign In
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold">Marketplace Web (Next.js + Tailwind)</h1>
      <p className="mt-2 text-sm text-slate-600">Signed in as: {userId}</p>
      <p className="mt-1 text-sm">
        <Link className="underline" href="/auth/device">
          Device Code Approval Page
        </Link>
      </p>
      <button
        className="mt-3 rounded border px-3 py-1.5 text-sm"
        onClick={() => {
          void fetch(`${API_BASE}/api/auth/logout`, {
            method: "POST",
            credentials: "include"
          }).finally(() => setUserId(undefined));
        }}
      >
        Sign Out
      </button>

      <section className="mt-6 rounded border bg-white p-4">
        <h2 className="mb-2 font-semibold">Published Agent Cards</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {agents.map((agent) => (
            <article key={agent.agentId} className="rounded border p-3">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{agent.displayName}</h3>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">
                  {agent.online ? "online" : agent.status ?? "offline"}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600">{agent.agentId}</p>
              <p className="mt-2 text-sm">{agent.capabilities.join(", ") || "general"}</p>
              <div className="mt-3 flex gap-2">
                <button
                  className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white"
                  onClick={() => setSelectedAgentId(agent.agentId)}
                >
                  Chat
                </button>
                <Link className="rounded border px-3 py-1.5 text-sm" href={`/agents/${encodeURIComponent(agent.agentId)}`}>
                  Card Page
                </Link>
              </div>
            </article>
          ))}
        </div>
        {conversationId ? <p className="mt-2 text-xs text-slate-500">Conversation: {conversationId}</p> : null}
      </section>

      <section className="mt-6 rounded border bg-white p-4">
        <h2 className="mb-2 font-semibold">Your Conversations</h2>
        <div className="space-y-2">
          {conversations.map((conversation) => (
            <button
              key={conversation.conversationId}
              className="w-full rounded border p-2 text-left hover:bg-slate-50"
              onClick={() => {
                setConversationId(conversation.conversationId);
                setSelectedAgentId(conversation.targetAgentId);
              }}
            >
              <p className="text-sm font-medium">
                {conversation.targetAgent?.displayName ?? conversation.targetAgentId}
              </p>
              <p className="text-xs text-slate-500">{conversation.conversationId}</p>
              <p className="mt-1 text-sm text-slate-700">{conversation.lastMessage?.text ?? "(no messages yet)"}</p>
            </button>
          ))}
          {conversations.length === 0 ? <p className="text-sm text-slate-500">No conversations yet.</p> : null}
        </div>
      </section>

      <section className="mt-6 rounded border bg-white p-4">
        <h2 className="mb-2 font-semibold">Conversation</h2>
        <div className="min-h-60 rounded border bg-slate-50 p-3">
          {messages.map((message, index) => (
            <p key={`${message.from}-${index}`} className="mb-1 text-sm">
              <span className="font-semibold">{message.from}:</span> {message.content}
            </p>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            className="flex-1 rounded border p-2"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type your message..."
          />
          <button className="rounded bg-slate-900 px-4 py-2 text-white" onClick={sendMessage}>
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </section>
    </main>
  );
}
