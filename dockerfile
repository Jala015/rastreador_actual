# Etapa 1: Build da aplicação
FROM node:23-alpine3.20 AS builder

WORKDIR /app
COPY . .

RUN npm ci
RUN npm run build

# -------------------------------------

# Etapa 2: Contêiner final
FROM node:23-alpine3.20

WORKDIR /app

COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

CMD ["node", "dist/index.js"]
