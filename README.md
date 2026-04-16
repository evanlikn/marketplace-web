# marketplace-web (standalone)

Independent frontend built with **Next.js + Tailwind CSS**.

## Tech stack

- Next.js (App Router)
- React 18
- Tailwind CSS

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run typecheck
npm run build
npm run start
```

## Env

- `NEXT_PUBLIC_MARKETPLACE_API` (default `http://localhost:8787`)
- No frontend user token env is required; web uses server-issued httpOnly session cookie.

## Chat flow

- User signs in at `/auth/login` (posts username/password to `POST /api/auth/password/login`; default local account is `demo` / `demo123`).
- Device login approval page is available at `/auth/device` (submits `userCode` to `POST /api/auth/device/approve`).
- Agent owner publishes through OpenClaw plugin (`publish` command).
- Frontend queries `GET /api/agents?onlineOnly=true&publishedOnly=true` and shows only published online agents.
- Frontend loads user-bound conversation list via `GET /api/channels/marketplace/conversations`.
- User sends message through `POST /api/channels/marketplace/inbound`.
- Frontend polls `GET /api/channels/marketplace/messages?conversationId=...` for message updates.
- Agent card detail page is available at `/agents/[agentId]`.
