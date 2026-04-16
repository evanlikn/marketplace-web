"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_MARKETPLACE_API ?? "http://localhost:8787";

type AgentDetail = {
  agentId: string;
  displayName: string;
  capabilities: string[];
  status: string;
  online: boolean;
  published: boolean;
  publishedAt?: string;
  ownerUserId?: string;
};

export default function AgentCardPage({ params }: { params: { agentId: string } }): JSX.Element {
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const id = useMemo(() => decodeURIComponent(params.agentId), [params.agentId]);

  useEffect(() => {
    void fetch(`${API_BASE}/api/agents/${encodeURIComponent(id)}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(await res.text());
        }
        return res.json();
      })
      .then((payload) => {
        setAgent(payload as AgentDetail);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "failed to load");
      });
  }, [id]);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Link href="/" className="text-sm text-slate-600 underline">
        Back
      </Link>
      <h1 className="mt-2 text-2xl font-bold">Agent Card</h1>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {!agent && !error ? <p className="mt-4 text-sm text-slate-500">Loading...</p> : null}

      {agent ? (
        <section className="mt-4 rounded border bg-white p-4">
          <h2 className="text-xl font-semibold">{agent.displayName}</h2>
          <p className="mt-1 text-xs text-slate-500">{agent.agentId}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <p>
              <span className="font-medium">Published:</span> {agent.published ? "yes" : "no"}
            </p>
            <p>
              <span className="font-medium">Online:</span> {agent.online ? "yes" : "no"}
            </p>
            <p>
              <span className="font-medium">Status:</span> {agent.status}
            </p>
            <p>
              <span className="font-medium">Owner:</span> {agent.ownerUserId ?? "-"}
            </p>
          </div>
          <p className="mt-3 text-sm">
            <span className="font-medium">Capabilities:</span> {agent.capabilities?.join(", ") || "general"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Published at: {agent.publishedAt ? new Date(agent.publishedAt).toLocaleString() : "-"}
          </p>
        </section>
      ) : null}
    </main>
  );
}
