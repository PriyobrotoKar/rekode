# Rekode — The Modern Developer Workspace

Rekode is a cloud-native online IDE platform that lets users create coding projects from templates, provision isolated Docker containers with full terminal and file-system access, and manage the entire lifecycle through a web browser.

## Architecture Overview

The platform follows a **microservices architecture with an API Gateway pattern**, using gRPC for inter-service communication and Kafka for event-driven workflows.

1. A user authenticates via OTP/email or OAuth (Google, GitHub) through the API Gateway.
2. The user creates a project from a starter template.
3. An event is emitted to Kafka; the orchestrator-service picks it up.
4. The orchestrator provisions an isolated Docker container running the `rekode/container-runtime` image.
5. The user's browser connects to the container via WebSocket — full terminal (xterm.js), file system, and Monaco Editor access.
6. The container lifecycle (start/stop/status) is managed asynchronously through the orchestrator.

## Platform Features

- **Authentication** — Email/OTP login, OAuth with Google and GitHub, JWT refresh token rotation.
- **Dashboard** — Project listings with creation, editing, and status tracking.
- **Project Workspace** — Full IDE experience with Monaco Editor, terminal emulation, file browser, and Git integration.
- **Templates** — Starter templates with predefined languages, environments (browser/server), and tooling.
- **Container Runtime** — Per-project sandboxed Docker containers with node-pty terminal, file watchers, and WebSocket communication.
- **Notifications** — Email delivery for welcome messages and OTP verification via React Email templates.
- **SSR Frontend** — TanStack Start application with file-based routing, SSR, and TanStack Query data fetching.

## Repository Structure

```
apps/
  api-gateway/            # NestJS + Fastify — HTTP/1 gateway for gRPC services
  auth-service/           # NestJS gRPC — Authentication (OTP, OAuth, JWT)
  user-service/           # NestJS gRPC — User profile CRUD
  project-service/        # NestJS gRPC — Project CRUD and lifecycle
  template-service/       # NestJS gRPC — Project templates
  notification-service/   # NestJS Kafka consumer — Email notifications
  orchestrator-service/   # NestJS Kafka consumer — Container provisioning
  platform/               # TanStack Start (React 19) — Main SPA/SSR app
  www/                    # Astro 5 — Marketing / landing page
infra/
  container-runtime/      # Docker image — In-browser dev environment (WebSocket, PTY, file mgmt)
packages/
  ui/                     # @rekode/ui — Shared React component library (56 components)
  types/                  # @rekode/types — Generated gRPC TypeScript types
  proto/                  # Raw protobuf definitions (auth, user, project, template)
  eslint-config/          # Shared ESLint flat configs
  typescript-config/      # Shared TypeScript configs
```

## Tech Stack

| Layer | Technology |
|---|---|
| **Monorepo** | Turborepo + Bun |
| **Backend** | NestJS 11 (7 microservices) |
| **Gateway** | NestJS + Fastify |
| **Service comms** | gRPC + Kafka (KafkaJS) |
| **Database** | PostgreSQL 18 + Prisma 7 |
| **Cache** | Redis 8 |
| **Frontend** | TanStack Start / React 19 + Vite 7 |
| **Marketing** | Astro 5 + React 19 |
| **UI** | Tailwind CSS v4 + custom components |
| **Editor** | Monaco Editor |
| **Terminal** | xterm.js |
| **Containers** | Docker (dockerode), node-pty |
| **Auth** | JWT, OAuth 2.0 (Google, GitHub), OTP |
| **Email** | React Email, Nodemailer, Unosend |

## Prerequisites

- **Bun** `>= 1.3`
- **Docker** with Docker Compose
- **Node.js** `>= 20`

## Quick Start

### 1) Install dependencies

```bash
bun install
```

### 2) Start infrastructure (PostgreSQL, Redis, Kafka)

```bash
docker compose up -d
```

### 3) Set up databases

```bash
bun run db:push
```

### 4) Start all services

```bash
bun run dev
```

This starts the API Gateway (port 8000), all gRPC microservices, Kafka consumers, the platform app (port 3000), and the marketing site.

### 5) Open the platform

Visit `http://localhost:3000` and authenticate to create and manage workspace projects.

## Configuration

Start from `.sample.env` files in each service directory. Key runtime variables include:

- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `KAFKA_BROKER` — Kafka broker address
- `JWT_SECRET` — JWT signing secret
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth credentials
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` — GitHub OAuth credentials

## Notes

- This is a monorepo containing multiple apps and packages, all focused on the Rekode cloud IDE platform.
- Local development relies on Docker Compose for infrastructure services (Postgres, Redis, Kafka).
- Each backend service has its own Prisma schema and database migrations (logical database-per-service on shared Postgres).
