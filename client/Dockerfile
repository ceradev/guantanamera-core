FROM node:20-alpine

WORKDIR /app

# pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Dependencias
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Código
COPY . .

# Argumentos de build
ARG NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN

# Build del dashboard
RUN pnpm build

# Puerto Next.js
EXPOSE 3000

# Arranque
CMD ["pnpm", "start"]
