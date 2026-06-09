# Dockerfile – bygger og kjører Next.js + Payload i produksjon.
FROM node:22-slim AS base
WORKDIR /app
# openssl + ca-certificates trengs av Payload/Postgres-klienten
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# --- Avhengigheter ---
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# --- Bygg ---
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- Kjøretid ---
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/payload.config.ts ./payload.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/src ./src
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["npm", "run", "start"]
