# ---------- Base ----------
FROM node:20-alpine

# Directorio de trabajo
WORKDIR /app

# Habilitar pnpm (Node 20 trae corepack)
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copiar manifests
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar el resto del código
COPY . .

# Generar Prisma Client
RUN pnpm prisma generate

# Compilar TypeScript
RUN pnpm build

# Puerto de la API
EXPOSE 8000

# Arrancar la API
CMD ["node", "dist/index.js"]
