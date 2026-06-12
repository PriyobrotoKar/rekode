FROM oven/bun:1 AS base
WORKDIR /app

# Stage 2: Prune monorepo for the target application
FROM base AS pruner
RUN bun add -g turbo
COPY . .
# Extracts target package + local workspace dependencies into /app/out
RUN turbo prune gateway-service --docker

# Stage 3: Install dependencies and build project
FROM base AS installer
# Copy lockfile and package configuration files first to cache dependencies
COPY --from=pruner /app/out/json/ .
RUN bun install --production --frozen-lockfile
COPY --from=pruner /app/out/full/ .

FROM base AS runner
COPY --from=installer node_modules ./node_modules
COPY --from=installer ./src ./src
COPY --from=installer package.json ./package.json

USER bun
EXPOSE 8080
EXPOSE 8081

ENTRYPOINT [ "bun", "run", "dev" ]
