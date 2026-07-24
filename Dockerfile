# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* bun.lock ./
RUN npm install

COPY . .

# Set NITRO_PRESET to node-server for running on VPS/Node rather than Cloudflare
ENV NITRO_PRESET=node-server
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

COPY --from=builder /app/.output /app/.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
