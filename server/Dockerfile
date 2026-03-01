# ---------- Base ----------
FROM node:20-alpine

# Directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema necesarias para bcrypt y otros módulos nativos
RUN apk add --no-cache python3 make g++

# Copiar manifests
COPY package.json pnpm-lock.yaml* ./

# Instalar dependencias usando npm (más fiable en Docker para módulos nativos)
# Primero convertimos pnpm-lock.yaml a package-lock.json si es posible, 
# pero simplemente usar npm install suele funcionar bien si package.json está correcto.
RUN npm install

# Copiar el resto del código
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# Compilar TypeScript
RUN npm run build

# Puerto de la API
EXPOSE 8000

# Arrancar la API
CMD ["node", "dist/index.js"]
