"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_MARKETPLACE_API ?? "http://localhost:8787";

export default function DeviceApprovePage(): JSX.Element {
  const [userCode, setUserCode] = useState("");
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = new URLSearchParams(window.location.search);
    const code = (query.get("user_code") ?? "").trim().toUpperCase();
    if (code) setUserCode(code);

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

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const normalized = userCode.trim().toUpperCase();
    if (!normalized) {
      setStatus("error");
      setMessage("Please input user code.");
      return;
    }

    setStatus("submitting");
    setMessage("");
    try {
      const response = await fetch(`${API_BASE}/api/auth/device/approve`, {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ userCode: normalized })
      });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? `HTTP ${response.status}`);
      }
      setStatus("success");
      setMessage("Authorization approved. You can return to OpenClaw and continue.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Approve failed.");
    }
  };

  if (!checkedAuth) {
    return <main className="mx-auto max-w-xl p-6 text-sm text-slate-500">Checking login status...</main>;
  }

  if (!userId) {
    const redirect = `/auth/device${typeof window !== "undefined" ? window.location.search : ""}`;
    return (
      <main className="mx-auto max-w-xl p-6">
        <h1 className="text-2xl font-bold">Device Code Approval</h1>
        <p className="mt-2 text-sm text-slate-600">Please sign in first, then approve this device code.</p>
        <Link className="mt-4 inline-block rounded bg-slate-900 px-4 py-2 text-white" href={`/auth/login?redirect=${encodeURIComponent(redirect)}`}>
          Sign In
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-bold">Device Code Approval</h1>
      <p className="mt-2 text-sm text-slate-600">
        Logged in as <span className="font-semibold">{userId}</span>
      </p>

      <section className="mt-6 rounded border bg-white p-4">
        <p className="text-sm text-slate-700">
          Paste the code shown in OpenClaw plugin login, then click approve.
        </p>
        <form className="mt-4 space-y-3" onSubmit={submit}>
          <input
            className="w-full rounded border p-2 font-mono uppercase tracking-wider"
            placeholder="USER CODE"
            value={userCode}
            onChange={(event) => setUserCode(event.target.value.toUpperCase())}
          />
          <button
            type="submit"
            disabled={status === "submitting"}
            className="rounded bg-slate-900 px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-slate-500"
          >
            {status === "submitting" ? "Approving..." : "Approve Login"}
          </button>
        </form>

        {status !== "idle" ? (
          <p className={`mt-3 text-sm ${status === "success" ? "text-emerald-700" : "text-red-600"}`}>{message}</p>
        ) : null}
      </section>

      <div className="mt-4">
        <Link className="text-sm text-slate-700 underline" href="/">
          Back to Marketplace
        </Link>
      </div>
    </main>
  );
}
