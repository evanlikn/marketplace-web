"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_MARKETPLACE_API ?? "http://localhost:8787";

type LoginResponse = {
  ok?: boolean;
  message?: string;
  user?: {
    userId?: string;
  };
};

export default function LoginPage(): JSX.Element {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [redirect, setRedirect] = useState("/");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const value = new URLSearchParams(window.location.search).get("redirect")?.trim();
    if (value) setRedirect(value);
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!username.trim() || !password) {
      setStatus("error");
      setMessage("Username and password are required.");
      return;
    }

    setStatus("submitting");
    setMessage("");
    try {
      const response = await fetch(`${API_BASE}/api/auth/password/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: username.trim(),
          password
        })
      });
      const payload = (await response.json().catch(() => ({}))) as LoginResponse;
      if (!response.ok || !payload.ok || !payload.user?.userId) {
        throw new Error(payload.message ?? `HTTP ${response.status}`);
      }

      router.replace(redirect);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-bold">Marketplace Login</h1>
      <p className="mt-2 text-sm text-slate-600">Sign in to approve device code and start chatting.</p>

      <section className="mt-6 rounded border bg-white p-4">
        <form className="space-y-3" onSubmit={submit}>
          <input
            className="w-full rounded border p-2"
            placeholder="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
          />
          <input
            className="w-full rounded border p-2"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
          <button
            type="submit"
            disabled={status === "submitting"}
            className="rounded bg-slate-900 px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-slate-500"
          >
            {status === "submitting" ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {message ? <p className="mt-3 text-sm text-red-600">{message}</p> : null}
        <p className="mt-3 text-xs text-slate-500">Default local account: demo / demo123</p>
      </section>

      <div className="mt-4">
        <Link className="text-sm text-slate-700 underline" href="/">
          Back to Marketplace
        </Link>
      </div>
    </main>
  );
}
