FROM oven/bun:1 AS base
WORKDIR /app

# Stage 2: Prune monorepo for the target application
FROM base AS pruner
RUN bun add -g turbo
COPY . .
# Extracts target package + local workspace dependencies into /app/out
RUN turbo prune gateway-service --docker

# Stage 3: Install production dependencies
FROM base AS installer
# Copy lockfile and package configuration files first to cache dependencies
COPY --from=pruner /app/out/json/ .
RUN bun install --production
COPY --from=pruner /app/out/full/ .

# Stage 4: Builder — full install + compile TypeScript to dist/
FROM base AS builder
COPY --from=pruner /app/out/json/ .
RUN bun install
COPY --from=pruner /app/out/full/ .
RUN bun run build

# Stage 6: Node.js runner (use: docker build --target runner-node .)
FROM node:22-slim AS runner
WORKDIR /app

COPY --from=builder /app/apps/gateway-service/dist ./dist
COPY --from=builder /app/apps/gateway-service/package.json ./package.json
COPY --from=installer /app/node_modules ./node_modules

USER node
EXPOSE 8080
EXPOSE 8081

ENTRYPOINT [ "npm", "run", "start" ]
