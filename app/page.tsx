"use client";

import { useEffect, useMemo, useState } from "react";

type AgentItem = {
  agentId: string;
  displayName: string;
  capabilities: string[];
  online: boolean;
};

const API_BASE = process.env.NEXT_PUBLIC_MARKETPLACE_API ?? "http://localhost:8787";
const USER_TOKEN = process.env.NEXT_PUBLIC_USER_TOKEN ?? "user_demo";

export default function HomePage(): JSX.Element {
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{ from: string; content: string }>>([]);

  const ws = useMemo(() => {
    const wsBase = API_BASE.replace("http", "ws");
    return new WebSocket(`${wsBase}/ws/channel/marketplace?role=user&token=${encodeURIComponent(USER_TOKEN)}`);
  }, []);

  useEffect(() => {
    void fetch(`${API_BASE}/api/agents?onlineOnly=true`, {
      headers: {
        authorization: `Bearer ${USER_TOKEN}`
      }
    })
      .then((res) => res.json())
      .then((payload) => setAgents(payload.items ?? []));
  }, []);

  useEffect(() => {
    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data) as { from?: string; content?: string };
      if (payload.content) {
        setMessages((prev) => [...prev, { from: payload.from ?? "agent", content: payload.content ?? "" }]);
      }
    };
    return () => ws.close();
  }, [ws]);

  const sendMessage = (): void => {
    if (!selectedAgentId || !input) return;
    ws.send(
      JSON.stringify({
        type: "user_message",
        agentId: selectedAgentId,
        content: input
      })
    );
    setMessages((prev) => [...prev, { from: "user", content: input }]);
    setInput("");
  };

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold">Marketplace Web (Next.js + Tailwind)</h1>
      <p className="mt-2 text-sm text-slate-600">Token: {USER_TOKEN}</p>

      <section className="mt-6 rounded border bg-white p-4">
        <h2 className="mb-2 font-semibold">Online Agents</h2>
        <select
          className="w-full rounded border p-2"
          value={selectedAgentId}
          onChange={(event) => setSelectedAgentId(event.target.value)}
        >
          <option value="">Select an agent</option>
          {agents.map((agent) => (
            <option key={agent.agentId} value={agent.agentId}>
              {agent.displayName} ({agent.capabilities.join(", ")})
            </option>
          ))}
        </select>
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
            Send
          </button>
        </div>
      </section>
    </main>
  );
}
